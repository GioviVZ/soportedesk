# Módulo de Usuarios de Red/AD — Rediseño en 3 caras (Consultas / Administración / Dashboard)

**Fecha:** 2026-07-08
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Depende de:** [2026-07-08-modulo-active-directory-en-vivo-design.md](2026-07-08-modulo-active-directory-en-vivo-design.md)
(el módulo AD en vivo ya implementado: búsqueda por sAMAccountName exacto, acciones de
administración, dashboard con 4 KPIs).

---

## 1. Objetivo

Reorganizar la página única actual de Usuarios de Red/AD en **tres caras** con audiencias y
propósitos distintos:

1. **Consultas** — búsqueda de usuarios por usuario/nombre/oficina, solo lectura, para una
   audiencia más amplia que hoy (cualquiera con permiso de lectura del módulo).
2. **Administración** — igual audiencia de hoy (permiso de escritura); búsqueda + todas las
   acciones de gestión existentes + tarjetas KPI generales del dominio.
3. **Dashboard** — vista analítica completa del directorio (distribución por OU, contraseñas
   vencidas, cuentas inactivas, cuentas bloqueadas), solo para administradores.

## 2. Arquitectura y rutas

```
/usuarios-red                                  (layout: UsuariosRedShellComponent)
  ├── /consultas       canActivate: moduloGuard('usuarios-red')            [default redirect]
  ├── /administracion  canActivate: moduloGuard('usuarios-red', {write:true})
  └── /dashboard       canActivate: moduloGuard('usuarios-red', {write:true})
```

- `UsuariosRedShellComponent`: layout delgado con la barra de pestañas + `<router-outlet>`.
  Las pestañas de Administración/Dashboard no se renderizan si `!authService.canWrite('usuarios-red')`.
- `moduloGuard` se extiende con un parámetro opcional `{ write: true }` que además de la
  autenticación exige `canWrite(modulo)`, no solo `canRead(modulo)`. Sin ese parámetro se
  comporta como hoy (solo exige lectura).
- El ítem del sidebar sigue siendo uno solo ("Usuarios de Red/AD"), apunta a `/usuarios-red`
  y redirige a `consultas`.
- Se eliminan `usuarios-red-list.component.ts/html/scss/spec.ts` (la página única de hoy); su
  lógica se reparte entre las 3 caras nuevas descritas abajo.
- `active-directory.service.ts` y `active-directory.model.ts` (ya existentes) se extienden con
  los nuevos métodos/tipos del punto 3; no se tocan las operaciones de escritura existentes.

## 3. Backend — nuevos endpoints

Todo dentro de `com.inia.soportedesk.activedirectory` (paquete ya existente). No se modifica
ninguna operación de escritura ya implementada.

### 3.1 Búsqueda combinable (usada por Consultas y Administración)

```
GET /api/active-directory/usuarios/buscar?usuario=&nombre=&oficina=
```
- `@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_usuarios-red')")`.
- Los tres parámetros son opcionales; al menos uno debe tener ≥2 caracteres (si ninguno
  cumple, devuelve lista vacía sin consultar AD, igual que `buscarGrupos`/`buscarOus` hoy).
- Construye un filtro LDAP combinado en AND solo con los parámetros presentes:
  `(&(objectCategory=person)(objectClass=user)(sAMAccountName=*u*)(displayName=*n*)(physicalDeliveryOfficeName=*o*))`,
  escapando cada valor con `LdapFilterUtils.escape()`.
- Límite de 50 resultados (`SearchControls.setCountLimit(50)`); si se alcanza el límite, el
  DTO de respuesta lo indica (`truncated: true`) para que el frontend muestre el aviso.
- Devuelve `List<AdUserSummary>` (DTO liviano, no el `AdUser` completo):
  ```java
  public record AdUserSummary(
      String samAccountName, String displayName, String mail,
      String office, String organizationalUnit, boolean enabled, boolean locked
  ) {}
  public record AdUserSearchResult(List<AdUserSummary> items, boolean truncated) {}
  ```

### 3.2 Dashboard completo (usado solo por la cara Dashboard)

```
GET /api/active-directory/dashboard/completo
```
- `@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_usuarios-red')")` (a diferencia del
  `/dashboard` liviano actual, que sigue siendo `READ`, porque esta vista es solo para admins).
