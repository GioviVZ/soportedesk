# Módulo VPN — Rediseño en 3 caras (Registros / Administración / Dashboard)

**Fecha:** 2026-07-09
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Precedente:** [2026-07-08-modulo-active-directory-tres-caras-design.md](2026-07-08-modulo-active-directory-tres-caras-design.md)
(mismo patrón de 3 caras ya implementado y aprobado por el usuario para Usuarios de Red/AD).

---

## 1. Objetivo

Reorganizar la página única actual de VPN (`vpn-list.component.ts`, con un toggle cliente
`'todas' | 'solicitudes'` visible solo para aprobadores) en **tres caras** con audiencias y
propósitos distintos, replicando la estructura visual y de rutas del módulo AD:

1. **Registros** — listado de solo lectura de todas las cuentas VPN, con búsqueda; audiencia
   ampliada a cualquiera con acceso base al módulo `vpn`. Incluye el botón "Nueva solicitud"
   (visible solo con `solicitar-vpn`), ya que solicitar es un permiso distinto de aprobar y hoy
   no tiene una pantalla propia.
2. **Administración** — el flujo de aprobación existente (aprobar/rechazar/observar, KPIs de
   4 estados, gestión de credenciales), sin cambios de lógica, solo restyle visual. Visible para
   `solicitar-vpn` o `aprobar-vpn`.
3. **Dashboard** — vista analítica nueva (KPIs + distribución por tipo de equipo + vencimientos
   de antivirus), solo para `aprobar-vpn`, con un endpoint backend nuevo de agregación (hoy no
   existe ninguno, solo el endpoint liviano `/kpis`).

## 2. Arquitectura y rutas

```
/vpn                                           (layout: VpnShellComponent)
  ├── /registros       canActivate: moduloGuard('vpn')                    [default redirect]
  ├── /administracion  canActivate: vpnAdminGuard  (solicitar-vpn O aprobar-vpn)
  └── /dashboard       canActivate: moduloGuard('vpn', { write: true })   [ver nota]
```

- `VpnShellComponent`: layout delgado con la barra de pestañas + `<router-outlet>`, mismo
  patrón visual que `UsuariosRedShellComponent` (`module-header` + `.ad-tabs`-equivalente).
  Las pestañas de Administración/Dashboard no se renderizan si el usuario no tiene ninguno de
  los permisos correspondientes.
- **Nota sobre guards**: a diferencia de AD (donde `canWrite('usuarios-red')` es un único check),
  VPN tiene permisos granulares (`solicitar-vpn`, `aprobar-vpn`) que son claves de permiso
  *distintas*, no un flag write de un módulo único. `moduloGuard(modulo, {write:true})` solo
  soporta un `modulo` string, así que:
  - **Administración** necesita un guard dedicado `vpnAdminGuard` (nuevo, pequeño,
    `src/app/core/auth/vpn-admin.guard.ts`) que redirige a `/dashboard` salvo que
    `authService.canWrite('solicitar-vpn') || authService.canWrite('aprobar-vpn')` (o sea admin).
  - **Dashboard** usa `moduloGuard('aprobar-vpn', { write: true })` directamente (el string
    `modulo` de `moduloGuard` puede ser cualquier clave de permiso, no necesariamente `'vpn'`),
    igual que como AD gatea Dashboard solo a la audiencia de gestión.
- El ítem del sidebar sigue siendo uno solo ("VPN"), apunta a `/vpn` y redirige a `registros`.
- Se elimina el toggle cliente `activeTab` de `vpn-list.component.ts`; su lógica se reparte
  entre las 3 caras nuevas.
- `vpn.service.ts` y `vpn.model.ts` (ya existentes) se extienden con los nuevos métodos/tipos
  del punto 3; no se tocan las operaciones de escritura existentes (crear/editar/aprobar/
  rechazar/observar/eliminar).
- Los 5 componentes de modal ya existentes (`vpn-form`, `vpn-antivirus-form`, `vpn-aprobar-form`,
  `vpn-resolucion-form`, `vpn-config-institucional-form`) se reutilizan sin cambios de lógica,
  solo se reubican según qué cara los abre.

## 3. Backend — cambios

Todo dentro de `com.inia.soportedesk.vpn` (paquete ya existente).

### 3.1 Corrección de seguridad: `PATCH /api/vpn/{id}/antivirus`

Hoy este endpoint no tiene `@PreAuthorize` — cualquier usuario autenticado puede modificarlo
(confirmado además que el botón que lo dispararía en el frontend actual no está conectado a
ningún lugar de la UI — es código muerto hoy). Se agrega:

