# Catálogo Marca → Modelo → Tóner para Impresoras

**Fecha:** 2026-06-28
**Estado:** Aprobado, pendiente de plan de implementación

## Contexto y motivación

Hoy en `Impresora`, `marca` y `modelo` son campos de texto libre, y los 4 tóner (`modeloTonerNegro/C/M/Y`) también son texto libre por unidad. Esto genera dos problemas:

1. **Inconsistencia de datos**: dos técnicos registrando la misma impresora pueden escribir "HP M404dn" vs "Hp M404 dn", o el mismo tóner como "CF259A" vs "cf259a" — nada los amarra.
2. **El widget de planificación de consumibles (`ImpresoraResumenComponent`)** agrupa y cuenta tóner por sede/dependencia para apoyar compras, pero como hoy agrupa por el string literal ingresado, cualquier inconsistencia de tipeo rompe el conteo (la misma compra real aparece como dos filas distintas).

La solución: mover marca, modelo y tóner a catálogos administrados (vía `/catalogos`, solo ADMIN), de forma que al registrar una impresora el técnico solo *elige* un modelo ya catalogado y el tóner correcto queda automáticamente determinado — sin tipeo libre, sin inconsistencias.

Caso real reportado por el usuario: un mismo modelo de impresora suele tener **más de una variante de tóner por color** (ej. "Estándar" y "Alto rendimiento", y a veces más). El diseño soporta un número no acotado de variantes por color.

## Modelo de datos

### `marcas_impresora` (catálogo plano, nuevo)

```sql
IF OBJECT_ID(N'dbo.marcas_impresora', N'U') IS NULL
CREATE TABLE dbo.marcas_impresora (
    id     BIGINT        NOT NULL IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_marcas_impresora        PRIMARY KEY (id),
    CONSTRAINT UQ_marcas_impresora_nombre UNIQUE      (nombre)
);
```

Mismo patrón exacto que `tipos_impresora`/`tipos_bien`/`tipos_licencia` (catálogo de un solo campo `nombre`, gestionado en `/catalogos`).

### `modelos_impresora` (cuelga de una marca, nuevo)

```sql
IF OBJECT_ID(N'dbo.modelos_impresora', N'U') IS NULL
CREATE TABLE dbo.modelos_impresora (
    id        BIGINT        NOT NULL IDENTITY(1,1),
    marca_id  BIGINT        NOT NULL,
    nombre    NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_modelos_impresora      PRIMARY KEY (id),
    CONSTRAINT FK_modelos_impresora_marca FOREIGN KEY (marca_id) REFERENCES dbo.marcas_impresora (id) ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT UQ_modelos_impresora_marca_nombre UNIQUE (marca_id, nombre)
);
```

Mismo patrón jerárquico que `Sede → Dependencia` (FK obligatoria al padre, sin cascada de borrado para evitar pérdida accidental).

### `modelo_impresora_toners` (tabla hija, nuevo — N variantes de tóner por color, sin límite)

```sql
IF OBJECT_ID(N'dbo.modelo_impresora_toners', N'U') IS NULL
CREATE TABLE dbo.modelo_impresora_toners (
    id                   BIGINT        NOT NULL IDENTITY(1,1),
    modelo_impresora_id  BIGINT        NOT NULL,
    color                NVARCHAR(20)  NOT NULL,
    variante             NVARCHAR(50)  NOT NULL,
    codigo               NVARCHAR(80)  NOT NULL,
    CONSTRAINT PK_modelo_impresora_toners PRIMARY KEY (id),
    CONSTRAINT FK_modelo_impresora_toners_modelo FOREIGN KEY (modelo_impresora_id)
        REFERENCES dbo.modelos_impresora (id) ON DELETE CASCADE,
    CONSTRAINT UQ_modelo_impresora_toners UNIQUE (modelo_impresora_id, color, variante)
);
```

