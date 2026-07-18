# Módulo Impresoras — Intervenciones (historial de mantenimiento) por impresora

**Fecha:** 2026-07-17
**Estado:** Diseño aprobado — pendiente de plan de implementación

---

## 1. Objetivo

El módulo de Impresoras no tiene forma de dejar constancia de las intervenciones/mantenimientos
que recibe cada equipo (cambio de repuesto, limpieza, reparación, etc.). Se agrega
**Intervenciones**: por cada impresora, un historial de registros con **fecha, observación y uno
o varios archivos adjuntos** (foto o documento) que sirvan de evidencia de lo realizado.

A diferencia de Evidencias en Equipos (spec `2026-07-15-equipos-evidencias-design.md`, un modelo
plano de "una fila = una foto"), acá cada intervención agrupa **varios** adjuntos bajo una misma
fecha/observación, y la fecha/observación **sí se puede editar** después de creada (a diferencia de
Evidencias, que no permite editar). Esto obliga a un modelo a dos niveles: `Intervencion` (padre) y
`Adjunto` (hijo, 0..N por intervención).

## 2. Modelo de datos

### `ImpresoraIntervencion` (entidad nueva, tabla `impresoras_intervenciones`)

```java
@Entity
@Table(name = "impresoras_intervenciones")
public class ImpresoraIntervencion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "impresora_id", nullable = false)
    private Long impresoraId;         // FK real a impresoras(id) — Impresora es tabla propia de
                                       // SoporteDesk (no viene de GLPI), a diferencia de Equipo

    @Column(nullable = false)
    private LocalDate fecha;          // fecha de la intervención (editable)

    @Column(nullable = false, length = 1000)
    private String observacion;       // editable

    @Column(name = "registrado_por", nullable = false)
    private String registradoPor;     // username, de Authentication — se fija al crear, no cambia

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;
}
```

No lleva `@ManyToOne` a `Impresora` (se mantiene el mismo estilo "FK suelta" que ya usa
`EquipoEvidencia`/`EquipoEnrichment` en el resto del proyecto, para no arrastrar fetch eager de
catálogos de `Impresora` al listar intervenciones). La integridad sí se garantiza a nivel de base
de datos con una FK real (`REFERENCES impresoras(id) ON DELETE CASCADE`), porque a diferencia de
`Equipo` (que vive fuera de JPA, en GLPI), `Impresora` es una tabla propia de este sistema.

### `ImpresoraIntervencionAdjunto` (entidad nueva, tabla `impresoras_intervenciones_adjuntos`)

```java
@Entity
@Table(name = "impresoras_intervenciones_adjuntos")
public class ImpresoraIntervencionAdjunto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "intervencion_id", nullable = false)
    private Long intervencionId;

    @Column(name = "archivo_path", nullable = false)
    private String archivoPath;       // ruta relativa, ej. "{intervencionId}/{uuid}.pdf"

    @Column(name = "nombre_original", nullable = false)
    private String nombreOriginal;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    @Column(name = "subido_por", nullable = false)
    private String subidoPor;

    @Column(name = "fecha_subida", nullable = false)
    private LocalDateTime fechaSubida;
}
```

### Migración SQL

Archivo: `docs/superpowers/migrations/2026-07-17-impresoras-intervenciones.sql`