- **Un único recorrido paginado** (mismo patrón `countPaged`/paginación ya usado) sobre
  `(&(objectCategory=person)(objectClass=user)(sAMAccountName=*))`, trayendo por cada entrada:
  `sAMAccountName`, `displayName`, `userAccountControl`, `lockoutTime`, `badPwdCount`,
  `pwdLastSet`, `lastLogonTimestamp`, `distinguishedName`.
- Controladores de dominio: se mantiene el query separado actual sobre `objectCategory=computer`
  (no forma parte del recorrido de personas).
- Con el dataset recolectado en memoria, se calculan (lógica pura, sin LDAP, testeable con
  datos simulados):
  - Los 4 conteos actuales (habilitados/deshabilitados/bloqueados) + controladores.
  - **Distribución por OU**: agrupa por la OU completa (mismo `extraerOu`/`extractOus` ya usado
    en el detalle de usuario, ej. `"Sede Central / Administración"`), cuenta solo activos.
  - **Top 10 contraseñas vencidas**: `daysSincePasswordChange > 90`, orden descendente por
    días, + conteo total de cuentas que cumplen la condición.
  - **Top 10 cuentas inactivas**: días desde `lastLogonTimestamp > 60`, mismo patrón.
  - **Top 10 cuentas bloqueadas**: `lockoutTime > 0`, ordenadas por más recientes, + total.
- DTOs:
  ```java
  public record OuUsuariosCount(String ou, int activos) {}
  public record AdUserAlerta(String samAccountName, String displayName, String detalle) {}
  public record ActiveDirectoryDashboardCompleto(
      int usuariosHabilitados, int usuariosDeshabilitados, int usuariosBloqueados,
      int controladoresDominio,
      List<OuUsuariosCount> distribucionPorOu,
      List<AdUserAlerta> passwordsVencidas, int totalPasswordsVencidas,
      List<AdUserAlerta> cuentasInactivas, int totalCuentasInactivas,
      List<AdUserAlerta> cuentasBloqueadas, int totalCuentasBloqueadas
  ) {}
  ```
- Umbrales (90 días contraseña, 60 días inactividad) como constantes en el service; no
  configurables por ahora (YAGNI — se puede externalizar después si se pide).

## 4. Cara 1 — Consultas

Ruta `/usuarios-red/consultas`, visible para cualquiera con `READ_usuarios-red`.

- 3 campos de búsqueda combinables (Usuario, Nombre, Oficina) — reutilizan
  `GET /usuarios/buscar`.
- Tabla de resultados: Usuario, Nombre completo, Oficina, OU, chip Estado (habilitado/
  deshabilitado) + chip Bloqueado si aplica. Si `truncated=true`, aviso "mostrando los
  primeros 50 resultados, afina tu búsqueda".
- Click en una fila abre el detalle completo del usuario (mismo `AdUser` rico que ya se
  muestra hoy: correo, área, cargo, fechas, grupos, OU) en un modal/panel — **sin la sección
  de acciones**, es solo lectura.
- Si el usuario autenticado además tiene `WRITE_usuarios-red`, el detalle muestra un botón
  "Gestionar en Administración" que navega a `/usuarios-red/administracion?sam=<valor>`
  con ese usuario precargado.

## 5. Cara 2 — Administración

Ruta `/usuarios-red/administracion`, visible solo con `WRITE_usuarios-red`. Evolución directa
de la página actual; no cambia ninguna operación de escritura ya implementada.

- Fila de KPIs generales arriba, usando el endpoint liviano `GET /dashboard` (ya existente,
  sin cambios) — vistazo rápido sin salir de la pantalla.
- Mismo buscador combinable de la cara Consultas (usuario/nombre/oficina), mismo componente
  de tabla de resultados, reutilizados vía un componente compartido
  `ad-user-search.component` (evita duplicar la UI de búsqueda entre las dos caras).
- Si la ruta se abre con `?sam=<valor>` (viniendo de Consultas o del Dashboard), carga
  directamente el detalle de ese usuario sin pasar por la búsqueda.
- Al seleccionar un usuario: el panel de administración actual sin cambios — perfil completo
  + las 6 acciones existentes (resetear clave, desbloquear, habilitar/deshabilitar, mover OU,
  grupos, editar info), todas con su auditoría explícita ya implementada.

## 6. Cara 3 — Dashboard

