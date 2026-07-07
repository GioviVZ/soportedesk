# Módulo VPN — flujo de solicitud y aprobación

## Contexto

El módulo `vpn` actual es un CRUD directo: quien tenga `WRITE_vpn` crea el registro completo
(usuario de red, equipo, IP asignada, vence, estado, usuario/contraseña VPN) en un solo paso. No
existe ninguna verificación previa registrada (antivirus, estado del equipo) ni separación entre
"quien pide el acceso" y "quien lo aprueba y crea las credenciales".

Se rediseña para que el módulo tenga dos caras:

- **Asistentes**: llenan una solicitud con los datos del usuario y las verificaciones de seguridad
  ya realizadas, sin poner usuario/contraseña VPN.
- **Responsables**: reciben una alerta de solicitudes pendientes, verifican los checks, y al
  aprobar completan usuario/contraseña VPN, IP asignada y vencimiento. También pueden rechazar u
  observar (con comentario obligatorio).

El sistema no tiene hoy un rol "asistente"/"responsable" — solo `ROLE_ADMIN`/`ROLE_SOPORTE` +
permisos granulares por módulo (`NivelPermiso.VIEW`/`EDIT`, traducidos a authorities
`READ_<modulo>`/`WRITE_<modulo>`). No existe tampoco ningún patrón previo de
"solicitud pendiente → aprobación" en el codebase — se construye desde cero, reutilizando el
mecanismo de permisos por módulo (mismo patrón que el pseudo-módulo `credenciales-vpn` que ya
oculta campos sensibles según permiso).

El formulario VPN actual usa la entidad JPA legacy `Equipo` (tabla `equipos`) vía
`GET /api/equipos/con-red`. El módulo `equipos` ya migró a solo-lectura contra GLPI
(`vw_inv_computers_full`, ver `docs/superpowers/specs/2026-07-01-equipos-glpi-design.md`); este
rediseño conecta el selector de "equipo INIA con GLPI" del formulario de solicitud VPN a esa
misma vista, en vez de a la tabla legacy.

## Decisiones confirmadas

- **Modelo de datos**: se extiende la tabla `vpn` existente con un campo `estado_solicitud`
  (workflow) — no se crea una tabla separada de "solicitudes". El campo `estado` actual
  (Activo/Inactivo) se mantiene intacto para cuando la VPN ya está operativa.
- **Permisos nuevos** (pseudo-módulos en `Modulos.java`, mismo patrón que `credenciales-vpn`):
  - `solicitar-vpn`: `WRITE_solicitar-vpn` crea solicitudes y edita/reenvía las que estén en
    `PENDIENTE`/`OBSERVADO`. `READ_solicitar-vpn` solo ve el listado (lectura).
  - `aprobar-vpn`: `WRITE_aprobar-vpn` aprueba/rechaza/observa. `ADMIN` puede todo, como hoy.
- **Listado unificado**: cualquiera con `READ_vpn`, `READ_solicitar-vpn` o `READ_aprobar-vpn` (o
  sus variantes `WRITE_*`) ve el listado completo de VPNs en modo lectura. No hay una vista
  separada de "mis solicitudes".
- **Selección de equipo GLPI**: buscador/autocomplete contra `vw_inv_computers_full` (mismo patrón
  que el módulo `equipos`), que autocompleta host e IP de solo lectura. El backend hace el
  snapshot de esos datos al momento de crear la solicitud (no confía en valores que mande el
  cliente).
- **Equipo INIA sin GLPI o equipo personal**: no se pide ningún dato adicional de equipo, solo los
  checks de antivirus correspondientes.
- **Check "host actualizado"**: solo aparece si se seleccionó un equipo GLPI.
- **Observado vs Rechazado**: `OBSERVADO` es editable — el asistente (con `WRITE_solicitar-vpn`)
  puede corregir y reenviar, lo que vuelve el estado a `PENDIENTE`. `RECHAZADO` es un estado final.
- **Comentario del responsable**: obligatorio al rechazar u observar.
- **Credenciales propias**: quien solicitó puede ver el usuario/contraseña VPN de su propia
  solicitud una vez aprobada, sin importar el permiso `credenciales-vpn` (que sigue aplicando para
  ver credenciales de solicitudes ajenas).