```sql
USE ssti;
GO
IF OBJECT_ID('dbo.impresoras_intervenciones', 'U') IS NULL
CREATE TABLE dbo.impresoras_intervenciones (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    impresora_id    BIGINT NOT NULL REFERENCES dbo.impresoras(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL,
    observacion     NVARCHAR(1000) NOT NULL,
    registrado_por  NVARCHAR(100) NOT NULL,
    fecha_registro  DATETIME2 NOT NULL
);
GO
CREATE INDEX IX_impresoras_intervenciones_impresora_id
    ON dbo.impresoras_intervenciones(impresora_id);
GO
IF OBJECT_ID('dbo.impresoras_intervenciones_adjuntos', 'U') IS NULL
CREATE TABLE dbo.impresoras_intervenciones_adjuntos (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    intervencion_id BIGINT NOT NULL REFERENCES dbo.impresoras_intervenciones(id) ON DELETE CASCADE,
    archivo_path    NVARCHAR(300) NOT NULL,
    nombre_original NVARCHAR(255) NOT NULL,
    mime_type       NVARCHAR(100) NOT NULL,
    subido_por      NVARCHAR(100) NOT NULL,
    fecha_subida    DATETIME2 NOT NULL
);
GO
CREATE INDEX IX_impresoras_intervenciones_adjuntos_intervencion_id
    ON dbo.impresoras_intervenciones_adjuntos(intervencion_id);
GO
```

`ON DELETE CASCADE` en ambos niveles: borrar una impresora borra sus intervenciones, y borrar una
intervención borra sus filas de adjuntos (los archivos físicos se borran aparte, desde el service,
antes o después del `DELETE`, igual que ya hace `EquipoEvidenciaService`).

## 3. Almacenamiento de archivos

Nueva propiedad `uploads.intervenciones-dir: uploads/impresoras-intervenciones` en
`application.yml`. Se agrega `IntervencionStorageService`, clon de `EvidenciaStorageService`
(mismo constructor `@Value`, mismo `store(intervencionId, file)` / `load(relativePath)`, misma
protección contra path traversal — resuelve el path final y verifica que quede dentro del
`rootDir`).

**Tipos permitidos** (ampliado respecto a Evidencias, que solo acepta imágenes):
`image/jpeg`, `image/png`, `image/webp`, `application/pdf`,
`application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`),
`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`).

**Límite de tamaño:** 15 MB por archivo (más alto que los 8 MB de Evidencias, porque documentos
Office/PDF pesan más que una foto de celular). Se ajusta
`spring.servlet.multipart.max-file-size`/`max-request-size` si el valor global actual es menor a
15 MB, o se valida manualmente en el service si no conviene subir el límite global.

Sin límite fijo de cantidad de adjuntos por intervención (mismo criterio que Evidencias en
Equipos).

## 4. Backend — servicios y controlador

Paquete `com.inia.soportedesk.impresoras.intervencion` (paralelo a `equipos.evidencia`).

### `ImpresoraIntervencionService`

- `listar(impresoraId)` → `List<ImpresoraIntervencionDto>` (con sus adjuntos anidados) ordenado
  por `fecha DESC`.
- `crear(impresoraId, fecha, observacion, username)` → valida que la impresora exista, crea la
  fila (`registradoPor = username`, `fechaRegistro = now()`), devuelve el DTO sin adjuntos.
- `actualizar(impresoraId, intervencionId, fecha, observacion)` → verifica pertenencia a
  `impresoraId`, actualiza `fecha`/`observacion` únicamente (no toca `registradoPor` ni
  `fechaRegistro`).
- `eliminar(impresoraId, intervencionId)` → verifica pertenencia, borra los archivos físicos de
  todos sus adjuntos, luego la fila (el `ON DELETE CASCADE` limpia los adjuntos en BD).
- `subirAdjuntos(impresoraId, intervencionId, List<MultipartFile>, username)` → verifica
  pertenencia, valida MIME/tamaño de cada archivo, guarda vía `IntervencionStorageService`,
  persiste una fila de adjunto por archivo. Si un archivo del lote falla la validación, no se sube
  ninguno del lote (todo o nada) y se devuelve 400 con el detalle de cuál falló.
- `eliminarAdjunto(impresoraId, intervencionId, adjuntoId)` → verifica pertenencia a la
  intervención (y esta a la impresora), borra archivo físico y fila.
- `cargarArchivo(impresoraId, intervencionId, adjuntoId)` → `Resource` + `mimeType`, para el
  endpoint de descarga.

