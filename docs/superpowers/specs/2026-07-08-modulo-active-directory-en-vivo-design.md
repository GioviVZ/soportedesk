# Módulo de Usuarios de Red — Integración Active Directory en vivo

**Fecha:** 2026-07-08
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Alcance:** Sub-proyecto A (módulo AD en vivo). El retiro de la tabla `usuarios_red`
y la migración de VPN / dashboard quedan **fuera de alcance** (trabajo posterior).

---

## 1. Objetivo

Convertir la página **Usuarios de Red** en una consola de administración de
Active Directory **en vivo** contra el AD real de INIA
(`ldaps://SRV-DC02.inia.local:636`), reutilizando la lógica ya escrita (pero nunca
compilada) que hoy vive mal ubicada en
`src/main/resources/activedirectory/activedirectory/*.java`.

El módulo debe quedar completo, con todas las operaciones útiles de mesa de ayuda,
credenciales fuera del código, auditoría, y seguridad consistente con el resto del
sistema.

## 2. Contexto y estado actual

### 2.1 Código origen (a rescatar)
La carpeta `src/main/resources/activedirectory/activedirectory/` contiene 14 archivos
`.java` **no compilados** (Maven trata `resources/` como recursos, no como fuentes) y
**no versionados en git**. Implementan, vía JNDI puro (`javax.naming.*`, sin
dependencias extra):

- `buscarUsuarioPorSam` — detalle rico del usuario (estado, bloqueo, último login,
  grupos, OU, expiración, días desde último cambio de contraseña, etc.)
- `desbloquearUsuario` / `unlockUser` (duplicados)
- `resetPassword` (fuerza cambio o no)
- `deshabilitarUsuario` / `habilitarUsuario`
- `moverUsuarioOu`
- `agregarUsuarioGrupo` / `quitarUsuarioGrupo` / `obtenerGruposUsuario`
- `buscarGrupos` / `buscarOus`
- `actualizarInformacionUsuario`
- `obtenerDashboard` (conteos: habilitados, deshabilitados, bloqueados, DCs)

DTOs: `AdUser`, `ActiveDirectoryResponse`, `ActiveDirectoryGroup`, `ActiveDirectoryOu`,
`ActiveDirectoryDashboard`, `ResetPasswordRequest`, `UpdateUserInfoRequest`,
`MoveUserRequest`, `GroupRequest`.

### 2.2 Problemas del código origen (a corregir en el port)
1. **Credenciales hardcodeadas** en texto plano en `ActiveDirectoryService.java`
   (líneas 43-46) **y** `ActiveDirectoryDashboardService.java` (líneas 23-26):
   URL, base DN, usuario bind y contraseña `svc_appinfra_ad`. Fuga real de credencial.
2. **Dependencia inexistente**: importa `com.inia.soportedesk.audit.*`
   (`AdAuditoriaService`, `AdAuditoria`, `AuditoriaAccion`) — ese paquete no existe;
   por eso no compilaría ni movido a `src/main/java`.
3. **Sin autorización**: el controller no tiene `@PreAuthorize`.
4. **Inyección LDAP**: filtros construidos por concatenación sin escapar
   (`"(sAMAccountName=" + sam + ")"`).
5. **Duplicación**: 3 bloques idénticos de configuración de conexión LDAP y 2 métodos
   de desbloqueo.
6. **Dashboard ineficiente**: `ActiveDirectoryDashboardService` recorre 39 prefijos
   (`a*`, `b*`, …) haciendo una búsqueda subtree completa por cada uno. El método
   `obtenerDashboard` de `ActiveDirectoryService` ya hace lo mismo con paginación
   (mejor). Nos quedamos con la versión paginada.

