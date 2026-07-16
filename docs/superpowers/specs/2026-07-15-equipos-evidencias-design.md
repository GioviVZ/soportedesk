# Módulo Equipos — Evidencias (fotos) por equipo

**Fecha:** 2026-07-15
**Estado:** Diseño aprobado — pendiente de plan de implementación

---

## 1. Objetivo

El personal de TI viene guardando fotos de los equipos (estado físico, etiqueta de serie, daños,
etc.) como notas pegadas en GLPI. Investigación previa mostró que esto casi no funciona en la
práctica: de 307 notas de tipo `Computer` en GLPI, 305 quedan completamente vacías — solo 1 equipo
tiene fotos guardadas de verdad. Además, la institución va a dejar de depender de GLPI como
sistema del día a día.

Este cambio agrega **Evidencias**: un campo propio de SoporteDesk, por equipo, para **ver y subir
fotos**, sin depender de GLPI. Reemplaza conceptualmente la idea de "notas" — de ahora en adelante
"Evidencias" es el nombre correcto en toda la UI y el código nuevo.

Incluye además una migración única (no permanente) que trae las 2 fotos que ya existen en GLPI
como primeras Evidencias del equipo que las tiene, usando la API REST de GLPI (token provisto por
el usuario). Después de correr la migración, la funcionalidad no vuelve a depender de GLPI.

## 2. Modelo de datos

### `EquipoEvidencia` (entidad nueva, tabla `equipos_evidencias`)

```java
@Entity
@Table(name = "equipos_evidencias")
public class EquipoEvidencia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "computer_id", nullable = false)
    private Long computerId;          // GLPI ComputerID — mismo criterio de vínculo que EquipoEnrichment

    @Column(name = "archivo_path", nullable = false)
    private String archivoPath;       // ruta relativa devuelta por el storage, ej. "{computerId}/{uuid}.jpg"

    @Column(name = "nombre_original", nullable = false)
    private String nombreOriginal;

    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    private String descripcion;       // opcional, texto libre

    @Column(name = "subido_por", nullable = false)
    private String subidoPor;         // username, de Authentication

    @Column(name = "fecha_subida", nullable = false)
    private LocalDateTime fechaSubida;
}
```

No lleva `@ManyToOne` a `Equipo`/`VwInvComputerFull` — mismo patrón que `EquipoEnrichment`, que
vincula por `computerId` como `Long` suelto, no por FK real (el ComputerID vive en la base de GLPI,
fuera del control de JPA de este módulo).

### Migración SQL

Archivo: `docs/superpowers/migrations/2026-07-15-equipos-evidencias.sql`

```sql
USE ssti;
GO
IF OBJECT_ID('dbo.equipos_evidencias', 'U') IS NULL
CREATE TABLE dbo.equipos_evidencias (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    computer_id     BIGINT NOT NULL,
    archivo_path    NVARCHAR(300) NOT NULL,
    nombre_original NVARCHAR(255) NOT NULL,
    mime_type       NVARCHAR(100) NOT NULL,
    descripcion     NVARCHAR(500) NULL,
    subido_por      NVARCHAR(100) NOT NULL,
    fecha_subida    DATETIME2 NOT NULL
);
GO
CREATE INDEX IX_equipos_evidencias_computer_id ON dbo.equipos_evidencias(computer_id);
GO
```

Índice por `computer_id` porque el listado siempre filtra por un equipo (patrón de acceso único).

## 3. Almacenamiento de archivos

Nueva propiedad `uploads.evidencias-dir` en `application.yml` (mismo patrón que
`uploads.drivers-dir`, ver `FileStorageService`). No se reutiliza `FileStorageService` tal cual
(su constructor fija un único `rootDir` vía `@Value`, y ya está en uso para drivers de impresora) —
se agrega una clase pequeña y paralela, `EvidenciaStorageService`, con la misma forma
(`store(computerId, file)` / `load(relativePath)`), apuntando a su propio directorio raíz. No vale
la pena generalizar `FileStorageService` para dos usos con la misma forma exacta; si aparece un
tercer caso, ahí sí se factoriza.

