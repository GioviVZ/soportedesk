# Módulo VPN — titular externo / personal INIA sin cuenta AD

## Contexto

El formulario de solicitud VPN exige hoy elegir un `usuarioRedId` obligatorio de un `<select>`
estático que carga **todos** los usuarios de red (`UsuarioRedService.getAll()` sin término de
búsqueda). Esto excluye a dos tipos de personas reales que también necesitan acceso VPN:

1. **Personal de INIA que no aparece en AD** (cuentas nuevas aún no sincronizadas, cuentas
   genéricas/compartidas, casos de sincronización incompleta).
2. **Terceros externos** (consultores, proveedores, visitantes) que nunca tendrán cuenta AD.

Este diseño reemplaza el selector estático por una búsqueda en vivo contra AD (reutilizando el
patrón de debounce que ya usa el buscador de equipos GLPI en el mismo formulario,
`vpn-form.component.ts:110-120`) y agrega una ruta de captura manual cuando la búsqueda no
encuentra resultados.

## Decisiones confirmadas

- **Flujo unificado**: no hay un checkbox "usuario externo" separado. El asistente siempre
  busca primero en AD (`GET /api/usuarios-red?search=`, endpoint ya existente). Si hay resultados,
  selecciona uno (comportamiento actual sin cambios). Si no hay resultados, aparece un prompt con
  dos botones: **"Personal de INIA"** y **"Tercero externo"**.
- **Personal de INIA (manual)**: pide nombre, apellidos, correo, y Sede/Dependencia/Tipo de
  contrato — reutilizando el componente compartido `UbicacionSelectComponent`
  (`soportedesk-frontend/src/app/shared/ubicacion-select/ubicacion-select.component.ts`) con
  `[showTipoContrato]="true"`. **Sin** campo de motivo.
- **Tercero externo**: pide nombre, apellidos, correo, empresa, motivo. **Sin** Sede/Dependencia.
- **Sede/Dependencia** se capturan como FK reales a los catálogos existentes (`Sede`/`Dependencia`,
  paquete `com.inia.soportedesk.catalogo`), no como texto libre — consistente con cómo ya se
  capturan en `UsuarioRedRequest`.
- **Nomenclatura**: los nuevos campos usan el prefijo `titular_*` / `titular*`, deliberadamente
  distinto de `solicitadoPor`/`solicitadoPorNombre` (que ya existen en `Vpn` y identifican **quién
  llenó el formulario** — el asistente). "Titular" identifica **a quién pertenece el acceso VPN**
  (hoy siempre `usuarioRed`; ahora también puede ser una persona sin cuenta AD). No renombrar ni
  reutilizar `solicitadoPor*` para esto — son conceptos distintos.
- **`usuario_red_id` ya es nullable** en la BD desde la migración `2026-06-16-vpn-refactor.sql`
  ("para permitir datos existentes") — no requiere una nueva migración para esa columna.
  `VpnRequest.usuarioRedId` deja de tener `@NotNull`; la validación de "debe venir uno u otro" se
  mueve a `VpnService`.
- **Campo "cargo"**: se agrega un campo `cargo` obligatorio a la solicitud, aplicable por igual a
  los 3 tipos de titular (AD, `INTERNO_MANUAL`, `EXTERNO`) — hoy ningún usuario de red tiene cargo
  registrado en `UsuarioRed`, así que se captura siempre en el formulario de VPN, sin importar el
  origen. Lista cerrada de 6 valores: `Director`, `Secretaria`, `Profesional`, `Gerente`,
  `Presidente Ejecutivo`, `Practicante`. Se modela como `String` con `@NotBlank` (no como un
  catálogo/tabla nueva ni un enum Java) — mismo tratamiento liviano que ya usa `tipoEquipo` en este
  mismo formulario: la lista cerrada vive en el `<select>` del frontend, el backend solo exige que
  no venga vacío.
- **Campo "tipo de contrato"**: a diferencia de "cargo", **no** es un valor nuevo — el catálogo
  `TipoContrato` (`com.inia.soportedesk.catalogo.TipoContrato`/`TipoContratoRepository`, tabla
  `tipos_contrato`) ya existe y ya tiene exactamente los 5 valores pedidos (`CAP`, `CAS`, `OS`,
  `Practicante`, `Sin Contrato`) — confirmado vía `GET /api/catalogos/tipos-contrato`. Aplica
  **solo** al titular `INTERNO_MANUAL`: los usuarios AD ya traen su `tipoContrato` en el registro
  `UsuarioRed` (no se duplica), y los terceros externos no tienen contrato INIA (usan
  `titularEmpresa`/`titularMotivo` en su lugar). Se captura como FK real a `TipoContrato`, igual
  patrón que `titularSede`/`titularDependencia`, reutilizando `UbicacionSelectComponent` con
  `[showTipoContrato]="true"` (el componente ya soporta este input/output, no se modifica).