### 2.3 Infraestructura reutilizable ya existente
- **Auditoría**: la tabla `movimientos_auditoria` y su `MovimientoAuditoriaService`
  (`com.inia.soportedesk.auditoria`) ya existen y se reutilizan — **no se crea una
  tabla `ad_auditoria` paralela.** El filtro genérico `AuditoriaFilter` solo sabe
  clasificar por método HTTP (POST → "CREAR"), lo que no distingue "resetear
  contraseña" de "deshabilitar cuenta" ni registra sobre qué `sAMAccountName` se actuó
  (su `entidad_id` solo captura segmentos numéricos de la ruta). Por eso, para este
  módulo, `ActiveDirectoryService` **llama explícitamente**
  `MovimientoAuditoriaService.registrar(...)` en cada operación de escritura, con la
  acción real (`RESET_PASSWORD`, `DESBLOQUEAR_CUENTA`, etc.) y el `sAMAccountName`
  como `entidadId` — ver detalle en 3.1. Las rutas `/api/active-directory/**` se
  excluyen del `AuditoriaFilter` genérico para no duplicar registros.
- **Seguridad**: JWT stateless + `@EnableMethodSecurity`. Patrón de autorización
  existente: `@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_<modulo>')")`.
  El módulo `usuarios-red` ya está registrado en el sistema de permisos
  (`READ_usuarios-red` / `WRITE_usuarios-red`), así que **no hay que sembrar permisos
  nuevos**.
- **Frontend**: ruta `usuarios-red` con `moduloGuard('usuarios-red')` ya existe;
  componentes compartidos reutilizables (`ModalComponent`, `SectionCardComponent`,
  `StatusBadgeComponent`, `FieldComponent`).

### 2.4 Qué NO se toca en este sub-proyecto
La tabla `usuarios_red` y el paquete backend `usuariosred` se **conservan intactos**
porque los siguen usando:
- VPN (`vpn.usuario_red_id` → `usuarios_red`), incl. el form de VPN en el frontend.
- Dashboard: contadores `usuariosRed` / `usuariosRedInactivos` y gráfico
  `usuarios-red-por-ubicacion`.

Su retiro (y la migración de VPN a `sAMAccountName`, y el retiro del gráfico
"por ubicación") es un spec posterior.

---

## 3. Arquitectura propuesta

### 3.1 Backend — paquete `com.inia.soportedesk.activedirectory` (en `src/main/java`)

```
activedirectory/
├── config/
│   ├── AdProperties.java          # @ConfigurationProperties(prefix="ad")
│   └── LdapContextFactory.java    # componente único de conexión (DirContext / LdapContext)
├── ActiveDirectoryController.java # /api/active-directory/** con @PreAuthorize
├── ActiveDirectoryService.java    # operaciones de usuario/grupo/OU (sin credenciales, sin audit dep)
├── ActiveDirectoryDashboardService.java  # solo conteos, versión paginada
├── LdapFilterUtils.java           # escape RFC 4515 para valores de filtro
└── dto/  (AdUser, ActiveDirectoryResponse, ActiveDirectoryGroup, ActiveDirectoryOu,
          ActiveDirectoryDashboard, ResetPasswordRequest, UpdateUserInfoRequest,
          MoveUserRequest, GroupRequest)
```

**Configuración externalizada** (`application.yml`):
```yaml
ad:
  url: ${AD_URL:ldaps://SRV-DC02.inia.local:636}
  base: ${AD_BASE:DC=inia,DC=local}
  bind-user: ${AD_BIND_USER:svc_appinfra_ad@inia.local}
  bind-password: ${AD_BIND_PASSWORD:}      # SIN valor por defecto en el repo
  referral: ${AD_REFERRAL:ignore}
```
- `AdProperties` mapea estas claves. `LdapContextFactory` construye el `Hashtable`
  de entorno JNDI a partir de `AdProperties` en un solo lugar; ambos services lo usan.
- `bind-password` **no** lleva default en el repo. En desarrollo se provee vía variable
  de entorno `AD_BIND_PASSWORD` o un `application-dev.yml` local no versionado.
- **Acción operativa fuera del código**: rotar la contraseña de `svc_appinfra_ad` en AD
  (quedó expuesta en el archivo no versionado).

**Seguridad del controller:**
- Lecturas (`GET`: buscar usuario, grupos, OUs, dashboard):
  `@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")`