### `ImpresoraIntervencionController`, bajo `/api/impresoras/{impresoraId}/intervenciones`

| Método | Ruta | Permiso | Devuelve |
|---|---|---|---|
| GET | `/` | `READ_impresoras` | `List<ImpresoraIntervencionDto>` |
| POST | `/` (JSON: `fecha`, `observacion`) | `WRITE_impresoras` | `ImpresoraIntervencionDto` (201) |
| PUT | `/{intervencionId}` (JSON: `fecha`, `observacion`) | `WRITE_impresoras` | `ImpresoraIntervencionDto` |
| DELETE | `/{intervencionId}` | `WRITE_impresoras` | 204 |
| POST | `/{intervencionId}/adjuntos` (multipart: `files`, uno o más) | `WRITE_impresoras` | `List<ImpresoraIntervencionAdjuntoDto>` (201) |
| GET | `/{intervencionId}/adjuntos/{adjuntoId}/archivo` | `READ_impresoras` | bytes del archivo (`Content-Type` real; `Content-Disposition: inline` si es imagen/PDF, `attachment` si es Office) |
| DELETE | `/{intervencionId}/adjuntos/{adjuntoId}` | `WRITE_impresoras` | 204 |

Mismo patrón `@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_impresoras'/'WRITE_impresoras')")`
que ya usa `ImpresoraController`.

### DTOs

```java
public class ImpresoraIntervencionDto {
    private Long id;
    private LocalDate fecha;
    private String observacion;
    private String registradoPor;
    private LocalDateTime fechaRegistro;
    private List<ImpresoraIntervencionAdjuntoDto> adjuntos;
}

public class ImpresoraIntervencionAdjuntoDto {
    private Long id;
    private String nombreOriginal;
    private String mimeType;
    private String subidoPor;
    private LocalDateTime fechaSubida;
    // el frontend arma la URL de descarga con los tres ids:
    // /api/impresoras/{impresoraId}/intervenciones/{intervencionId}/adjuntos/{id}/archivo
}
```

## 5. Frontend

### `impresora.model.ts`
Nuevos tipos `ImpresoraIntervencion { id, fecha, observacion, registradoPor, fechaRegistro,
adjuntos: ImpresoraIntervencionAdjunto[] }` y
`ImpresoraIntervencionAdjunto { id, nombreOriginal, mimeType, subidoPor, fechaSubida }`.

### `ImpresoraService`
- `getIntervenciones(impresoraId)`
- `crearIntervencion(impresoraId, { fecha, observacion })`
- `actualizarIntervencion(impresoraId, intervencionId, { fecha, observacion })`
- `eliminarIntervencion(impresoraId, intervencionId)`
- `subirAdjuntos(impresoraId, intervencionId, files: File[])` — `FormData` con múltiples archivos
  bajo la misma clave (`files`), mismo patrón que `subirEvidencia` pero con `multiple`.
- `descargarAdjunto(impresoraId, intervencionId, adjuntoId)` — `responseType: 'blob'`.
- `eliminarAdjunto(impresoraId, intervencionId, adjuntoId)`

### `ImpresoraFichaComponent`
Nuevo tab **`'intervenciones'`**, agregado a la unión `FichaTab` junto a
`'instalacion' | 'consumibles' | 'driver'`.

- Listado tipo timeline: una tarjeta por intervención, orden descendente por `fecha`.
- Cabecera de tarjeta: fecha + observación, con botones editar/eliminar visibles solo si
  `canWrite('impresoras')`. Editar abre un formulario pequeño (fecha + observación) en
  `app-modal`; guardar llama `actualizarIntervencion`.
- Cuerpo de tarjeta: grid de adjuntos (mismo patrón visual que `evidencia-card` de
  `EquipoDetailComponent`) — miniatura si es imagen (vía blob + `URL.createObjectURL`, igual que
  Evidencias, porque la descarga va autenticada), ícono de tipo de archivo (PDF/Word/Excel) +
  nombre si no es imagen. Click en una imagen abre el visor ampliado (`app-modal`); click en un
  documento dispara la descarga del blob.
