# Módulo Equipos — Capa de Enriquecimiento, Editor y Salud del Inventario

**Fecha:** 2026-07-04  
**Estado:** Aprobado  
**Rama:** soportedesk-backend

## Contexto

El módulo de equipos lee de `vw_inv_computers_full` (GLPI MariaDB, solo lectura). GLPI es la fuente de verdad para hardware, software, red y usuario de dominio. SoporteDesk actúa como **capa editora + reportadora** encima de GLPI: guarda enriquecimientos en `ssti` (SQL Server) sin tocar la BD GLPI.

Los problemas que resuelve este diseño:
- GLPI no captura código patrimonial institucional, estado de depuración ni observaciones internas.
- Los tipos de equipo vienen como strings libres de GLPI (`"PC"`, `"Desktop"`, `"Notebook"`) sin normalizar.
- No hay visibilidad de registros desactualizados o con datos incompletos para tareas de depuración.

## Rol de SoporteDesk

```
GLPI (MariaDB) ──read-only──► SoporteDesk Backend
                                     │
                    ssti (SQL Server) │  equipos_enrichment
                                      │  equipo_tipo_catalogo
                                      │  equipos_enrichment_historial
                                      │
                                      ▼
                              Frontend Angular ← editor + reportador
```

GLPI nunca recibe escrituras desde SoporteDesk.

## Modelo de Datos — 3 tablas nuevas en `ssti`

### `equipos_enrichment`

Un registro por equipo GLPI. Se crea la primera vez que un admin guarda datos para ese equipo.

```sql
CREATE TABLE equipos_enrichment (
    id                  BIGINT IDENTITY PRIMARY KEY,
    computer_id         BIGINT NOT NULL UNIQUE,   -- ComputerID de GLPI
    tipo_override       VARCHAR(80)   NULL,
    fabricante_override VARCHAR(100)  NULL,
    modelo_override     VARCHAR(100)  NULL,
    codigo_patrimonial  VARCHAR(50)   NULL,
    estado_depuracion   VARCHAR(30)   NULL,       -- ACTIVO | EN_REVISION | BAJA | EXTRAVIADO
    observaciones       VARCHAR(500)  NULL,
    revisado_por        VARCHAR(80)   NULL,        -- username del JWT
    fecha_revision      DATETIME      NULL
);
```

### `equipo_tipo_catalogo`

Mapea valores raw de GLPI → tipo normalizado institucional.

```sql
CREATE TABLE equipo_tipo_catalogo (
    id               BIGINT IDENTITY PRIMARY KEY,
    glpi_valor       VARCHAR(80)  NOT NULL UNIQUE,  -- valor exacto de GLPI
    tipo_normalizado VARCHAR(80)  NOT NULL,
    activo           BIT          NOT NULL DEFAULT 1
);

-- Datos iniciales de ejemplo
INSERT INTO equipo_tipo_catalogo (glpi_valor, tipo_normalizado) VALUES
('Desktop',  'Desktop'),
('PC',       'Desktop'),
('Notebook', 'Laptop'),
('Laptop',   'Laptop'),
('Tablet',   'Tablet'),
('Server',   'Servidor'),
('Servidor', 'Servidor');
```

### `equipos_enrichment_historial`

Una fila por cada campo modificado en cada operación de guardado.

```sql
CREATE TABLE equipos_enrichment_historial (
    id                  BIGINT IDENTITY PRIMARY KEY,
    computer_id         BIGINT        NOT NULL,
    campo               VARCHAR(80)   NOT NULL,
    valor_anterior      VARCHAR(500)  NULL,
    valor_nuevo         VARCHAR(500)  NULL,
    modificado_por      VARCHAR(80)   NOT NULL,
    fecha_modificacion  DATETIME      NOT NULL DEFAULT GETDATE()
);
CREATE INDEX ix_historial_computer_id ON equipos_enrichment_historial(computer_id);
```

## Lógica del tipo efectivo

Aplicada en `EquipoService` al construir el DTO de detalle:

```
tipo_efectivo =
  enrichment.tipo_override            (si no es NULL)
  ∨ catalogo[glpi.tipoEquipo]        (si existe mapeo activo)
  ∨ glpi.tipoEquipo                  (fallback raw)
```

## Backend

### Nuevos paquetes / clases