- Escrituras (`POST`: reset, desbloquear, habilitar/deshabilitar, mover OU,
  grupos, actualizar info):
  `@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")`

**Endpoints** (se conservan las rutas del código origen, base `/api/active-directory`):

| Método | Ruta | Acción |
|---|---|---|
| GET  | `/usuarios/{sam}` | Detalle del usuario |
| POST | `/usuarios/{sam}/desbloquear` | Desbloquear cuenta |
| POST | `/usuarios/{sam}/reset-password` | Restablecer contraseña |
| POST | `/usuarios/{sam}/deshabilitar` | Deshabilitar |
| POST | `/usuarios/{sam}/habilitar` | Habilitar |
| POST | `/usuarios/{sam}/mover-ou` | Mover de OU |
| GET  | `/usuarios/{sam}/grupos` | Grupos del usuario |
| POST | `/usuarios/{sam}/grupos/agregar` | Agregar a grupo |
| POST | `/usuarios/{sam}/grupos/quitar` | Quitar de grupo |
| POST | `/usuarios/{sam}/actualizar-info` | Actualizar datos |
| GET  | `/grupos?nombre=` | Buscar grupos |
| GET  | `/ous?nombre=` | Buscar OUs |
| GET  | `/dashboard` | Conteos AD |

**Hardening:** `LdapFilterUtils.escape()` (RFC 4515) se aplica a todo valor que entre
en un filtro (`sAMAccountName`, `nombre` de grupo/OU). El endpoint de auditoría del
código origen (`/usuarios/{sam}/auditoria`, que dependía de `AdAuditoria`) se **elimina**;
para ver el rastro se consulta el módulo de auditoría existente (`/api/auditoria`)
filtrando por `modulo=active-directory`.

**Auditoría explícita por acción:**
`ActiveDirectoryService` recibe `MovimientoAuditoriaService` por constructor y llama
`registrar(usuario, accion, "active-directory", metodo, ruta, samAccountName,
estadoHttp, ip, detalle)` en cada operación de escritura, tanto en éxito como en
fallo (a diferencia del filtro genérico, que solo registra `status < 400`). `usuario`
e `ip` se obtienen de `SecurityContextHolder` / `HttpServletRequest`, igual que hacía
el código origen. Acciones registradas (columna `accion`, ≤30 chars):

| Método del service | `accion` |
|---|---|
| `desbloquearUsuario` | `DESBLOQUEAR_CUENTA` |
| `resetPassword` | `RESET_PASSWORD` |
| `deshabilitarUsuario` | `DESHABILITAR_CUENTA` |
| `habilitarUsuario` | `HABILITAR_CUENTA` |
| `moverUsuarioOu` | `MOVER_OU` |
| `agregarUsuarioGrupo` | `AGREGAR_GRUPO` |
| `quitarUsuarioGrupo` | `QUITAR_GRUPO` |
| `actualizarInformacionUsuario` | `ACTUALIZAR_INFO` |

`entidadId` = `sAMAccountName` del usuario objetivo en todos los casos. `detalle`
incluye un resumen legible (ej. para `MOVER_OU`, la OU destino; para `AGREGAR_GRUPO`/
`QUITAR_GRUPO`, el DN del grupo). Las lecturas (`GET`) no se auditan, igual que en el
resto del sistema.

### 3.2 Frontend — `features/usuarios-red/` reconstruido como consola AD

- **Ruta y guard sin cambios**: `usuarios-red` + `moduloGuard('usuarios-red')`.
- **Nuevos archivos**:
  - `active-directory.service.ts` — llama a `/api/active-directory/**`.
  - `active-directory.model.ts` — interfaces `AdUser`, `AdGroup`, `AdOu`,
    `AdDashboard`, requests (reset, move, group, update-info).
  - `usuarios-red-list.component.*` **reescrito** como consola:
    fila de KPIs (habilitados / deshabilitados / bloqueados / controladores),
    buscador por `sAMAccountName`, tarjeta de detalle con estado/bloqueo/último login/
    grupos/OU, y acciones (reset, desbloquear, habilitar/deshabilitar, mover OU,
    agregar/quitar grupo, editar info) usando `ModalComponent` para los formularios.
