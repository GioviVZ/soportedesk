# Spec: Módulo Licencias — Rediseño de Campos y Catálogos

**Fecha:** 2026-06-20
**Estado:** Aprobado
**Contexto:** SoporteDesk INIA — panel de gestión TI para INIA Perú

## Objetivo

El módulo de licencias de software actual (`licencias`) solo tiene 6 campos genéricos (cantidad, licencia [texto libre], correo, clave, ordenCompra, anio), sin clasificación por tipo de software, sin distinguir cuenta/clave de activación opcionales, sin campo de serial, y con la clave guardada en texto plano. Se rediseña para clasificar cada licencia por tipo de software (Office, Diseño, etc.) y tipo de bien (Equipo/Intangible/Servicio), separar la descripción del producto del tipo, hacer opcionales los datos de activación por cuenta, agregar serial de activación, y encriptar la clave de activación de forma reversible.

## Modelo de datos

### Catálogo nuevo: `tipos_licencia`

Mismo shape que `tipos_contrato` existente — `catalogo` package, Entity/Request/Repository/Service/Controller idénticos a `TipoContrato`.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT IDENTITY | PK |
| nombre | NVARCHAR(100) | UNIQUE, NOT NULL |

Seed inicial (INSERT idempotente vía `IF NOT EXISTS`): Ofimática, Diseño, Edición de Video, Sistema Operativo, Antivirus, Otro. Administrable luego desde la pantalla de catálogos (nueva tab).

### Catálogo nuevo: `tipos_bien`

Mismo shape, mismo patrón.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT IDENTITY | PK |
| nombre | NVARCHAR(100) | UNIQUE, NOT NULL |

Seed inicial: Equipo, Intangible, Servicio (los 3 únicos tipos de bien para software a la fecha).

### Tabla `licencias` (estructura final)

| Columna | Tipo | Nullable | Notas |
|---|---|---|---|
| id | BIGINT IDENTITY | NO | sin cambios |
| tipo_licencia_id | BIGINT | NO | FK → tipos_licencia(id). Reemplaza el campo de texto libre `licencia` |
| descripcion | NVARCHAR(300) | NO | Nombre específico del producto, ej. "Office 2024 Profesional Home and Business" |
| cuenta_activacion | NVARCHAR(200) | SÍ | Renombrado de `correo`. Texto libre, sin validar formato de email (no toda cuenta de activación es un correo) |
| clave_activacion | NVARCHAR(1000) | SÍ | Renombrado de `clave`. **Almacenado encriptado** (AES-GCM reversible). Columna ensanchada por el overhead del cifrado/Base64 |
| serial_activacion | NVARCHAR(200) | SÍ | Nuevo. Product key / serial, independiente de cuenta+clave |
| orden_compra | NVARCHAR(100) | NO | sin cambios |
| anio | CHAR(4) | NO | sin cambios, CHECK formato YYYY |
| cantidad | INT | NO | sin cambios, CHECK > 0 |
| tipo_bien_id | BIGINT | NO | FK → tipos_bien(id). Agregado al final |

Regla de negocio: `clave_activacion` solo tiene sentido si `cuenta_activacion` tiene valor (se valida en UI y en backend, ver más abajo). `serial_activacion` es independiente — puede existir con o sin cuenta/clave.

## Backend

### Catálogos `TipoLicencia` y `TipoBien`

En `com.inia.soportedesk.catalogo`, copia exacta del patrón `TipoContrato`/`TipoContratoRequest`/`TipoContratoRepository`/`TipoContratoService`/`TipoContratoController`:
- `GET/POST/PUT/DELETE /api/catalogos/tipos-licencia`
- `GET/POST/PUT/DELETE /api/catalogos/tipos-bien`
- Lectura pública, escritura `@PreAuthorize("hasRole('ADMIN')")`.

### Entidad `Licencia` (actualizada)

`com.inia.soportedesk.licencias.Licencia`:
- `@ManyToOne(fetch = FetchType.EAGER) TipoLicencia tipoLicencia` (FK `tipo_licencia_id`)
- `@ManyToOne(fetch = FetchType.EAGER) TipoBien tipoBien` (FK `tipo_bien_id`)
- `String descripcion` (NOT NULL)
- `String cuentaActivacion` (nullable)
- `String claveActivacion` (nullable, `@Convert(converter = LicenciaCredentialConverter.class)`)
- `String serialActivacion` (nullable)
- `String ordenCompra`, `String anio`, `Integer cantidad` (sin cambios)

Sin `@JsonIgnore` en las relaciones — el controller devuelve la entidad directamente, mismo patrón que `UsuarioRed` (sede/dependencia/tipoContrato anidados). El frontend lee `licencia.tipoLicencia.nombre` igual que hoy lee `usuario.sede.nombre`.