**`com.inia.soportedesk.equipos.enrichment`**
- `EquipoEnrichment` — entidad JPA → `equipos_enrichment`
- `EquipoEnrichmentHistorial` — entidad JPA → `equipos_enrichment_historial`
- `EquipoEnrichmentRepository` — `JpaRepository<EquipoEnrichment, Long>` con `findByComputerId`
- `EquipoEnrichmentHistorialRepository`
- `EquipoEnrichmentDto` — campos del formulario de mantenimiento
- `EquipoEnrichmentService` — lógica de merge, historial, auditoría
- `EquipoEnrichmentController` — endpoints REST

**`com.inia.soportedesk.catalogo`** (extensión del paquete existente)
- `TipoEquipoCatalogo` — entidad JPA → `equipo_tipo_catalogo`
- `TipoEquipoCatalogoRepository`
- `TipoEquipoCatalogoRequest` — DTO crear/editar
- `TipoEquipoCatalogoService`
- `TipoEquipoCatalogoController`

### Endpoints nuevos

**Enriquecimiento:**
```
GET    /api/equipos/{id}/enrichment    → EquipoEnrichmentDto | 204
PUT    /api/equipos/{id}/enrichment    → EquipoEnrichmentDto (upsert)
GET    /api/equipos/{id}/historial     → List<HistorialItemDto> desc
```

**Salud del inventario:**
```
GET    /api/equipos/salud              → List<EquipoSaludDto>
```

`EquipoSaludDto` incluye campos de `VwInvComputerFull` más:
- `sinEncendidoMeses` (Long) — meses desde `ultimoEncendido`; -1 si nunca encendido
- `sinActualizacionMeses` (Long) — meses desde `ultimaActualizacion`; indica agente GLPI inactivo
- `nivelAlerta` (String) — `OK` / `AMARILLO` (sin encender >6m O sin actualizar >3m) / `ROJO` (sin encender >12m, nunca encendido, o sin actualizar >6m)
- `sinCodigoPatrimonial` (boolean) — `codigo_patrimonial IS NULL` en enrichment
- `sinUsuario` (boolean) — `usuarioContacto IS NULL` en GLPI
- `sinSede` (boolean) — `sedeNombre IS NULL` en GLPI
- `estadoDepuracion` (String) — del overlay (`ACTIVO` por defecto)

**Catálogo tipos de equipo:**
```
GET    /api/catalogo/tipo-equipo          → List<TipoEquipoCatalogoDto>
POST   /api/catalogo/tipo-equipo          → TipoEquipoCatalogoDto
PUT    /api/catalogo/tipo-equipo/{id}     → TipoEquipoCatalogoDto
DELETE /api/catalogo/tipo-equipo/{id}     → 204 (soft delete: activo=false)
```

### Auditoría del PUT enrichment

`EquipoEnrichmentService.save(computerId, dto, username)`:
1. Buscar o crear `EquipoEnrichment` por `computerId`
2. Por cada campo del DTO: si el valor cambió, insertar fila en `equipos_enrichment_historial`
3. Actualizar `revisado_por` y `fecha_revision`
4. Guardar

### Autorización

| Endpoint | Rol requerido |
|---|---|
| `GET /api/equipos/**` | `READ_equipos` o `ADMIN` (sin cambio) |
| `PUT /api/equipos/{id}/enrichment` | `WRITE_equipos` o `ADMIN` |
| `GET /api/equipos/{id}/historial` | `READ_equipos` o `ADMIN` |
| `GET /api/equipos/salud` | `READ_equipos` o `ADMIN` |
| `POST/PUT/DELETE /api/catalogo/tipo-equipo` | `ADMIN` |

El permiso `WRITE_equipos` se agrega al enum `Modulos` y a la migración SQL de permisos.

## Frontend

### Lista `/equipos` — mejoras

1. **Badge de salud** en columna nueva de `GenericTable` y tarjetas móviles:
   - Sin alerta: círculo verde
   - `AMARILLO`: círculo amarillo + tooltip "Sin encender >6 meses" o "Datos incompletos"
   - `ROJO`: círculo rojo + tooltip "Sin encender >12 meses"

2. **Tab "Salud del Inventario"** dentro del componente `EquiposListComponent`:
   - Toggle entre tab "Inventario" (vista actual) y tab "Salud"
   - Tab Salud carga `/api/equipos/salud`; muestra equipos con alertas, ordenados ROJO→AMARILLO
   - KPI cards adicionales: "Sin encender >12m", "Sin patrimonial", "Sin usuario"

3. **Filtro "Estado"** en barra de filtros: `Todos / En revisión / Baja / Sin patrimonial / Sin usuario`