- **Alerta de pendientes**: card nueva en el Dashboard (visible solo para quien tenga
  `aprobar-vpn`), con el conteo de solicitudes `PENDIENTE`; al hacer click navega a `/vpn`
  filtrado por pendientes.

## Modelo de datos

Se agregan columnas a la tabla `vpn` (SQL Server, `ssti`):

| Columna | Tipo | Notas |
|---|---|---|
| `estado_solicitud` | `NVARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'` | `PENDIENTE`\|`APROBADO`\|`RECHAZADO`\|`OBSERVADO` |
| `tipo_equipo` | `NVARCHAR(20) NULL` | `INIA` \| `PERSONAL` |
| `glpi_computer_id` | `BIGINT NULL` | ID de `vw_inv_computers_full` (sin FK real — datasource distinto, mismo patrón que `equipos_enrichment.computer_id`) |
| `glpi_nombre_equipo` | `NVARCHAR(255) NULL` | snapshot del host al crear la solicitud |
| `glpi_ip_equipo` | `NVARCHAR(50) NULL` | snapshot de la IP del equipo GLPI al crear la solicitud |
| `antivirus_verificado` | `BIT NULL` | institucional (INIA) o anti-ransomware (personal), según `tipo_equipo` |
| `analisis_antivirus_realizado` | `BIT NULL` | check "análisis de antivirus al equipo realizado" |
| `host_actualizado` | `BIT NULL` | solo aplica si `glpi_computer_id` no es null |
| `comentario_responsable` | `NVARCHAR(500) NULL` | obligatorio al rechazar/observar |
| `solicitado_por` | `NVARCHAR(80) NOT NULL` | username de quien creó la solicitud (no FK, mismo patrón que `equipos_enrichment.revisado_por`) |
| `solicitado_por_nombre` | `NVARCHAR(150) NULL` | snapshot del nombre para mostrar en UI |
| `fecha_solicitud` | `DATETIME NOT NULL DEFAULT GETDATE()` | |
| `aprobado_por` | `NVARCHAR(80) NULL` | username de quien resolvió (aprobó/rechazó/observó) |
| `aprobado_por_nombre` | `NVARCHAR(150) NULL` | snapshot del nombre |
| `fecha_resolucion` | `DATETIME NULL` | |

`usuario_vpn`, `credencial_vpn`, `ip_asignada`, `vence` quedan `NULL` hasta la aprobación. La FK
legacy `equipo_id` se mantiene solo para los registros ya existentes (no se usa en el formulario
nuevo).

### Migración SQL

Nuevo archivo `docs/superpowers/migrations/2026-07-07-vpn-solicitudes.sql`, siguiendo el patrón
idempotente ya usado en `2026-07-04-equipos-enrichment.sql` (`IF COL_LENGTH(...) IS NULL BEGIN
ALTER TABLE ... ADD ... END`), con un `UPDATE vpn SET estado_solicitud = 'APROBADO' WHERE
estado_solicitud IS NULL` para los registros existentes (todos los VPN actuales ya tienen
usuario/contraseña, así que se consideran aprobados retroactivamente).

## Backend

### `Vpn.java` (entidad — se agregan campos)

Se agregan los 13 campos de la tabla anterior como propiedades simples (`String`, `Long`,
`Boolean`, `LocalDate`/`LocalDateTime`), sin relaciones JPA nuevas (el vínculo a GLPI es un `Long`
plano, igual que `EquipoEnrichment.computerId`). El controller sigue devolviendo la entidad `Vpn`
directamente (no se introduce una capa de DTO de respuesta, siguiendo el patrón actual).

### DTOs

- **`VpnRequest.java`** (se reemplaza el contenido, mismo nombre — usado por `POST` y `PUT`):
  `usuarioRedId` (`@NotNull`), `tipoEquipo` (`@NotBlank`, `INIA`\|`PERSONAL`), `glpiComputerId`
  (nullable), `antivirusVerificado` (`Boolean`), `analisisAntivirusRealizado` (`Boolean`),
  `hostActualizado` (nullable `Boolean`). Ya no incluye `equipoId`, `ipAsignada`, `vence`,
  `estado`, `usuarioVpn`, `credencialVpn` — esos los pone el responsable al aprobar.