### Encriptación de `claveActivacion`

Nueva clase `LicenciaCredentialConverter implements AttributeConverter<String, String>` en el package `licencias`:
- AES/GCM/NoPadding, IV aleatorio de 12 bytes por valor, IV + ciphertext concatenados y codificados en Base64 para la columna.
- Clave de cifrado desde `${licencia.encryption-key}` en `application.yml`, mismo patrón que `jwt.secret`:
  ```yaml
  licencia:
    encryption-key: ${LICENCIA_ENCRYPTION_KEY:<base64-dev-default-de-32-bytes>}
  ```
- `convertToDatabaseColumn`/`convertToEntityAttribute` pasan valores null/blank sin tocar (no se encripta un campo vacío).
- Transparente para Service/Controller/DTO — siempre trabajan con texto plano; solo la columna en la BD tiene el ciphertext.
- Caveat operacional: si se rota la clave de cifrado, los valores ya encriptados con la clave anterior quedan ilegibles. No es un problema ahora porque los datos actuales son descartables, pero a futuro una rotación de clave requeriría una migración de re-encriptado.

### `LicenciaRequest` DTO

- `tipoLicenciaId: Long` `@NotNull`
- `tipoBienId: Long` `@NotNull`
- `descripcion: String` `@NotBlank` `@Size(max = 300)`
- `cuentaActivacion: String` opcional, `@Size(max = 200)`
- `claveActivacion: String` opcional
- `serialActivacion: String` opcional, `@Size(max = 200)`
- `ordenCompra: String` `@NotBlank` (sin cambios)
- `anio: String` `@NotBlank` (sin cambios)
- `cantidad: Integer` `@NotNull` `@Min(1)` (sin cambios)

### `LicenciaService`

- Resuelve `tipoLicenciaId`/`tipoBienId` a entidades; `ResourceNotFoundException` (404) si el id no existe, igual que otros catálogos referenciados.
- Regla cruzada: si `claveActivacion` no está en blanco y `cuentaActivacion` sí lo está, lanza `IllegalArgumentException` con mensaje descriptivo. El `GlobalExceptionHandler` existente ya mapea `IllegalArgumentException` a HTTP 409, sin necesidad de código nuevo de manejo de errores.

### `LicenciaRepository.search()`

Se actualiza el `@Query` existente: se elimina `clave` de los campos buscados (ahora es ciphertext, no se puede hacer LIKE sobre texto plano) y se agrega búsqueda sobre `descripcion`, `cuentaActivacion`, `serialActivacion`, `ordenCompra`, `anio`, más join a `tipoLicencia.nombre` y `tipoBien.nombre`.

### `LicenciaController`

Sin cambios de forma — mismos endpoints `/api/licencias`, misma autorización (`ADMIN` o `WRITE_licencias` para escritura).

## Frontend

### Lista (`licencias-list.component`)

Columnas reducidas a solo lo esencial para vista rápida:

```typescript
[
  { key: 'tipoLicencia.nombre', label: 'Tipo' },
  { key: 'descripcion', label: 'Licencia' },
  { key: 'ordenCompra', label: 'Orden de Compra' },
  { key: 'anio', label: 'Año' },
]
```

El resto de los campos (cuenta/clave/serial de activación, cantidad, tipo de bien) se ven al hacer click en el registro, en el modal de detalle existente (mismo patrón `viewing` que usa `usuarios-red-list`, con safe-navigation `viewing.tipoLicencia?.nombre`). La búsqueda sigue funcionando sobre todos los campos indexados en el backend, independientemente de qué columnas se muestren en la tabla.

### Modelo (`licencia.model.ts`)

```typescript
export interface TipoLicencia { id: number; nombre: string; }
export interface TipoBien { id: number; nombre: string; }

export interface Licencia {
  id: number;
  tipoLicencia: TipoLicencia;
  tipoBien: TipoBien;
  descripcion: string;
  cuentaActivacion?: string;
  claveActivacion?: string;
  serialActivacion?: string;
  ordenCompra: string;
  anio: string;
  cantidad: number;
}

export interface LicenciaRequest {
  tipoLicenciaId: number;
  tipoBienId: number;
  descripcion: string;
  cuentaActivacion?: string;
  claveActivacion?: string;
  serialActivacion?: string;
  ordenCompra: string;
  anio: string;
  cantidad: number;
}
```

### Formulario (`licencia-form.component`)

