# Driver de impresora por modelo, no por unidad

## Contexto

El módulo de Impresoras ya tenía un mecanismo de subida/descarga de driver (`POST`/`GET /api/impresoras/{id}/driver`, tab "Driver" en la ficha técnica de cada impresora individual). Tras importar el inventario real (164 impresoras repartidas en 57 modelos — ver `2026-06-28-impresoras-catalogo-marca-modelo-toner-design.md`), quedó claro que ese diseño obliga a subir el mismo archivo de driver una vez por cada unidad física (ej. 22 veces para las 22 PANTUM BM5100FDW), cuando el driver realmente depende del modelo, no del número de serie.

Ninguna impresora tiene hoy un driver cargado (`driverArchivoPath` es `NULL` en las 164 filas importadas), así que no hay datos reales que migrar.

## Decisión

El driver pasa a asociarse a `ModeloImpresora` en vez de a `Impresora`. Se elimina por completo el concepto de driver a nivel de unidad individual (no queda un modo de solo-lectura ni un override por unidad).

Un modelo soporta **un solo archivo de driver** (nombre, versión, sistema operativo, ruta), igual que tenía cada impresora antes — no una lista. Si un modelo necesita otro paquete, se reemplaza el archivo existente.

## Cambios de modelo de datos

- `ModeloImpresora` gana: `driverNombre`, `driverVersion`, `driverSo`, `driverArchivoPath` (todos nullable, mismos tipos/tamaños que tenía `Impresora`: `NVARCHAR(200)`, `NVARCHAR(50)`, `NVARCHAR(50)`, `NVARCHAR(500)`).
- `Impresora` pierde esos 4 campos.
- Migración SQL (idempotente, mismo patrón que el resto del proyecto):
  ```sql
  ALTER TABLE dbo.modelos_impresora ADD
      driver_nombre NVARCHAR(200) NULL,
      driver_version NVARCHAR(50) NULL,
      driver_so NVARCHAR(50) NULL,
      driver_archivo_path NVARCHAR(500) NULL;

  ALTER TABLE dbo.impresoras DROP COLUMN
      driver_nombre, driver_version, driver_so, driver_archivo_path;
  ```
- `schema.sql` se actualiza para que la definición canónica de estos 4 campos viva en `modelos_impresora` en vez de `impresoras`.

## Backend

- `ModeloImpresoraController`: nuevos endpoints
  - `POST /api/catalogos/modelos-impresora/{id}/driver` (multipart: `file`, `version`, `so`) — `@PreAuthorize("hasRole('ADMIN')")`, igual que `create`/`update`/`delete` de este controller.
  - `GET /api/catalogos/modelos-impresora/{id}/driver` — sin `@PreAuthorize` adicional, igual que el resto de los `GET` de este controller (solo requiere estar autenticado).
- `ModeloImpresoraService`: nuevo método `updateDriver(Long id, String nombre, String version, String so, String path)`, calco de `ImpresoraService.updateDriver`.
- `ImpresoraController`/`ImpresoraService`: se eliminan los 2 endpoints de driver y el método `updateDriver`.
- `FileStorageService` no cambia — ya es genérico por `entityId: Long`; simplemente pasará a recibir el id de un `ModeloImpresora` en vez de una `Impresora`. Los archivos previamente subidos bajo `uploads/drivers/<impresoraId>/` quedan huérfanos pero no hay ninguno real (ninguna impresora tiene driver cargado todavía).

## Frontend

- `impresora-ficha.component`: se elimina el tab "Driver" completo. Quedan los tabs "Instalación" y "Consumibles". Se eliminan `downloadDriver()`, `onFileSelected()`, `driverVersionInput`, `driverSoInput`, el tipo `FichaTab` se reduce a `'instalacion' | 'consumibles'`, y el `@Output() driverUpdated` deja de existir.
- `impresoras-list.component`: se elimina el binding `(driverUpdated)="onDriverUpdated($event)"` y el método `onDriverUpdated` en el `.ts`.
- `impresora.model.ts`: se quitan `driverNombre`, `driverVersion`, `driverSo`, `driverArchivoPath` de la interfaz `Impresora`.
- `impresora.service.ts`: se quitan `uploadDriver()` y `downloadDriver()`.
- `catalogo.model.ts`: `ModeloImpresora` gana `driverNombre: string | null`, `driverVersion: string | null`, `driverSo: string | null`, `driverArchivoPath: string | null`.
- `catalogo.service.ts`: nuevos métodos `uploadModeloImpresoraDriver(id, file, version, so)` y `downloadModeloImpresoraDriver(id)`, mismo patrón que tenía `impresora.service.ts`.
- `modelo-impresora-form.component`: nueva sección "Driver" (mismo patrón visual que tenía la ficha de impresora: si ya hay driver cargado, muestra nombre/versión/S.O. y botón "Descargar driver"; si no, mensaje "No hay driver cargado"; debajo, campos de versión/S.O. + input de archivo para subir uno nuevo). Esta sección solo se muestra cuando `modelo` (el `@Input()`) no es `null` — subir un archivo requiere un id real, así que no aplica en modo "agregar modelo nuevo". Al subir, se actualiza el modelo en memoria y se emite el mismo evento `saved` que ya usa el formulario para que `catalogos.component` recargue la lista (no se necesita un evento nuevo).
- Tabla "Modelos de Impresora" en `catalogos.component.html`: nueva columna "Driver" entre "Tóner" y "Acciones", mostrando `item.driverNombre || '—'`.

## Testing

- Actualizar `impresora-ficha.component.spec.ts` (quitar asserts sobre el tab Driver/upload/download).
- Si existen tests de `ImpresoraServiceTest`/`ModeloImpresoraServiceTest` o `*ControllerIT` que toquen los campos de driver movidos, actualizarlos para reflejar el nuevo dueño de esos campos.
- `mvn test` (backend) y `ng test` (frontend) deben seguir en verde sin regresiones nuevas más allá del bug preexistente de H2/`*ControllerIT` ya documentado en memoria del proyecto.

## Fuera de alcance

- No se migra ningún dato real (no existe ninguno).
- No se agrega soporte para múltiples drivers por modelo (uno solo, reemplazable).
- No se agrega ningún modo de "override" de driver por impresora individual.