## Modelo de datos

Nuevas columnas en `vpn` (además de las ya existentes del rediseño de solicitudes):

| Columna | Tipo | Uso |
|---|---|---|
| `titular_tipo` | `NVARCHAR(20) NOT NULL DEFAULT 'AD'` | `AD` \| `INTERNO_MANUAL` \| `EXTERNO` |
| `titular_nombre` | `NVARCHAR(150) NULL` | Solo si `titular_tipo != 'AD'` |
| `titular_apellidos` | `NVARCHAR(150) NULL` | ídem |
| `titular_correo` | `NVARCHAR(150) NULL` | ídem |
| `titular_sede_id` | `BIGINT NULL` | FK a `sedes(id)` — solo `INTERNO_MANUAL` |
| `titular_dependencia_id` | `BIGINT NULL` | FK a `dependencias(id)` — solo `INTERNO_MANUAL` |
| `titular_tipo_contrato_id` | `BIGINT NULL` | FK a `tipos_contrato(id)` — solo `INTERNO_MANUAL` |
| `titular_empresa` | `NVARCHAR(150) NULL` | Solo `EXTERNO` |
| `titular_motivo` | `NVARCHAR(500) NULL` | Solo `EXTERNO` |
| `titular_cargo` | `NVARCHAR(30) NOT NULL DEFAULT 'Profesional'` | Uno de los 6 valores fijos, para los 3 tipos de titular |

Cuando `titular_tipo = 'AD'`, todas las columnas `titular_*` quedan `NULL` **excepto**
`titular_tipo` y `titular_cargo` (este último siempre se captura, sin importar el origen del
titular) — `usuario_red_id` tiene el valor real, sin cambios respecto al comportamiento actual.

## Backend

### `Vpn.java`

Se agregan los 10 campos de la tabla anterior (`titularTipo: String`, `titularNombre: String`,
`titularApellidos: String`, `titularCorreo: String`, `titularSede: Sede` `@ManyToOne`,
`titularDependencia: Dependencia` `@ManyToOne`, `titularTipoContrato: TipoContrato` `@ManyToOne`,
`titularEmpresa: String`, `titularMotivo: String`, `titularCargo: String`).

Se agregan dos getters `@Transient` (Jackson los serializa como campos planos adicionales en el
JSON de respuesta, igual que cualquier otro getter — no se introduce una capa de DTO nueva):

```java
@Transient
public String getTitularNombreCompleto() {
    if (usuarioRed != null) return usuarioRed.getNombre();
    String apellidos = titularApellidos == null ? "" : " " + titularApellidos;
    return (titularNombre == null ? "" : titularNombre) + apellidos;
}

@Transient
public String getTitularOrigenLabel() {
    return switch (titularTipo) {
        case "INTERNO_MANUAL" -> "Interno (manual)";
        case "EXTERNO" -> "Externo";
        default -> "AD";
    };
}
```

### `VpnRequest.java`

`usuarioRedId` pierde `@NotNull` (pasa a ser opcional). Se agrega `titularCargo` con `@NotBlank`
(obligatorio para los 3 tipos de titular). El resto de campos `titular*` quedan opcionales a nivel
de Bean Validation — la obligatoriedad condicional de esos se valida en `VpnService`:

```java
private Long usuarioRedId;
private String titularTipo;       // "INTERNO_MANUAL" | "EXTERNO", solo si usuarioRedId es null
private String titularNombre;
private String titularApellidos;
private String titularCorreo;
private Long titularSedeId;       // solo INTERNO_MANUAL
private Long titularDependenciaId; // solo INTERNO_MANUAL
private Long titularTipoContratoId; // solo INTERNO_MANUAL
private String titularEmpresa;    // solo EXTERNO
private String titularMotivo;     // solo EXTERNO

@NotBlank
private String titularCargo;      // Director | Secretaria | Profesional | Gerente | Presidente Ejecutivo | Practicante
```

### `VpnService.java`

`copySolicitudFields` (usado por `crearSolicitud` y `actualizarSolicitud`) cambia de:

```java
UsuarioRed usuarioRed = usuarioRedRepository.findById(request.getUsuarioRedId())
        .orElseThrow(...);
vpn.setUsuarioRed(usuarioRed);
```

a una rama condicional. `titularCargo` se asigna una sola vez, antes de la rama, porque aplica a
los 3 tipos de titular por igual:

```java
vpn.setTitularCargo(request.getTitularCargo());

if (request.getUsuarioRedId() != null) {
    UsuarioRed usuarioRed = usuarioRedRepository.findById(request.getUsuarioRedId())
            .orElseThrow(() -> new ResourceNotFoundException("Usuario de red no encontrado: " + request.getUsuarioRedId()));
    vpn.setUsuarioRed(usuarioRed);
    vpn.setTitularTipo("AD");
    vpn.setTitularNombre(null);
    vpn.setTitularApellidos(null);
    vpn.setTitularCorreo(null);
    vpn.setTitularSede(null);
    vpn.setTitularDependencia(null);
    vpn.setTitularTipoContrato(null);
    vpn.setTitularEmpresa(null);
    vpn.setTitularMotivo(null);
} else {
    String tipo = request.getTitularTipo();
    if (!"INTERNO_MANUAL".equals(tipo) && !"EXTERNO".equals(tipo)) {
        throw new IllegalArgumentException("Debe seleccionar un usuario de red o indicar los datos del titular manual");
    }
    if (isBlank(request.getTitularNombre()) || isBlank(request.getTitularApellidos()) || isBlank(request.getTitularCorreo())) {
        throw new IllegalArgumentException("Nombre, apellidos y correo del titular son obligatorios");
    }
    vpn.setUsuarioRed(null);
    vpn.setTitularTipo(tipo);
    vpn.setTitularNombre(request.getTitularNombre());
    vpn.setTitularApellidos(request.getTitularApellidos());
    vpn.setTitularCorreo(request.getTitularCorreo());
    if ("INTERNO_MANUAL".equals(tipo)) {
        if (request.getTitularSedeId() == null || request.getTitularDependenciaId() == null
                || request.getTitularTipoContratoId() == null) {
            throw new IllegalArgumentException("Sede, dependencia y tipo de contrato son obligatorios para personal INIA sin cuenta AD");
        }
        vpn.setTitularSede(sedeRepository.findById(request.getTitularSedeId())
                .orElseThrow(() -> new ResourceNotFoundException("Sede no encontrada: " + request.getTitularSedeId())));
        vpn.setTitularDependencia(dependenciaRepository.findById(request.getTitularDependenciaId())
                .orElseThrow(() -> new ResourceNotFoundException("Dependencia no encontrada: " + request.getTitularDependenciaId())));
        vpn.setTitularTipoContrato(tipoContratoRepository.findById(request.getTitularTipoContratoId())
                .orElseThrow(() -> new ResourceNotFoundException("Tipo de contrato no encontrado: " + request.getTitularTipoContratoId())));
        vpn.setTitularEmpresa(null);
        vpn.setTitularMotivo(null);
    } else {
        if (isBlank(request.getTitularEmpresa()) || isBlank(request.getTitularMotivo())) {
            throw new IllegalArgumentException("Empresa y motivo son obligatorios para un tercero externo");
        }
        vpn.setTitularSede(null);
        vpn.setTitularDependencia(null);
        vpn.setTitularTipoContrato(null);
        vpn.setTitularEmpresa(request.getTitularEmpresa());
        vpn.setTitularMotivo(request.getTitularMotivo());
    }
}
```

(`isBlank` = helper privado `s == null || s.isBlank()`.) `VpnService` gana tres nuevas dependencias
inyectadas: `SedeRepository`, `DependenciaRepository`, `TipoContratoRepository` (los tres ya existen
en `com.inia.soportedesk.catalogo`, mismo datasource `ssti` — no son repositorios nuevos).

## Frontend

### `vpn.model.ts`

`Vpn` agrega: `titularTipo: 'AD' | 'INTERNO_MANUAL' | 'EXTERNO'`, `titularNombre: string | null`,
`titularApellidos: string | null`, `titularCorreo: string | null`,
`titularSede: { id: number; nombre: string } | null`,
`titularDependencia: { id: number; nombre: string } | null`,
`titularTipoContrato: { id: number; nombre: string } | null`, `titularEmpresa: string | null`,
`titularMotivo: string | null`, `titularCargo: string`, `titularNombreCompleto: string`,
`titularOrigenLabel: string`.

Se agrega la constante exportada:

```typescript
export const CARGOS_VPN = [
  'Director',
  'Secretaria',
  'Profesional',
  'Gerente',
  'Presidente Ejecutivo',
  'Practicante',
] as const;
```

`VpnSolicitudRequest.usuarioRedId` pasa a `number | null`; se agregan los mismos campos `titular*`
que en `VpnRequest.java` (con los mismos nombres, `titularSedeId`/`titularDependenciaId`/
`titularTipoContratoId` en vez de objetos) más `titularCargo: string`.

### `vpn-form.component.ts`