- Input de archivo con `multiple` para agregar adjuntos a una intervención existente, y como parte
  del formulario de "Nueva intervención" (crear la intervención primero, luego subir los adjuntos
  seleccionados en el mismo flujo de guardado).
- Botón eliminar por adjunto individual (mismo criterio de permiso), con `confirm()` nativo antes
  de borrar, igual que Evidencias.
- `ngOnDestroy()` revoca las URLs de blob generadas, igual que `EquipoDetailComponent`.
- Estado vacío: "Sin intervenciones registradas para esta impresora."

## 6. Manejo de errores

- Crear/editar intervención: `observacion` vacía o `fecha` nula → 400 de validación (`@Valid` en
  el DTO de request).
- Subir adjuntos: tipo de archivo no permitido o archivo > 15 MB → 400 con detalle de cuál archivo
  falló; no se guarda ninguno del lote. El frontend muestra el error sin perder los demás archivos
  ya seleccionados en el formulario.
- Descargar un adjunto cuyo archivo físico ya no existe en disco → 404 con mensaje; la tarjeta
  muestra un ícono de "archivo no disponible" en vez de romper el layout.
- Editar/eliminar/subir sobre una intervención o adjunto que no pertenece al `impresoraId` de la
  URL → 404 (no se expone si existe con otro id, mismo criterio defensivo que
  `EquipoEvidenciaService`).

## 7. Pruebas

- **Backend unit** (`ImpresoraIntervencionServiceTest`): crear; editar fecha/observación; subir
  lote de adjuntos con un MIME inválido en medio (no se guarda ninguno); eliminar intervención
  borra sus adjuntos físicos; `listar` ordena por fecha descendente.
- **Backend IT** (`ImpresoraIntervencionControllerIT`): flujo completo crear → editar → subir
  varios adjuntos → listar → descargar cada uno → eliminar un adjunto → eliminar la intervención,
  con permisos `READ_impresoras`/`WRITE_impresoras` verificados (403 si falta el permiso).
- **Frontend**: verificación manual — crear una intervención, subir 2-3 adjuntos de tipos
  distintos (imagen + PDF), editarla, eliminar un adjunto, eliminar la intervención completa,
  confirmar que un usuario sin `WRITE_impresoras` no ve los botones de escritura.

## 8. Fuera de alcance

- Generalizar `EvidenciaStorageService`/`IntervencionStorageService` en un único servicio de
  storage compartido — se mantiene el mismo criterio ya usado entre Evidencias y Drivers: si
  aparece un tercer caso, ahí sí se factoriza.
- Migrar Evidencias de Equipos a este mismo modelo de dos niveles — quedan como están, son
  conceptos distintos (una foto suelta vs. una intervención con historial).
- Notificaciones o recordatorios de mantenimiento programado — esto es solo registro histórico,
  no planificación.
- Límite configurable de cantidad de adjuntos por intervención.

## 9. Decisiones registradas

| Tema | Decisión |
|---|---|
| Nombre en la UI | "Intervenciones" (nuevo tab en la ficha de impresora) |
| Adjuntos por intervención | Múltiples (0..N), modelo a dos niveles (intervención + adjuntos) |
| Tipos de archivo | Imágenes (jpg/png/webp) + PDF + Word/Excel (.docx/.xlsx) |
| Tamaño máximo | 15 MB por archivo |
| Edición | Fecha y observación de la intervención sí son editables (a diferencia de Evidencias) |
| Vínculo con la impresora | FK real `impresora_id → impresoras(id) ON DELETE CASCADE` (Impresora es tabla propia, no GLPI) |
| Almacenamiento | Disco del servidor, `IntervencionStorageService` paralelo a `EvidenciaStorageService` |
| Permisos | `READ_impresoras`/`WRITE_impresoras`, mismos que el resto del módulo |