- `color`: uno de `Negro` / `Cyan` / `Magenta` / `Amarillo` — enforced por dropdown en frontend, sin `CHECK` en BD (mismo criterio ya usado para `estado` y `tipo_conexion` en `impresoras`: decisión deliberada de no usar enum/CHECK).
- `variante`: texto libre tipeado por el ADMIN al catalogar (ej. "Estándar", "Alto rendimiento", "Extra alto rendimiento", o cualquier otra etiqueta que use el fabricante).
- `codigo`: el SKU/código del cartucho (ej. "CF259A").
- `ON DELETE CASCADE`: si se borra un modelo, sus filas de tóner se borran con él (igual que `licencia_activaciones` con `licencias`).

Este patrón (tabla padre con `@OneToMany(cascade=ALL, orphanRemoval=true)` + tabla hija con `ON DELETE CASCADE`) es el mismo que ya existe en el código para `Licencia → LicenciaActivacion`.

### `impresoras` (modificada)

Se eliminan: `marca`, `modelo`, `modelo_toner_negro`, `modelo_toner_c`, `modelo_toner_m`, `modelo_toner_y` (5 columnas).
Se agrega: `modelo_impresora_id BIGINT NOT NULL` con FK a `modelos_impresora(id)`.

`tipo_impresora_id` (catálogo "Láser"/"Multifuncional"/etc.) **no se toca** — sigue siendo un campo independiente, sin relación con el modelo.

```sql
ALTER TABLE dbo.impresoras DROP COLUMN marca, modelo, modelo_toner_negro, modelo_toner_c, modelo_toner_m, modelo_toner_y;
ALTER TABLE dbo.impresoras ADD modelo_impresora_id BIGINT NOT NULL
    CONSTRAINT FK_impresoras_modelo FOREIGN KEY REFERENCES dbo.modelos_impresora (id);
```

**Nota de migración:** la tabla `impresoras` está vacía o casi vacía en el entorno actual. Si el `ALTER ADD ... NOT NULL` falla por alguna fila existente, el usuario debe limpiar/reasignar esas filas manualmente en SSMS antes de continuar (mismo criterio que migraciones anteriores de este módulo — no se backfillea automáticamente).

## Backend

### Catálogo `MarcaImpresora`

Calco exacto de `TipoImpresora`: `MarcaImpresora` (entity), `MarcaImpresoraRepository`, `MarcaImpresoraService`, `MarcaImpresoraRequest` (`{nombre}`), `MarcaImpresoraController`.

- `GET /api/catalogos/marcas-impresora` — cualquier usuario autenticado.
- `POST/PUT/DELETE /api/catalogos/marcas-impresora{,/{id}}` — `@PreAuthorize("hasRole('ADMIN')")`.

### Catálogo `ModeloImpresora`

Calco del patrón `Licencia` + `LicenciaActivacion`:

- `ModeloImpresora` entity: `marca` (`@ManyToOne(fetch=EAGER)`, FK `marca_id`), `nombre`, `toners` (`@OneToMany(mappedBy="modeloImpresora", cascade=CascadeType.ALL, orphanRemoval=true, fetch=FetchType.EAGER) @OrderBy("id ASC")`).
- `ModeloImpresoraToner` entity: `modeloImpresora` (`@JsonIgnore @ManyToOne(fetch=LAZY)`, FK `modelo_impresora_id`), `color`, `variante`, `codigo`.
- `ModeloImpresoraRequest`: `marcaId` (`@NotNull`), `nombre` (`@NotBlank`), `toners: List<TonerRequest>` con clase anidada estática `TonerRequest { @NotBlank color; @NotBlank variante; @NotBlank codigo; }`.
- `ModeloImpresoraService.copyFields()`:
  - Resuelve `marcaId` → `MarcaImpresora` o `ResourceNotFoundException`.
  - `modeloImpresora.getToners().clear()` + reconstruye la lista desde `request.getToners()` — idéntico a `LicenciaService.copyFields()` con `activaciones`. Si `toners` viene vacío, se guarda el modelo sin tóner (no es error — un modelo recién creado puede no tener el dato aún).