- **`VpnAprobarRequest.java`** (nuevo): `usuarioVpn` (`@NotBlank`), `credencialVpn` (`@NotBlank`),
  `ipAsignada` (`@NotBlank`), `vence` (`LocalDate`, nullable), `estado` (`@NotBlank`, default
  `"Activo"` en el frontend).
- **`VpnResolucionRequest.java`** (nuevo): `comentarioResponsable` (`@NotBlank`) — usado por
  `/rechazar` y `/observar`.
- **`VpnAntivirusRequest.java`**: sin cambios (sigue siendo el monitoreo periódico post-aprobación,
  campo distinto de los checks de la solicitud inicial).
- Se elimina `VpnDatosRequest.java` (código muerto, sin referencias) y su componente frontend
  huérfano `vpn-datos-form.component.ts`.

### `VpnRepository.java`

Se agrega `long countByEstadoSolicitud(String estadoSolicitud)` para el KPI del dashboard. El
método `search(...)` se extiende con `OR LOWER(v.solicitadoPorNombre) LIKE ...` para poder buscar
por quien creó la solicitud.

### `VpnService.java`

- `crearSolicitud(VpnRequest, Authentication)`: valida `usuarioRedId`, resuelve
  `glpiComputerId` contra `VwInvComputerFullRepository` (si viene) y hace snapshot de
  `nombreEquipo`/`ipEquipo` — 404 si el ID no existe. Setea `estadoSolicitud="PENDIENTE"`,
  `solicitadoPor`/`solicitadoPorNombre` desde `auth.getName()` + `UsuarioRepository.findByUsername`,
  `fechaSolicitud=LocalDateTime.now()`. Requiere inyectar `VwInvComputerFullRepository` (mismo
  datasource GLPI que ya usa `EquipoService`) y `UsuarioRepository`.
- `actualizarSolicitud(id, VpnRequest, Authentication)`: solo si `estadoSolicitud` está en
  `PENDIENTE` u `OBSERVADO` (si no, `IllegalStateException` → 409). Si estaba `OBSERVADO`, vuelve a
  `PENDIENTE` al guardar. Reutiliza la misma lógica de snapshot GLPI que la creación.
- `aprobar(id, VpnAprobarRequest, Authentication)`: requiere `estadoSolicitud=PENDIENTE` (409 si
  no). Setea `usuarioVpn`, `credencialVpn`, `ipAsignada`, `vence`, `estado` del request;
  `estadoSolicitud="APROBADO"`, `aprobadoPor`/`aprobadoPorNombre`, `fechaResolucion=now()`.
- `rechazar(id, VpnResolucionRequest, Authentication)` / `observar(id, VpnResolucionRequest, Authentication)`:
  requieren `estadoSolicitud=PENDIENTE`; setean `comentarioResponsable`,
  `estadoSolicitud="RECHAZADO"`/`"OBSERVADO"`, `aprobadoPor`/`aprobadoPorNombre`, `fechaResolucion`.
- `maskCredencialesIfNeeded(...)`: se agrega la excepción de "credenciales propias" — si
  `vpn.getSolicitadoPor().equals(auth.getName())`, no se enmascara aunque falte
  `READ_credenciales-vpn`.
- `updateAntivirus(...)` y `delete(...)`: sin cambios.

### `VpnController.java`

```
GET    /api/vpn                    hasRole('ADMIN') || hasAnyAuthority('READ_vpn','READ_solicitar-vpn','READ_aprobar-vpn','WRITE_vpn','WRITE_solicitar-vpn','WRITE_aprobar-vpn')
GET    /api/vpn/{id}               igual que arriba
POST   /api/vpn                    hasRole('ADMIN') || hasAuthority('WRITE_solicitar-vpn')       → crearSolicitud
PUT    /api/vpn/{id}                hasRole('ADMIN') || hasAuthority('WRITE_solicitar-vpn')       → actualizarSolicitud
PATCH  /api/vpn/{id}/aprobar        hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')          → aprobar
PATCH  /api/vpn/{id}/rechazar       hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')          → rechazar
PATCH  /api/vpn/{id}/observar       hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')          → observar
PATCH  /api/vpn/{id}/antivirus      sin cambios (sin @PreAuthorize, como hoy)
DELETE /api/vpn/{id}                hasRole('ADMIN')  (sin cambios)
```