Validación en `store()`: solo `image/jpeg`, `image/png`, `image/webp` (rechaza cualquier otro
`contentType`, mismo criterio que "Evidencias es solo imágenes"). Límite de tamaño: 8 MB por
archivo (`spring.servlet.multipart.max-file-size`, ya configurado a nivel global — se verifica que
cubra este caso, si el límite actual es menor se sube solo para esta ruta vía
`@RequestMapping` + config específica si hiciera falta).

## 4. Backend — `EquipoEvidenciaService` + `EquipoEvidenciaController`

Paquete `com.inia.soportedesk.equipos.evidencia` (paralelo a `equipos.enrichment`).

**Servicio:**
- `listar(computerId)` → `List<EquipoEvidenciaDto>` ordenado por `fechaSubida DESC`.
- `subir(computerId, MultipartFile, descripcion, username)` → valida MIME, guarda vía
  `EvidenciaStorageService.store()`, persiste la fila, devuelve el DTO.
- `eliminar(computerId, evidenciaId)` → borra la fila y el archivo físico (`Files.deleteIfExists`).
  Verifica que la evidencia pertenezca al `computerId` de la URL antes de borrar (evita que alguien
  borre la evidencia de otro equipo adivinando el id).
- `cargarArchivo(computerId, evidenciaId)` → `Resource` + `mimeType`, para el endpoint de descarga.

**Controlador**, bajo `/api/equipos/{computerId}/evidencias`:

| Método | Ruta | Permiso | Devuelve |
|---|---|---|---|
| GET | `/` | `READ_equipos` | `List<EquipoEvidenciaDto>` |
| POST | `/` (multipart: `file`, `descripcion` opcional) | `WRITE_equipos` | `EquipoEvidenciaDto` |
| GET | `/{evidenciaId}/archivo` | `READ_equipos` | bytes de la imagen (`Content-Type` real) |
| DELETE | `/{evidenciaId}` | `WRITE_equipos` | 204 |

Mismo patrón de `@PreAuthorize("hasRole('ADMIN') || hasAuthority('...')")` que ya usa
`EquipoEnrichmentController`.

### `EquipoEvidenciaDto`

```java
public class EquipoEvidenciaDto {
    private Long id;
    private String nombreOriginal;
    private String descripcion;
    private String subidoPor;
    private LocalDateTime fechaSubida;
    // el frontend arma la URL de descarga con el id: /api/equipos/{computerId}/evidencias/{id}/archivo
}
```

## 5. Frontend

### `equipo.model.ts`
Nuevo tipo `EquipoEvidencia { id, nombreOriginal, descripcion, subidoPor, fechaSubida }`.

### `EquipoService`
- `getEvidencias(computerId)`
- `subirEvidencia(computerId, file, descripcion)` — `FormData`, igual patrón que
  `uploadModeloImpresoraDriver`.
- `descargarEvidencia(computerId, evidenciaId)` — `responseType: 'blob'`, mismo patrón que
  `downloadModeloImpresoraDriver`.
- `eliminarEvidencia(computerId, evidenciaId)`

### `EquipoDetailComponent`
Sección nueva **"Evidencias"** (`app-section-card`), después de la sección de Software/Monitores,
antes o junto al bloque de identidad — se decide en implementación según el orden visual actual de
la ficha, sin cambiar las demás secciones.

- Grilla de miniaturas (`<img>` por evidencia). Cada `<img [src]>` se llena vía
  `URL.createObjectURL(blob)` obtenido de `descargarEvidencia()` (las imágenes van autenticadas,
  no pueden ir en `<img src="...">` directo a la URL de la API).
- Click en una miniatura → la abre a tamaño completo (modal simple con `<img>`, reutiliza
  `app-modal`).
- Botón "Subir foto" (input file + descripción opcional), visible solo si el usuario tiene
  `WRITE_equipos` (mismo criterio que ya usa la ficha para otras acciones de escritura).
- Botón eliminar por miniatura (mismo criterio de permiso), con `confirm()` antes de borrar —mismo
  patrón ya usado en "Eliminar contrato" de Usuarios de Red.
- Estado vacío: "Sin evidencias registradas para este equipo."

## 6. Migración única de las fotos existentes en GLPI (no permanente)