- `GET /api/catalogos/modelos-impresora?marcaId=` (filtro opcional, mismo patrón que `getDependencias(sedeId?)`) — cualquier autenticado.
- `POST/PUT/DELETE` — solo `ROLE_ADMIN`.

### `Impresora` / `ImpresoraRequest` / `ImpresoraService`

- Se quitan de la entidad y del DTO: `marca`, `modelo`, `modeloTonerNegro`, `modeloTonerC`, `modeloTonerM`, `modeloTonerY`.
- Se agrega: `modeloImpresora` (`@ManyToOne(fetch=FetchType.EAGER)`, `@JoinColumn(name="modelo_impresora_id", nullable=false)`) en la entidad; `modeloImpresoraId` (`@NotNull`) en `ImpresoraRequest`.
- `ImpresoraService.copyFields()`: `impresora.setModeloImpresora(modeloImpresoraRepository.findById(request.getModeloImpresoraId()).orElseThrow(() -> new ResourceNotFoundException(...)))` — sin ternario null-safe, porque ahora es obligatorio (igual de obligatorio que antes lo eran `marca`/`modelo`).
- `tipoImpresora` no cambia.

### `ImpresoraRepository.search()`

El JPQL pasa de buscar `LOWER(i.marca)`/`LOWER(i.modelo)` a buscar a través de la relación:

```java
@Query("SELECT i FROM Impresora i " +
       "LEFT JOIN i.modeloImpresora mi LEFT JOIN mi.marca ma " +
       "LEFT JOIN i.sede s LEFT JOIN i.dependencia d WHERE " +
       "LOWER(ma.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
       "LOWER(mi.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
       "LOWER(s.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
       "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
       "LOWER(i.serie) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
       "LOWER(i.codigoInventario) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
       "LOWER(i.codigoPatrimonial) LIKE LOWER(CONCAT('%', :search, '%'))")
```

### Driver upload/download

Sin cambios — `/api/impresoras/{id}/driver` no tiene relación con marca/modelo/tóner.

## Frontend

### `/catalogos` — 2 pestañas nuevas

- **"Marcas de Impresora"**: reusa el patrón genérico ya existente en `catalogos.component.ts` (`nombreForm` + rama en el if/else de `submitSimple()`/`deleteItem()`), igual que `tiposImpresora`.
- **"Modelos de Impresora"**: requiere más que el patrón genérico (selector de marca + nombre + lista dinámica de tóner), así que se extrae un componente dedicado `ModeloImpresoraFormComponent`:
  - `FormArray` de tóner con `addToner()` / `removeToner(index)` — calco exacto del patrón `activaciones`/`addActivacion()`/`removeActivacion()` que ya usa `LicenciaFormComponent`.
  - Cada fila de tóner: select Color (Negro/Cyan/Magenta/Amarillo) + input texto Variante + input texto Código + botón quitar.
  - El listado de modelos ya creados se muestra agrupado por marca, con sus filas de tóner visibles debajo de cada modelo (lectura), y acciones editar/eliminar.
  - `catalogos.component.html` hospeda este componente dentro de la pestaña "Modelos de Impresora", mismo contrato `@Input`/`@Output` (`saved`/`cancelled`) que el resto de forms de feature.

### `core/models/catalogo.model.ts` y `core/catalogos/catalogo.service.ts`

- Nuevas interfaces: `MarcaImpresora { id; nombre }`, `ModeloImpresoraToner { id?; color; variante; codigo }`, `ModeloImpresora { id; nombre; marca: MarcaImpresora; toners: ModeloImpresoraToner[] }`, `ModeloImpresoraRequest { marcaId; nombre; toners: ModeloImpresoraToner[] }`.
- Nuevos métodos CRUD en `CatalogoService`: `getMarcasImpresora/create/update/delete`, `getModelosImpresora(marcaId?)/create/update/delete` — mismo patrón que los métodos existentes de `Dependencia`/`TipoImpresora`.

