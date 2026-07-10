# Módulo Equipos — Modal de Enriquecimiento + Campos de Ubicación/Serie + Alertas Ampliadas

**Fecha:** 2026-07-10
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Precedente:** [2026-07-09-modulo-equipos-tres-caras-design.md](2026-07-09-modulo-equipos-tres-caras-design.md) (rediseño en 3 caras ya implementado; este spec construye sobre la cara Mantenimiento)

---

## 1. Objetivo

Hoy, para editar el enriquecimiento de un equipo (código patrimonial, tipo, estado, observaciones)
hay que navegar a la ficha completa (`/equipos/:id`), lo que rompe la continuidad de una búsqueda o
filtro activo en la cola de Mantenimiento. Además, el campo "Tipo (override)" es texto libre (no
usa el catálogo ya existente) y no hay forma de registrar sede/dependencia/subdependencia/número de
serie cuando GLPI no los tiene.

Este cambio:
1. Mueve la edición del enriquecimiento a un **modal**, abierto desde la cola de Mantenimiento —
   sin navegar fuera de la tabla filtrada.
2. Convierte "Tipo (override)" en un selector sobre el catálogo `TipoEquipoCatalogo`.
3. Agrega campos de override para Sede/Dependencia/Subdependencia (vía el catálogo institucional,
   selector en cascada) y Número de serie (texto libre).
4. Amplía los criterios de "incompleto" de la cola de Mantenimiento para incluir estos campos
   nuevos.

## 2. Modelo de datos

### `EquipoEnrichment` — columnas nuevas

```java
@ManyToOne
@JoinColumn(name = "sede_id")
private Sede sede;

@ManyToOne
@JoinColumn(name = "dependencia_id")
private Dependencia dependencia;

@ManyToOne
@JoinColumn(name = "subdependencia_id")
private Subdependencia subdependencia;

@Column(name = "numero_serie_override")
private String numeroSerieOverride;
```

`tipoOverride` se queda como `String` en la entidad — el cambio de "texto libre" a "selector" es
solo de frontend (restringe qué valores se pueden escribir, no cambia el esquema).

### Migración SQL

Archivo: `docs/superpowers/migrations/2026-07-10-equipos-enrichment-ubicacion.sql`

```sql
ALTER TABLE equipos_enrichment ADD sede_id BIGINT NULL;
ALTER TABLE equipos_enrichment ADD dependencia_id BIGINT NULL;
ALTER TABLE equipos_enrichment ADD subdependencia_id BIGINT NULL;
ALTER TABLE equipos_enrichment ADD numero_serie_override VARCHAR(100) NULL;

ALTER TABLE equipos_enrichment ADD CONSTRAINT FK_equipos_enrichment_sede
    FOREIGN KEY (sede_id) REFERENCES sedes(id);
ALTER TABLE equipos_enrichment ADD CONSTRAINT FK_equipos_enrichment_dependencia
    FOREIGN KEY (dependencia_id) REFERENCES dependencias(id);
ALTER TABLE equipos_enrichment ADD CONSTRAINT FK_equipos_enrichment_subdependencia
    FOREIGN KEY (subdependencia_id) REFERENCES subdependencias(id);
```

### `EquipoEnrichmentDto` — forma nueva

```java
public class EquipoEnrichmentDto {
    private String tipoOverride;
    private String fabricanteOverride;
    private String modeloOverride;
    private String codigoPatrimonial;
    private Long sedeId;
    private String sedeNombre;
    private Long dependenciaId;
    private String dependenciaNombre;
    private Long subdependenciaId;
    private String subdependenciaNombre;
    private String numeroSerieOverride;
    private String estadoDepuracion;
    private String observaciones;
    private String revisadoPor;
    private LocalDateTime fechaRevision;
}
```

## 3. Backend — `EquipoEnrichmentService`

Se inyectan `SedeRepository`, `DependenciaRepository`, `SubdependenciaRepository` (paquete
`catalogo`, ya existen).

**`save(computerId, dto, username)`:**
- Resuelve `Sede`/`Dependencia`/`Subdependencia` por `dto.getSedeId()`/`getDependenciaId()`/
  `getSubdependenciaId()` (si son `null`, la relación queda `null`).