Script de un solo uso, mismo criterio que `import_ad_usuarios.sql`/el import de licencias: no
queda en el repo después de correrlo.

**Pasos:**
1. Autenticar contra la API REST de GLPI v1 (`https://glpi.inia.gob.pe/api.php/v1/initSession`)
   usando el token provisto (`Authorization: user_token <token>`).
2. Descargar los 2 documentos ya identificados (`docid=1058`, `docid=1059`, del `Computer` GLPI
   id=291) vía `GET /Document/{id}` con `Accept: application/octet-stream`.
3. `POST /api/equipos/291/evidencias` (subida normal, autenticado como admin de SoporteDesk) con
   cada imagen descargada — así queda creada por el mismo camino que cualquier subida futura, sin
   tocar la tabla directamente.
4. Cerrar la sesión de GLPI (`killSession`). El token no se vuelve a usar después de este paso.

Si `computer_id=291` fue uno de los renombrados/duplicados (no es el caso — no está en la lista de
5 duplicados encontrados), habría que verificar cuál de los dos IDs es el vigente antes de subir;
no aplica aquí.

## 7. Manejo de errores

- Subida: tipo de archivo inválido → 400 con mensaje claro ("Solo se aceptan imágenes JPG, PNG o
  WEBP"). Archivo demasiado grande → 413 (manejado por Spring, o 400 con mensaje si se valida
  manualmente antes). El frontend muestra el error sin cerrar el formulario de subida.
- Descarga de una evidencia cuyo archivo físico ya no existe en disco (borrado manual fuera de la
  app) → 404 con mensaje, la miniatura correspondiente muestra un ícono de "imagen no disponible"
  en vez de romper el layout.
- Eliminar una evidencia que no pertenece al `computerId` de la URL → 404 (no se expone si existe
  con otro id, mismo criterio defensivo que el resto del backend).

## 8. Pruebas

- **Backend unit** (`EquipoEvidenciaServiceTest`): subir con MIME válido/ inválido; eliminar
  verifica pertenencia al `computerId`; `listar` ordena por fecha descendente.
- **Backend IT** (`EquipoEvidenciaControllerIT`): flujo completo subir → listar → descargar →
  eliminar, con permisos `READ_equipos`/`WRITE_equipos` verificados (403 si falta el permiso).
- **Frontend**: sin specs existentes que migrar para esta sección. Verificación manual: subir una
  foto, verla en la grilla, abrirla a tamaño completo, eliminarla, confirmar que un usuario sin
  `WRITE_equipos` no ve los botones de subir/eliminar.
- **Migración**: no lleva test automatizado (script de un solo uso) — se verifica manualmente que
  las 2 fotos aparezcan en la ficha del equipo 291 después de correrla.

## 9. Fuera de alcance

- Cualquier lectura en vivo de GLPI para esta función — la migración es el único punto de contacto
  con GLPI, y es de un solo uso.
- Editar la descripción de una evidencia ya subida (se borra y se vuelve a subir si hace falta
  corregir algo).
- Otros tipos de archivo (PDF, documentos) — evidencias es solo imágenes por ahora.
- Límite configurable de cantidad de evidencias por equipo — no hay límite explícito más allá del
  tamaño máximo por archivo.
- Historial de cambios (a diferencia de `EquipoEnrichment`, no hay "edición" de una evidencia, solo
  alta/baja — no aplica un historial de campo-por-campo).

## 10. Decisiones registradas

| Tema | Decisión |
|---|---|
| Nombre en la UI | "Evidencias" (reemplaza cualquier mención de "Notas") |
| Dependencia de GLPI | Ninguna, salvo la migración única de arranque |
| Tipos de archivo | Solo imágenes (jpg/png/webp) |
| Cantidad por equipo | Múltiples (galería), sin límite fijo de cantidad |
| Vínculo con el equipo | Por `computerId` (GLPI ComputerID), mismo criterio que `EquipoEnrichment` |
| Almacenamiento | Disco del servidor de SoporteDesk, servicio nuevo paralelo a `FileStorageService` |
| Historial de auditoría | No aplica (solo alta/baja, no edición de campos) |