- Se elimina la carga completa (`usuarioRedService.getAll()` sin término) y el `<select>` estático.
- Se agrega búsqueda en vivo: `adSearchTerm`, `adResults: UsuarioRed[]`, `adBusquedaRealizada:
  boolean` (para saber si ya se buscó y no hubo resultados vs. aún no se ha escrito nada), mismo
  patrón de debounce 300ms que `onEquipoSearch`.
- Estado `titularModo: 'buscando' | 'ad-seleccionado' | 'interno-manual' | 'externo'`.
- Cuando `adResults` queda vacío tras una búsqueda con texto, se muestra el prompt de fallback.
- Para `interno-manual`, además de nombre/apellidos/correo se muestra
  `<app-ubicacion-select [sedeId]="..." [dependenciaId]="..." [tipoContratoId]="..."
  [showTipoContrato]="true" (sedeIdChange)="..." (dependenciaIdChange)="..."
  (tipoContratoIdChange)="...">` (mismo componente que ya usa `usuario-red-form.component.ts`, sin
  modificarlo).
- Los controles `titularNombre`/`titularApellidos`/`titularCorreo`/`titularSedeId`/
  `titularDependenciaId`/`titularTipoContratoId` (para `interno-manual`) o `.../titularEmpresa`/
  `titularMotivo` (para `externo`) reciben `Validators.required` dinámicamente vía `setValidators`
  + `updateValueAndValidity` al cambiar `titularModo`, y se limpian al volver a buscar en AD.
- `submit()` arma el request con `usuarioRedId` o los campos `titular*` según `titularModo`, nunca
  ambos — `titularCargo` siempre viaja, sin importar el modo.
- Se agrega un `<select formControlName="titularCargo">` con `Validators.required`, poblado desde
  la constante `CARGOS_VPN` de `vpn.model.ts`, visible siempre (no depende de `titularModo`).

### `vpn-list.component.html`

- Columna "Nombre": cambia de `usuarioRed.nombre` a `titularNombreCompleto`.
- Columna "Usuario red": cambia de `usuarioRed.usuario` a `titularOrigenLabel` (muestra "AD",
  "Interno (manual)" o "Externo" sin importar el origen — antes quedaba en blanco para registros
  sin `usuarioRed`).
- Modal de detalle: agrega siempre "Cargo" (`viewing.titularCargo`), y condicionalmente sobre
  `viewing.titularTipo`:
  - `!= 'AD'` → campo "Correo" (`viewing.titularCorreo`).
  - `== 'INTERNO_MANUAL'` → "Sede"/"Dependencia"/"Tipo de contrato" (`viewing.titularSede?.nombre` /
    `viewing.titularDependencia?.nombre` / `viewing.titularTipoContrato?.nombre`).
  - `== 'EXTERNO'` → "Empresa"/"Motivo" (`viewing.titularEmpresa` / `viewing.titularMotivo`).

## Testing

- **`VpnServiceTest`**: crear solicitud con `usuarioRedId` (comportamiento AD sin cambios, ahora
  incluyendo `titularCargo`), crear con `titularTipo=INTERNO_MANUAL` (válido con
  sede/dependencia/tipoContrato, y con cada uno de esos tres campos faltante por separado → 400/409),
  crear con `titularTipo=EXTERNO` (válido y con campos faltantes), crear sin `usuarioRedId` ni
  `titularTipo` válido → `IllegalArgumentException`. `titularCargo` faltante ya queda cubierto por
  la validación `@NotBlank` de `VpnRequest` (400 de Bean Validation, no requiere lógica adicional en
  el servicio).
- **`VpnControllerIT`**: al menos un caso end-to-end de creación con `titularTipo=EXTERNO` vía
  `POST /api/vpn` confirmando 201 y los campos en la respuesta.
- **Manual**: verificar en el navegador que buscar un usuario inexistente muestra el prompt, que
  "Personal de INIA" pide Sede/Dependencia/Tipo de contrato y "Tercero externo" pide
  empresa/motivo, y que la tabla/modal de detalle muestran bien los tres orígenes (AD, interno
  manual, externo) incluyendo el tipo de contrato cuando aplica.

## Archivos

**Modificados**: `Vpn.java`, `VpnRequest.java`, `VpnService.java`, `VpnServiceTest.java`,
`VpnControllerIT.java`, `vpn.model.ts`, `vpn-form.component.ts`, `vpn-form.component.html`,
`vpn-list.component.html`, migración SQL nueva en `docs/superpowers/migrations/`.

**Sin cambios**: `VpnController.java` (ningún endpoint nuevo, solo cambia el shape del request que
ya aceptan `POST`/`PUT`), `UbicacionSelectComponent` (se reutiliza tal cual), `UsuarioRedService`
(el endpoint de búsqueda ya existe).