```java
@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_solicitar-vpn')")
```

Consistente con que `VpnAntivirusFormComponent` es parte de la familia de formularios de
solicitud (mismo permiso que crear/editar solicitud), no de aprobación.

### 3.2 Dashboard completo (usado solo por la cara Dashboard)

```
GET /api/vpn/dashboard/completo
```
- `@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_aprobar-vpn')")`.
- Reutiliza `VpnService.findAll(null)` (o una variante interna sin el `search` param) para
  traer todos los registros, luego calcula en memoria (lógica pura, testeable):
  - Los 4 conteos de `estadoSolicitud` (mismo dato que `/kpis` hoy, se incluye para no requerir
    una segunda llamada desde el frontend) + total.
  - **Distribución por tipo de equipo**: agrupa por `tipoEquipo` (`INIA`/`PERSONAL`), cuenta
    todas las solicitudes (no solo aprobadas, a diferencia de AD que solo cuenta activos, porque
    aquí el interés es volumen de solicitudes por tipo, no "cuentas vigentes").
  - **Top 10 antivirus vencidos/por vencer**: reutiliza exactamente la lógica ya existente de
    `VpnService.aplicarVence()` (si `tipoEquipo == INIA` usa el vencimiento institucional vía
    `configInstitucionalService.getVencimiento()`, si no usa `vencimientoAntivirus` del registro)
    y el mismo umbral que hoy calcula el cliente en `vpn-list.component.ts` (`vencimientoStatus`):
    `vencidos` = fecha < hoy; `por vencer` = 0–30 días desde hoy. Se portan ambos buckets al
    backend como listas separadas orden ascendente por urgencia (vencidos primero, luego por
    vencer), + conteo total de cada uno.
- DTOs:
  ```java
  public record VpnTipoEquipoCount(String tipoEquipo, long total) {}
  public record VpnVencimientoAlerta(Long vpnId, String titular, String tipoEquipo, LocalDate vence, String detalle) {}
  public record VpnDashboardCompleto(
      long pendientes, long aprobadas, long rechazadas, long observadas, long total,
      List<VpnTipoEquipoCount> distribucionPorTipoEquipo,
      List<VpnVencimientoAlerta> antivirusVencidos, long totalAntivirusVencidos,
      List<VpnVencimientoAlerta> antivirusPorVencer, long totalAntivirusPorVencer
  ) {}
  ```
- Ante error (p.ej. `configInstitucionalService` falla), se sigue el mismo patrón lenient ya
  usado en el resto del backend: capturar la excepción, loguear `WARN`, y devolver un DTO vacío
  con HTTP 200 (no reventar la pantalla).

## 4. Cara 1 — Registros

Ruta `/vpn/registros`, visible para cualquiera con acceso base a `vpn` (lectura).

- Reutiliza `GET /api/vpn?search=` (ya existente) — tabla con búsqueda, mismas columnas que la
  vista "Todas" de hoy (titular, tipo de equipo, estado, estado de solicitud, vencimiento).
- Click en una fila abre el detalle completo en modal — **sin la sección de decisión** (aprobar/
  rechazar/observar), es de solo lectura salvo por lo descrito abajo.
- Botón "Nueva solicitud" (visible solo con `solicitar-vpn`) abre `VpnFormComponent` en modo
  creación — mismo componente/lógica que usa Administración para editar.
- Si el usuario tiene además `solicitar-vpn`, el detalle de una solicitud propia (o cualquiera,
  igual que hoy) muestra botones "Editar"/"Eliminar" ya existentes en `viewing` (`editFromDetail`/
  `deleteFromDetail`), sin cambios de lógica — se trasladan tal cual desde `vpn-list.component.ts`.
- Las credenciales VPN (`credenciales-vpn`) NO se muestran aquí — quedan solo en Administración
  (ver §5), igual que hoy solo se exponen quien tenga ese permiso vía `maskCredencialesIfNeeded`.

## 5. Cara 2 — Administración

Ruta `/vpn/administracion`, visible con `solicitar-vpn` o `aprobar-vpn` (`vpnAdminGuard`).
Evolución directa de la vista "Solicitudes" actual; no cambia ninguna operación existente.

- Fila de KPIs de 4 estados (`GET /kpis`, ya existente, sin cambios) con las mismas tarjetas de
  color (`tone-orange/green/red/yellow`) — solo restyle a `stat-pill`/tokens del sistema de
  diseño.