### `features/impresoras/impresora.model.ts`

- Se quitan de `Impresora`/`ImpresoraRequest`: `marca`, `modelo`, `modeloTonerNegro/C/M/Y`.
- Se agrega: `modeloImpresora: ModeloImpresora` en `Impresora` (importado desde `catalogo.model.ts`); `modeloImpresoraId: number | null` en `ImpresoraRequest`.

### `impresora-form.component` (alta/edición de impresora)

- Los inputs de texto "Marca"/"Modelo" se reemplazan por 2 selects en cascada: Marca → Modelo (el segundo se filtra por la marca elegida, recargando vía `getModelosImpresora(marcaId)`). Cascada de 2 niveles manejada directo en este componente (no amerita extraer un shared component nuevo, a diferencia de `UbicacionSelect` que cubre 4 niveles reusados en 4 forms distintos).
- Al elegir el Modelo, se muestra debajo un bloque de solo lectura "Tóner de este modelo" listando cada `(color, variante, código)` del modelo seleccionado — informativo, no editable.
- Se quitan los 4 inputs de tóner del formulario (`modeloTonerNegro/C/M/Y` y sus validators).

### `impresora-ficha.component` (modal "Ficha técnica")

- Sección "Identificación": `impresora.modeloImpresora.marca.nombre` + `impresora.modeloImpresora.nombre` en vez de `impresora.marca`/`impresora.modelo`.
- Tab "Consumibles": en vez de 4 tarjetas fijas (`hasConsumibles()` + 4 campos), itera `impresora.modeloImpresora.toners` agrupado por `color`, mostrando cada `variante`/`codigo` dentro de su grupo de color (ej. "Negro: Estándar — CF259A" y "Negro: Alto rendimiento — CF259X" como dos líneas bajo "Negro").

### `impresora-resumen.component` (widget de planificación de consumibles por sede/dependencia)

- En vez de iterar `CONSUMIBLE_DEFS` (4 keys fijas de texto libre en `Impresora`), recorre `imp.modeloImpresora?.toners` de cada impresora filtrada y agrupa por `(color, variante, código)` real del catálogo.
- Esto es la mejora central que motiva el cambio: hoy el conteo se rompe por inconsistencias de tipeo; con el catálogo, cada SKU de tóner cuenta de forma confiable sin importar quién registró la impresora.

### `impresoras-list.component`

- Columnas de tabla: `{ key: 'modeloImpresora.marca.nombre', label: 'Marca' }` y `{ key: 'modeloImpresora.nombre', label: 'Modelo' }` en vez de `marca`/`modelo` directos (el `GenericTableComponent` ya soporta keys con notación de punto anidada, como ya se usa para `tipoImpresora.nombre`/`sede.nombre`).

## Impacto en tests existentes

Los siguientes tests quedan rotos por el cambio de forma esperada y deben actualizarse como parte del plan (no se detalla aquí, es trabajo de la fase de implementación):

- `ImpresoraServiceTest`, `ImpresoraControllerIT`, `ImpresoraDriverControllerIT` (este último usa `imp.setMarca("HP")`/`imp.setModelo(...)` directamente — debe pasar a usar un `ModeloImpresora` de prueba).
- Specs de Angular para `impresora-form`, `impresora-ficha` (`impresora-form.component.spec.ts`, `impresora-ficha.component.spec.ts`).

## Fuera de alcance

- No se migran datos existentes de `impresoras` (la tabla está vacía o casi vacía).
- `tipoImpresora` ("Láser"/"Multifuncional"/etc.) no se relaciona con el modelo — sigue siendo una elección independiente en el form, sin cambios.
- No se agrega validación de `color` con `CHECK` en BD ni enum en backend — se confía en el dropdown del frontend, mismo criterio que `estado`/`tipoConexion`.
- No se permite crear un modelo "al vuelo" desde el formulario de Impresora — los modelos se catalogan primero en `/catalogos` por un ADMIN.