Ruta `/usuarios-red/dashboard`, visible solo con `WRITE_usuarios-red`. Usa
`GET /dashboard/completo`.

- Fila de KPIs (reutiliza el mismo componente visual que Administración).
- Gráfico de barras horizontal de distribución por OU (Chart.js vía `ng2-charts`, mismo
  patrón visual que `usuarios-red-por-ubicacion-chart.component` del dashboard general de
  la app, para consistencia).
- 3 tarjetas de listas "top 10" (contraseñas vencidas, cuentas inactivas, cuentas bloqueadas):
  - Conteo total destacado arriba de cada tarjeta.
  - Las 10 filas más críticas: usuario, nombre, detalle textual (ej. "127 días sin cambiar
    clave").
  - Cada fila es clicable → navega a `/usuarios-red/administracion?sam=<valor>`.
  - Si el total > 10, texto informativo "+N más" sin link (el buscador de Administración no
    tiene un filtro por "vencidas/inactivas/bloqueadas" hoy, así que no se promete un enlace
    que no puede filtrar eso — queda como posible mejora futura, no en este alcance).

## 7. Manejo de errores

- Búsqueda y dashboard completo: ante error de conexión a AD, devuelven lista/DTO vacío con
  `success` implícito por HTTP 200 (siguiendo el patrón actual de `buscarGrupos`/`buscarOus`
  que ya tragan excepciones y devuelven `List.of()`), y el frontend muestra "No se pudo
  cargar" + botón reintentar en vez de romper la pantalla.
- Las operaciones de escritura de Administración no cambian su manejo de errores actual
  (`ActiveDirectoryResponse` con `success`/`message`).

## 8. Pruebas

- **Backend unit**: casos de `LdapFilterUtils`/construcción de filtro combinado con 1, 2 y 3
  parámetros presentes. Cálculo de agregados del dashboard completo (dado un `List` simulado
  de atributos crudos, verificar conteos, agrupación por OU, top-10 y orden) — lógica pura,
  sin necesidad de conexión LDAP real, separando "traer datos" de "calcularlos".
- **Backend integración**: `@WebMvcTest` de los dos endpoints nuevos con el service mockeado
  — verifica rutas, `@PreAuthorize` (403 sin autoridad; nótese que `/dashboard/completo` exige
  WRITE a diferencia de `/dashboard`), forma de la respuesta.
- **Frontend**: specs de cada cara nueva (visibilidad de pestañas según permiso, tabla de
  resultados, click-through a Administración con `?sam=`), siguiendo el patrón ya usado en
  los specs actuales del módulo.
- **Verificación manual** contra AD real: cada combinación de filtros en Consultas/
  Administración, los 3 top-10 del dashboard con datos reales, navegación cruzada entre caras.

## 9. Fuera de alcance

- Filtro "por vencidas/inactivas/bloqueadas" en el buscador de Administración (mencionado en
  §6 como posible mejora futura).
- Umbrales configurables (90/60 días quedan como constantes fijas).
- Paginación completa de las listas del dashboard más allá del top 10 (si se necesita ver
  la lista completa de, por ejemplo, todas las cuentas con contraseña vencida, se buscaría
  manualmente desde Administración).

## 10. Decisiones registradas

| Tema | Decisión |
|---|---|
| Audiencia por cara | Consultas = READ amplio; Administración y Dashboard = WRITE únicamente |
| Resultado de búsqueda con múltiples coincidencias | Lista clicable → detalle |
| Campos de búsqueda | 3 filtros separados combinables (usuario, nombre, oficina) |
| Cards resumen en Administración | KPIs generales del dominio (no resumen del usuario seleccionado) |
| Secciones del dashboard | Distribución por OU, contraseñas vencidas, inactivas, bloqueadas |
| Umbral contraseña vencida | 90 días sin cambio |
| Umbral cuenta inactiva | 60 días sin login |
| Tamaño de listas del dashboard | Top 10 + conteo total |
| Listas del dashboard accionables | Sí, click navega a Administración con el usuario cargado |
| Agrupación de distribución | Por OU completa (no por atributo Oficina de texto libre) |
| Estructura de navegación | Rutas hijas con guard propio por cara, no pestañas puramente cliente |
| Construcción del dashboard | Un solo recorrido paginado de AD, agregados calculados en memoria |