- **Se conservan** `usuario-red.service.ts` y `usuario-red.model.ts` (los consumen el
  form de VPN y el dashboard). Solo se retira el rol CRUD-de-BD de la página y su
  `usuario-red-form.component`.
- Permisos de UI: la página respeta `canWrite('usuarios-red')` para mostrar/ocultar
  acciones de escritura, igual que hoy.

## 4. Modelo de datos

- **Sin tablas nuevas.** La auditoría usa `movimientos_auditoria` (ya existente).
- **Sin cambios de esquema.** `usuarios_red` permanece intacta.

## 5. Manejo de errores

- Se mantiene el contrato `ActiveDirectoryResponse { success, message, data }` del
  código origen: las operaciones devuelven `success=false` + `message` legible ante
  usuario no encontrado, error LDAP, o validación (OU/grupo vacío, etc.).
- El frontend muestra `message` en un aviso y no rompe el flujo.
- A diferencia del `AuditoriaFilter` genérico, la auditoría explícita del módulo AD
  (ver 3.1) registra **tanto éxitos como fallos** — un intento fallido de resetear
  contraseña o desbloquear una cuenta queda igual de trazado que uno exitoso, con el
  `detalle` describiendo el error.

## 6. Pruebas

- **Backend unit**: `LdapFilterUtils.escape()` (casos con `*`, `(`, `)`, `\`, NUL);
  `AdProperties` binding; mapeo de `userAccountControl`/`lockoutTime`/fechas FILETIME
  en el service (extraídos a métodos testeables puros donde sea posible, sin conexión
  LDAP real); que cada operación de escritura invoque `MovimientoAuditoriaService
  .registrar(...)` con la `accion` correcta tanto en éxito como en fallo (mock del
  servicio de auditoría).
- **Backend de integración** (sin AD real): `@WebMvcTest` del controller con el service
  mockeado — verifica rutas, `@PreAuthorize` (403 sin autoridad), y forma de la
  respuesta. Patrón `*ControllerIT` del proyecto (usar `mvn verify`).
- **Verificación manual contra AD** (checklist, no automatizable en CI): buscar usuario
  real, desbloquear, reset con y sin forzar cambio, habilitar/deshabilitar, mover OU,
  agregar/quitar grupo, dashboard. Se hace en un usuario de prueba del dominio.
- **Frontend**: specs de componente para render de KPIs, búsqueda, y disparo de
  acciones con el service mockeado (patrón existente del proyecto).

## 7. Fuera de alcance (trabajo posterior — sub-proyecto B)

- Retirar la tabla `usuarios_red` y el paquete `usuariosred`.
- Migrar el titular "AD" de VPN de `usuario_red_id` (FK) a `sAMAccountName` + snapshot,
  con búsqueda AD en vivo en el form de VPN.
- Migrar contadores del dashboard (`usuariosRed`, `usuariosRedInactivos`) a datos de AD.
- **Retirar** el gráfico `usuarios-red-por-ubicacion` (decisión tomada: AD no tiene el
  concepto Sede/Dependencia; se elimina el gráfico en vez de reagrupar por OU).

## 8. Decisiones registradas

| Tema | Decisión |
|---|---|
| Relación con `usuarios-red` | La página se vuelve AD en vivo; la tabla se conserva por ahora (VPN/dashboard). |
| Alcance de operaciones | Todas (core + avanzadas: OU, grupos, actualizar info). |
| Auditoría | Reutilizar `movimientos_auditoria` vía llamadas explícitas por acción (no el `AuditoriaFilter` genérico); **no** crear `ad_auditoria`. |
| Credenciales | Externalizar a `ad.*` con env vars; rotar `svc_appinfra_ad`. |
| Dashboard "por ubicación" | Se retira (en sub-proyecto B). |
| Autorización | `READ_usuarios-red` (GET) / `WRITE_usuarios-red` (POST) + `ADMIN`. |