### Detalle `/equipos/:id` — sección Mantenimiento

Nueva sección al final, solo visible para `ADMIN` o `WRITE_equipos` (directiva `*ifAdmin` existente):

```
┌─ Mantenimiento ──────────────────────────────────────┐
│  Tipo efectivo: Desktop  (GLPI: "PC")                │
│                                                      │
│  Tipo override:       [____________]                 │
│  Código patrimonial:  [____________]                 │
│  Estado depuración:   [▼ ACTIVO   ]                  │
│  Fabricante override: [____________]                 │
│  Modelo override:     [____________]                 │
│  Observaciones:       [____________]                 │
│                             [Guardar cambios]        │
├─ Historial ──────────────────────────────────────────│
│  04/07/2026 gvivanco  tipo_override     PC → Desktop │
│  03/07/2026 gvivanco  estado_depuracion null→ACTIVO  │
└──────────────────────────────────────────────────────┘
```

- Form reactivo (`FormGroup`)
- Al abrir la sección: `GET /api/equipos/{id}/enrichment` + `GET /api/equipos/{id}/historial`
- Al guardar: `PUT /api/equipos/{id}/enrichment`; el historial se recarga automáticamente
- Mostrar "tipo efectivo" con indicador del origen (override / catálogo / GLPI raw)

### Catálogo — nueva entrada "Tipos de Equipo"

En el módulo de catálogos existente, nueva entrada que sigue el patrón de `TipoBien` / `TipoImpresora`:
- `TipoEquipoCatalogoComponent` con `GenericTable`
- Columnas: Valor GLPI, Tipo Normalizado, Activo
- Formulario create/edit en modal (mismo patrón que otros catálogos)

### Nuevos archivos frontend

```
features/equipos/
  equipos-salud.component.ts/.html/.scss   ← tab de salud
  equipo-enrichment-form.component.ts/.html/.scss  ← sección mantenimiento
  equipo-historial.component.ts/.html/.scss         ← historial de cambios

features/catalogo/
  tipo-equipo-catalogo/
    tipo-equipo-catalogo.component.ts/.html/.scss
```

Modelos nuevos en `equipo.model.ts`:
```typescript
export interface EquipoEnrichmentDto { ... }
export interface EquipoSaludDto extends EquipoResumen { nivelAlerta, sinCodigoPatrimonial, ... }
export interface HistorialItemDto { campo, valorAnterior, valorNuevo, modificadoPor, fecha }
```

## Migración SQL

```sql
-- Archivo: docs/superpowers/migrations/2026-07-04-equipos-enrichment.sql
-- Ejecutar en ssti (SQL Server)

CREATE TABLE equipos_enrichment ( ... );
CREATE TABLE equipo_tipo_catalogo ( ... );
CREATE TABLE equipos_enrichment_historial ( ... );

-- Datos iniciales catálogo tipos
INSERT INTO equipo_tipo_catalogo ...

-- Permiso nuevo
INSERT INTO modulos_permisos (nombre, descripcion)
VALUES ('WRITE_equipos', 'Editar enriquecimiento de equipos GLPI');
```

## Criterios de éxito

1. Un admin puede abrir cualquier equipo GLPI y guardar código patrimonial, estado y observaciones; el historial registra el cambio con su username.
2. El tipo efectivo mostrado en lista y detalle aplica override → catálogo → raw correctamente.
3. El admin puede gestionar el catálogo de tipos (crear, editar, desactivar mapeos).
4. La tab "Salud del Inventario" muestra equipos ROJO/AMARILLO con sus criterios de alerta.
5. Los cambios en SoporteDesk no afectan en ningún momento la BD GLPI.

## Archivos existentes modificados

**Backend:**
- `EquipoService.java` — extender `findById` para aplicar tipo efectivo
- `EquipoDetalleResponse.java` — agregar campo `tipoEfectivo` y `enrichment`
- `Modulos.java` — agregar `WRITE_equipos`
- `SecurityConfig.java` — autorizar nuevos endpoints

**Frontend:**
- `equipo.model.ts` — nuevas interfaces
- `equipo.service.ts` — nuevos métodos (`getEnrichment`, `saveEnrichment`, `getHistorial`, `getSalud`)
- `equipo-detail.component.ts/.html` — agregar sección Mantenimiento
- `equipos-list.component.ts/.html` — agregar tab Salud + badge alerta
- Módulo de catálogos — agregar entrada TipoEquipo