- Misma tabla de solicitudes, con los mismos filtros por estado que hoy.
- Panel de decisión (aprobar/rechazar/observar) para `PENDIENTE`, visible solo con
  `aprobar-vpn` — sin cambios de lógica, solo restyle.
- Gestión de credenciales (`credenciales-vpn`) permanece aquí, en el detalle de un registro
  `APROBADO`, igual que hoy.

## 6. Cara 3 — Dashboard

Ruta `/vpn/dashboard`, visible solo con `aprobar-vpn`. Usa `GET /api/vpn/dashboard/completo`.

- Fila de KPIs (pendientes/aprobadas/rechazadas/observadas + total).
- Gráfico de distribución por tipo de equipo (INIA vs PERSONAL) — barra horizontal, mismo
  patrón visual (`ng2-charts`) que el dashboard de AD, para consistencia.
- 2 tarjetas "top 10" (antivirus vencidos, antivirus por vencer):
  - Conteo total destacado arriba de cada tarjeta.
  - Cada fila: titular, tipo de equipo, fecha de vencimiento, detalle textual.
  - Cada fila es clicable → navega a `/vpn/registros?id=<id>` o abre el detalle directamente en
    Administración si el usuario puede actuar sobre ella (decisión de implementación, no bloquea
    el diseño — se resuelve igual que AD resolvió su propio caso análogo).
  - Si el total > 10, texto informativo "+N más" sin link.

## 7. Manejo de errores

- Dashboard completo: ante error backend, devuelve DTO vacío con HTTP 200 (mismo patrón ya
  usado por `obtenerDashboardCompleto` en AD), y el frontend muestra "No se pudo cargar" + botón
  reintentar.
- El resto de operaciones (CRUD, aprobar/rechazar/observar) no cambian su manejo de errores
  actual.

## 8. Pruebas

- **Backend unit**: cálculo de agregados del dashboard completo (dado un `List<Vpn>` simulado,
  verificar conteos por tipo de equipo, buckets de vencimiento con el umbral 0/30 días, orden).
  Test de `@PreAuthorize` en `PATCH /antivirus` (403 sin `solicitar-vpn`).
- **Backend integración**: `@WebMvcTest` del endpoint nuevo con el service mockeado — verifica
  ruta, `@PreAuthorize` (403 sin `WRITE_aprobar-vpn`), forma de la respuesta.
- **Frontend**: specs de cada cara nueva (visibilidad de pestañas según permiso, tabla de
  Registros, botón "Nueva solicitud" condicionado a `solicitar-vpn`, dashboard renderiza KPIs +
  gráfico + alertas), siguiendo el patrón ya usado en los specs de AD.
- **Verificación manual**: crear una solicitud desde Registros, aprobarla desde Administración,
  confirmar que aparece en la distribución del Dashboard; confirmar que `PATCH /antivirus` ahora
  devuelve 403 sin el permiso adecuado.

## 9. Fuera de alcance

- Wiring del modal `VpnAntivirusFormComponent` a un botón real en la UI (hoy es código muerto)
  — se asegura el endpoint pero no se le agrega una entrada de UI nueva; si se necesita, es una
  mejora futura aparte.
- Paginación completa de las listas del dashboard más allá del top 10.
- Umbral de vencimiento configurable (0/30 días queda como constante fija, igual que hoy en el
  cliente).
- Cambios a la lógica de aprobación, credenciales o migración histórica — nada de eso se toca.

## 10. Decisiones registradas

| Tema | Decisión |
|---|---|
| Audiencia por cara | Registros = lectura amplia + crear solicitud; Administración = solicitar-vpn o aprobar-vpn; Dashboard = solo aprobar-vpn |
| Guard de Administración | Nuevo `vpnAdminGuard` dedicado (OR de dos permisos), no cabe en `moduloGuard` genérico |
| Guard de Dashboard | `moduloGuard('aprobar-vpn', {write:true})` — el string de módulo puede ser cualquier clave de permiso |
| Umbral de vencimiento en Dashboard | 0 días (vencido) / 30 días (por vencer), igual que el cálculo cliente actual |
| Distribución del Dashboard | Por tipo de equipo (INIA/PERSONAL), cuenta todas las solicitudes (no solo activas) |
| Fix de seguridad `PATCH /antivirus` | Se agrega `WRITE_solicitar-vpn` como parte de este trabajo, no se pospone |
| Credenciales VPN | Permanecen solo en Administración, sin cambios de exposición |
| Construcción del dashboard | Reutiliza `VpnService.findAll` + lógica existente de `aplicarVence`, agregados calculados en memoria |