Las transiciones de estado inválidas (editar algo que no está en `PENDIENTE`/`OBSERVADO`, aprobar/
rechazar/observar algo que no está en `PENDIENTE`) lanzan `IllegalArgumentException`, que el
`GlobalExceptionHandler` existente ya mapea a `409 Conflict` — no se agrega ningún handler nuevo.

### `Modulos.java`

```java
public static final Set<String> VALIDOS = Set.of(
        "usuarios-red", "correos", "equipos", "vpn", "credenciales-vpn",
        "solicitar-vpn", "aprobar-vpn",
        "impresoras", "wifi", "licencias", "catalogos",
        "auditoria", "herramientas");
```

### Dashboard

- `DashboardCounts` (record): se agrega `long vpnPendientes`.
- `DashboardService.getCounts()`: agrega `vpnRepository.countByEstadoSolicitud("PENDIENTE")`.
- No se restringe el cálculo por permiso en backend (es solo un número); el frontend decide si
  muestra la card según `canWrite('aprobar-vpn')`.

## Frontend

### `vpn.model.ts` (se reescribe)

```typescript
export interface Vpn {
  id: number;
  usuarioRed: { id: number; nombre: string; usuario: string } | null;
  estadoSolicitud: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';
  tipoEquipo: 'INIA' | 'PERSONAL' | null;
  glpiComputerId: number | null;
  glpiNombreEquipo: string | null;
  glpiIpEquipo: string | null;
  antivirusVerificado: boolean | null;
  analisisAntivirusRealizado: boolean | null;
  hostActualizado: boolean | null;
  comentarioResponsable: string | null;
  solicitadoPor: string;
  solicitadoPorNombre: string | null;
  fechaSolicitud: string;
  aprobadoPor: string | null;
  aprobadoPorNombre: string | null;
  fechaResolucion: string | null;
  ipAsignada: string | null;
  vence: string | null;
  estado: string;
  tieneAntivirus: boolean | null;
  vencimientoAntivirus: string | null;
  usuarioVpn: string | null;
  credencialVpn: string | null;
}

export interface VpnSolicitudRequest {
  usuarioRedId: number;
  tipoEquipo: 'INIA' | 'PERSONAL';
  glpiComputerId: number | null;
  antivirusVerificado: boolean;
  analisisAntivirusRealizado: boolean;
  hostActualizado: boolean | null;
}

export interface VpnAprobarRequest {
  usuarioVpn: string;
  credencialVpn: string;
  ipAsignada: string;
  vence: string | null;
  estado: string;
}

export interface VpnResolucionRequest {
  comentarioResponsable: string;
}
```

`VpnAntivirusRequest` sin cambios.

### `vpn.service.ts`

Se agregan `aprobar(id, VpnAprobarRequest)`, `rechazar(id, VpnResolucionRequest)`,
`observar(id, VpnResolucionRequest)` (todos `PATCH`). `create`/`update` cambian su tipo de body a
`VpnSolicitudRequest`.

### `vpn-form.component.ts/html` (formulario de solicitud — se reescribe)

Flujo: selector "Usuario AD" (igual que hoy) → radio **Tipo de equipo** (`INIA`/`Personal`):

- **INIA**: checkbox "¿Tiene GLPI instalado?" → si sí, buscador de equipo GLPI
  (`EquipoService.getAll({search})`, mismo servicio que usa el módulo Equipos — no
  `getConRed()` legacy) que al seleccionar autocompleta host/IP de solo lectura, más checkbox
  "Host actualizado"; checkbox "Antivirus institucional verificado".
- **Personal**: checkbox "Antivirus con protección anti-ransomware verificado".
- Siempre: checkbox "Análisis de antivirus realizado".

Sin campos de usuario/contraseña/IP VPN/vence — se eliminan del formulario de solicitud. El bloque
"Credenciales VPN" y `vpn-password-generator` se mueven al nuevo modal de aprobación.

### `vpn-aprobar-form.component.ts/html` (nuevo)