- El historial (`recordChange`) para estos 3 campos compara y guarda el **nombre** (no el id) —
  igual que los demás campos del historial, deben ser legibles para quien lo audite.
- Se agrega `recordChange` para `numero_serie_override` (mismo patrón que `fabricante_override`).

**`toDto(entity)`:** agrega `sedeId`/`sedeNombre` (y análogos para dependencia/subdependencia)
leyendo de `entity.getSede()`, `null`-safe. Agrega `numeroSerieOverride`.

## 4. Backend — `EquipoService`, criterios de "incompleto"

`calcularSalud()` (ya extraído en el rediseño de 3 caras) se amplía. Regla uniforme: un dato
cuenta como "presente" si GLPI lo tiene **o** si el enriquecimiento lo tiene (mismo criterio que
ya usa `sinPatrimonial` hoy):

```java
boolean sinSede           = blank(e.getSedeNombre())  && (enrichment == null || enrichment.getSede() == null);
boolean sinDependencia    = blank(e.getOficinaId())   && (enrichment == null || enrichment.getDependencia() == null);
boolean sinSubdependencia = blank(e.getUnidadId())    && (enrichment == null || enrichment.getSubdependencia() == null);
boolean sinNumeroSerie    = blank(e.getNumeroserie()) && (enrichment == null || blank(enrichment.getNumeroSerieOverride()));
```

`SaludCalculo` y `EquipoSaludDto` ganan `sinDependencia`, `sinSubdependencia`, `sinNumeroSerie`.

`getSalud()` amplía su filtro:

```java
.filter(s -> !s.nivelAlerta().equals("OK")
          || s.sinCodigoPatrimonial()
          || s.sinUsuario()
          || s.sinSede()
          || s.sinDependencia()
          || s.sinSubdependencia()
          || s.sinNumeroSerie())
```

`EquipoSaludResumen`/`getDashboardCompleto()` **no se tocan** en este cambio (fuera de alcance,
ver sección 8).

## 5. Frontend — ficha (`EquipoDetailComponent`)

Se elimina por completo la sección "Mantenimiento / Enriquecimiento" del template (inputs,
`<select>` de estado, textarea de observaciones, botón "Guardar cambios", bloque de historial) y
del componente (`enrichment` signal, `historial` signal, `savingEnrichment`, `saveSuccess`,
`saveEnrichment()`, `updateField()`, las llamadas a `getEnrichment`/`getHistorial` en
`ngOnInit`). La ficha queda 100% informativa sobre GLPI: asignación, hardware, monitores, teclado,
software. El badge de `tipoEfectivo` en el header **se mantiene** (sigue siendo información útil,
no es un control de edición).

`EquipoDetalleResponse` pierde el campo `enrichment` (ya no lo consume nadie) — conserva
`tipoEfectivo`. `equipo.model.ts` ajusta `EquipoDetalleResponse` en consecuencia.

## 6. Frontend — catálogo de tipos, endpoint de lectura

El modal necesita los valores distintos de `tipoNormalizado`. Se usa el endpoint ya existente
`GET /api/catalogos/tipo-equipo` (sin `@PreAuthorize`, público para cualquier autenticado) y en el
frontend se deriva la lista de `tipoNormalizado` únicos a partir de la respuesta completa (no hace
falta un endpoint nuevo).

## 7. Frontend — `EquipoEnrichmentModalComponent` (nuevo)

Standalone, usa `<app-modal>` (compartido) + `<app-ubicacion-select>` (compartido, con
`[showTipoContrato]="false"`).

**Inputs/Outputs:**
```typescript
@Input({ required: true }) open = false;
@Input({ required: true }) computerId!: number;
@Input({ required: true }) nombreEquipo!: string;
@Output() closed = new EventEmitter<void>();
@Output() saved = new EventEmitter<void>();   // el padre recarga la cola de salud
```