Reactive form:
- `tipoLicenciaId`, `tipoBienId`: `<select>` (plain HTML, mismo estilo que `UbicacionSelect`), opciones cargadas desde los nuevos endpoints de catálogo. Ambos requeridos.
- `descripcion`, `ordenCompra`, `anio`, `cantidad`: igual que hoy (requeridos, mismas validaciones).
- `cuentaActivacion`, `serialActivacion`: texto libre, opcionales.
- `claveActivacion`: control **deshabilitado y limpiado mientras `cuentaActivacion` esté vacío**; se habilita en cuanto `cuentaActivacion` tiene valor (suscripción a `valueChanges`). El backend valida la misma regla como respaldo (409 si llega clave sin cuenta).

### `catalogo.service.ts`

Se agregan los 4 métodos estándar (`getTiposLicencia`/`createTipoLicencia`/`updateTipoLicencia`/`deleteTipoLicencia`) y su equivalente para `TiposBien`, copiando exactamente los métodos de `TipoContrato`.

### `catalogos.component` (pantalla admin compartida)

Se agregan dos tabs nuevas, "Tipos de Licencia" y "Tipos de Bien", reusando el `nombreForm`/`submitSimple`/`deleteItem` ya existente — mismo mecanismo con el que se agregó la tab de `TipoContrato`. No se crea un componente admin dedicado nuevo.

## Migración de base de datos

Los datos actuales en `licencias` son descartables (confirmado), por lo que la migración es un drop-and-recreate, no un `ALTER TABLE` con preservación de filas.

`spring.sql.init.mode: never` — `schema.sql` no se autoejecuta en cada arranque, se aplica manualmente (igual que `fix_usuarios_red_columns.sql`). Por lo tanto:

1. **Nuevo script** `migrate_licencias_v2.sql` (ejecución manual, una vez, contra la BD en `172.16.26.16`):
   - Crea `tipos_licencia` y `tipos_bien` (idempotente, `IF OBJECT_ID(...) IS NULL`) y siembra ambos catálogos.
   - `DROP TABLE dbo.licencias` y recreación con la estructura final, FKs e índices.
2. **`schema.sql`** también se actualiza in-place (reemplaza el bloque actual de `licencias`, agrega los bloques de los dos catálogos nuevos con sus seeds) para que cualquier instalación nueva desde cero quede con la estructura correcta directamente.

## Testing

- `LicenciaServiceTest` / `LicenciaControllerIT`: actualizar para los campos nuevos, validar el round-trip de encriptación de `claveActivacion`, y el 409 cuando llega clave sin cuenta.
- `DashboardServiceTest`: revisar si solo usa `.count()` sobre el repositorio (no debería verse afectado) o si referencia campos específicos de `Licencia`.

## Archivos afectados

### Backend
- `catalogo/TipoLicencia.java`, `TipoLicenciaRequest.java`, `TipoLicenciaRepository.java`, `TipoLicenciaService.java`, `TipoLicenciaController.java` — **nuevos**
- `catalogo/TipoBien.java`, `TipoBienRequest.java`, `TipoBienRepository.java`, `TipoBienService.java`, `TipoBienController.java` — **nuevos**
- `licencias/Licencia.java` — campos nuevos/renombrados, relaciones FK
- `licencias/LicenciaRequest.java` — campos nuevos/renombrados, validaciones
- `licencias/LicenciaService.java` — resolución de FKs, regla cruzada cuenta/clave
- `licencias/LicenciaRepository.java` — query de búsqueda actualizada
- `licencias/LicenciaCredentialConverter.java` — **nuevo**
- `resources/application.yml` — `licencia.encryption-key`
- `resources/schema.sql` — bloque `licencias` reemplazado, bloques `tipos_licencia`/`tipos_bien` agregados
- `resources/migrate_licencias_v2.sql` — **nuevo**

### Frontend
- `licencias/licencia.model.ts` — interfaces actualizadas
- `licencias/licencia.service.ts` — sin cambios de forma (mismos métodos HTTP)
- `licencias/licencia-form.component.ts` / `.html` — campos nuevos, select de catálogos, lógica condicional cuenta/clave
- `licencias/licencias-list.component.ts` / `.html` — columnas reducidas, modal de detalle ampliado
- `core/catalogos/catalogo.service.ts` — métodos para `TiposLicencia`/`TiposBien`
- `features/catalogos/catalogos.component.ts` / `.html` — dos tabs nuevas

## Out of scope

- Migrar/preservar datos existentes en `licencias` (se descartan).
- Relacionar licencias con equipos/usuarios específicos (sigue siendo un catálogo standalone).
- Rotación de la clave de cifrado o re-encriptado de datos históricos.
- Componente de combobox/autocomplete nuevo para los catálogos (se usa `<select>` simple, igual que el resto del sistema).