Modal para el responsable: resumen de solo lectura de los checks marcados por el asistente
(tipo de equipo, host/IP GLPI si aplica, los 3 checkboxes) + formulario de usuario/contraseña VPN
(reutiliza `VpnPasswordGeneratorComponent`), IP asignada, vence. Tres botones:

- **Aprobar** → `service.aprobar(id, {...})`.
- **Rechazar** / **Observar** → abren un textarea de comentario obligatorio antes de habilitar el
  botón, luego `service.rechazar(...)` / `service.observar(...)`.

### `vpn-list.component.ts/html`

- Columna nueva "Estado solicitud" (badge de color: gris Pendiente, verde Aprobado, rojo Rechazado,
  ámbar Observado).
- Botón "Nueva solicitud" visible si `canWrite('solicitar-vpn')` (getter nuevo).
- Acciones **Aprobar/Rechazar/Observar** (abren `vpn-aprobar-form`) visibles solo si
  `canWrite('aprobar-vpn')` y `item.estadoSolicitud === 'PENDIENTE'`.
- Botón **Editar/Reenviar** visible si `canWrite('solicitar-vpn')` y `estadoSolicitud` en
  `PENDIENTE`/`OBSERVADO`.
- `canEditCredenciales` se extiende: `isAdmin() || canWrite('credenciales-vpn') ||
  item.solicitadoPor === authService.getUsername()`. Se agrega el getter
  `getUsername(): string | null` a `AuthService` (hoy solo guarda `username` en `localStorage` al
  hacer login, sin exponer un getter).
- Modal de detalle (`viewing`) muestra quién solicitó (`solicitadoPorNombre`), fecha, y si fue
  resuelto: quién y cuándo, más el comentario si lo hay.

### Dashboard (frontend)

- Card nueva "Solicitudes VPN pendientes" (estilo alerta/naranja, mismo patrón visual que las
  demás KPI cards), visible solo si `authService.isAdmin() || authService.canWrite('aprobar-vpn')`.
  Click → `router.navigate(['/vpn'])`. No se agrega filtrado por query param: el listado no tiene
  hoy ningún mecanismo de filtro por columna y el badge de "Estado solicitud" ya hace visualmente
  evidentes las pendientes; agregar un filtro es una mejora separada, fuera de alcance de este
  rediseño (YAGNI).

## Testing

- **`VpnServiceTest`**: crear solicitud (con y sin `glpiComputerId`, incluyendo 404 si el ID GLPI
  no existe), editar en `PENDIENTE`/`OBSERVADO`, rechazo de edición en `APROBADO`/`RECHAZADO`,
  aprobar (transición de estado + campos de credenciales), rechazar/observar (comentario
  obligatorio), reenvío tras `OBSERVADO` vuelve a `PENDIENTE`, visibilidad de credenciales propias
  sin permiso `credenciales-vpn`.
- **`VpnControllerIT`**: autorización de los 3 endpoints nuevos (`/aprobar`, `/rechazar`,
  `/observar`) por permiso, y que `POST`/`PUT` ahora exigen `WRITE_solicitar-vpn` en vez de
  `WRITE_vpn`.
- **`DashboardServiceTest`**: `vpnPendientes` cuenta correctamente solo los `PENDIENTE`.

## Archivos

**Nuevos**: `VpnAprobarRequest.java`, `VpnResolucionRequest.java`,
`vpn-aprobar-form.component.{ts,html,scss}`,
`docs/superpowers/migrations/2026-07-07-vpn-solicitudes.sql`.

**Eliminados**: `VpnDatosRequest.java` (backend), `vpn-datos-form.component.{ts,html}` (frontend) —
código muerto sin referencias.

**Reescritos**: `Vpn.java`, `VpnRequest.java`, `VpnRepository.java`, `VpnService.java`,
`VpnController.java`, `Modulos.java`, `DashboardCounts.java`, `DashboardService.java`,
`vpn.model.ts`, `vpn.service.ts`, `vpn-form.component.{ts,html}`, `vpn-list.component.{ts,html}`,
dashboard component/template (nueva card).

**Sin cambios**: `VpnAntivirusRequest.java`, `vpn-antivirus-form.component.*`,
`vpn-password-generator.component.*` (se reutiliza dentro de `vpn-aprobar-form`).