**Contenido:**
- Header: `nombreEquipo` (solo lectura)
- Form reactivo: Tipo (`<select>` de `tipoNormalizado` distintos), Fabricante override, Modelo
  override, Código patrimonial, `<app-ubicacion-select>` (sede/dependencia/subdependencia),
  Número de serie override, Estado depuración (`<select>`, valores ya existentes), Observaciones
  (`textarea`)
- Historial de cambios (tabla, se muda aquí desde la ficha, misma forma que antes)
- Botón "Ver ficha completa" → `router.navigate(['/equipos', computerId])`
- Al abrir (`ngOnChanges` en `computerId`/`open`): `GET /{id}/enrichment` + `GET /{id}/historial` +
  `GET /api/catalogos/tipo-equipo`
- Al guardar: `PUT /{id}/enrichment`, recarga historial local, emite `saved` (el padre
  —`EquiposMantenimientoComponent`— recarga `getSalud()`, el equipo puede desaparecer de la lista
  si ya quedó completo)

## 8. Frontend — `EquiposMantenimientoComponent`

El botón "Ver" de cada fila de la tabla de salud deja de navegar a `/equipos/:id` — ahora abre el
modal (`abrirModal(item)` → setea `computerId`/`nombreEquipo` y `modalOpen = true`). Al cerrar o
guardar el modal, si hubo guardado, se recarga `loadSalud()`.

## 9. Manejo de errores

- Guardar enriquecimiento: mismo patrón ya existente (frontend deshabilita el botón mientras
  guarda, muestra "Guardado correctamente" o deja el error visible sin cerrar el modal).
- Carga de catálogo de tipos: si falla, el `<select>` de Tipo queda vacío pero el resto del form
  sigue usable (no bloquea guardar los demás campos).

## 10. Pruebas

- **Backend unit** (`EquipoEnrichmentServiceTest`): guardar con `sedeId`/`dependenciaId`/
  `subdependenciaId` resuelve las entidades correctas; `toDto()` devuelve nombre + id; el
  historial registra el nombre (no el id) al cambiar sede/dependencia/subdependencia/serie.
- **Backend unit** (`EquipoServiceTest`): para cada flag nuevo — GLPI vacío sin override (`true`),
  GLPI vacío con override presente (`false`), GLPI con dato (`false` sin importar el override); y
  que `getSalud()` incluya un equipo que solo falla por `sinDependencia`/`sinSubdependencia`/
  `sinNumeroSerie`.
- **Frontend**: sin specs existentes que migrar. Verificación manual: abrir el modal desde
  Mantenimiento, guardar con los campos nuevos, confirmar que el equipo sale de la cola si ya
  quedó completo, confirmar que la ficha ya no muestra la sección de enriquecimiento.

## 11. Fuera de alcance

- `EquipoSaludResumen` / Dashboard de Equipos — no se tocan, se quedan con sus 3 contadores
  actuales (sin patrimonial/usuario/sede). Seguimiento aparte si se quiere ampliar.
- Alta de tipos nuevos en `TipoEquipoCatalogo` desde este modal (se gestiona desde Catálogos).
- Inventario — no cambia, sigue mostrando solo datos crudos de GLPI, sin acceso al modal.
- Cualquier escritura a GLPI (sigue siendo solo lectura).

## 12. Decisiones registradas

| Tema | Decisión |
|---|---|
| Punto de entrada del modal | Solo desde Mantenimiento (reemplaza la navegación a la ficha en esa tabla) |
| Sede/Dependencia/Subdependencia override | FK al catálogo institucional vía `UbicacionSelectComponent`, no texto libre |
| Tipo override | Selector de `tipoNormalizado` existentes en `TipoEquipoCatalogo`, sin alta inline |
| Alcance del override | Solo afecta el chequeo de "completo" + se ve/edita en el modal — no se propaga a Inventario ni a la ficha |
| Sección de enriquecimiento en la ficha | Se elimina por completo — edición y consulta quedan solo en el modal |
| Criterio de "incompleto" | GLPI **o** override — si cualquiera tiene valor, ya no alerta (mismo criterio que ya usaba `sinPatrimonial`) |
| Dashboard | No se toca en este cambio |
| Historial de sede/dependencia/subdependencia | Se registra por nombre, no por id, para que sea legible |
