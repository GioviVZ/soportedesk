# Rediseño de frontend inspirado en Berry Admin Template — Fase 1 (fundación + Dashboard)

## Contexto

El usuario pidió aprender del template `docs/berry-free-angular-admin-template-master`
(Angular admin template basado en Bootstrap + ApexCharts + iconos Tabler) y aplicar sus
patrones visuales al sistema, adaptados a nuestra paleta y mejorados con dashboards
interactivos y seleccionables por módulo. Nueva paleta: azul/celeste/blanco en modo claro,
negro/blanco/celeste/gris en modo oscuro.

Decisiones tomadas en brainstorming (ver conversación 2026-07-18):

1. Adoptar las librerías base de Berry: Bootstrap (solo CSS/grid/utilities, sin su JS),
   ApexCharts (vía `ng-apexcharts`), iconos Tabler (webfont).
2. Rollout en fases. **Esta fase (1): fundación de tema + shell (sidebar/header/login) +
   Dashboard principal.** Los 6 dashboards de módulo (Equipos, Impresoras, VPN, WiFi,
   Correos, Usuarios Red) y el resto de listados/formularios **no se tocan** — quedan para
   fases futuras. Chart.js/ng2-charts se mantiene instalado en paralelo (lo siguen usando
   esos 6 dashboards) hasta que se migren.
3. Colores de marca (primary/secondary/heading/bg) pasan a azul/celeste; los 8 colores de
   acento por módulo (`--color-equipos`, `--color-vpn`, etc.) **se mantienen** tal cual para
   preservar la diferenciación visual entre módulos.
4. Interactividad del Dashboard: **ambas** — (a) selector de módulo que filtra el panel
   in-situ con un desglose real por módulo, y (b) enriquecimiento visual de las cards
   existentes (sparklines, badges, dropdown de acciones rápidas).
5. Los dropdowns/toggles de las cards se implementan con una directiva Angular propia
   (patrón `IfAdminDirective`), **no** se agrega `@ng-bootstrap/ng-bootstrap`.
6. Se agrega un endpoint de desglose por módulo en el backend para los 5 módulos que hoy no
   lo tienen (Impresoras, VPN, WiFi, Correos, Equipos); Licencias y Usuarios de Red
   reutilizan endpoints ya existentes.

## Paleta de colores (nuevos tokens en `_variables.scss`)

**Modo claro:**
```
--color-primary:        #1565c0   (azul marca — botones, sidebar activo, links)
--color-primary-hover:  #0d47a1
--color-primary-light:  #e3f2fd
--color-secondary:      #0ea5e9   (celeste — acentos secundarios, highlights)
--color-secondary-light:#e0f2fe
--color-heading:        #0f2942
--color-bg:              #f4f8fc
--color-surface:         #ffffff
--color-border:          #dbe6f0
--color-border-strong:   #b7cbe0
--color-text:            #16232f
--color-text-secondary:  #526478
--color-text-muted:      #8ea0b3
```

**Modo oscuro:**
```
--color-bg:              #05080c
--color-surface:         #0c1116
--color-surface-raised:  #121922
--color-border:          #1d2732
--color-border-strong:   #33404d
--color-text:            #f2f6fa
--color-text-secondary:  #aab8c5
--color-text-muted:      #74808c
--color-primary:         #4da3ff
--color-primary-hover:   #6cb6ff
--color-primary-light:   rgba(77,163,255,.16)
--color-secondary:       #38bdf8
--color-secondary-light: rgba(56,189,248,.16)
```

Colores de estado (success/warning/danger/info) y colores por módulo se mantienen sin
cambios. `--color-accent*` se alinea a `--color-secondary*` (celeste) en vez del verde
actual.

## Frontend — dependencias nuevas

```
bootstrap (^5.3)         — solo CSS: grid, utilities, mixins de cards/badges
apexcharts + ng-apexcharts — charts del Dashboard principal (reemplaza Chart.js SOLO ahí)
@tabler/icons-webfont (o equivalente vía CDN local en assets) — iconografía de shell y cards
```
`chart.js` / `ng2-charts` quedan instalados (los siguen usando los 6 dashboards de módulo).

## Shell (sidebar/header/login)

Reskin visual con clases utility de Bootstrap + tokens nuevos. Se conserva intacta la
lógica existente: `LayoutService` (signal `sidebarOpen`), `DomSanitizer` para iconos SVG
inline (donde no haya equivalente Tabler ya cargado), estructura de rutas y guards. Cambia
el CSS/markup, no el comportamiento.

## Dashboard — selector de módulo

- Franja de pills/tabs sobre las cards de módulo: "Todos" + un pill por módulo visible
  para el usuario (respetando permisos ya existentes vía `canOpen`).
- Al seleccionar un módulo: se pide `GET /api/dashboard/{modulo}-por-*` (el endpoint que
  corresponda) y se reemplaza un panel de detalle (ApexChart de barras/dona + lista de
  categorías con conteo) sin navegar de página. La card del módulo seleccionado queda
  resaltada (borde/glow con `--card-color`).
- El clic directo sobre una card sigue navegando al módulo (comportamiento actual
  preservado) — el selector es una franja aparte, no reemplaza la navegación.

## Dashboard — enriquecimiento de cards

- Sparkline ApexChart embebido (mini tendencia, con datos sintéticos de los últimos N
  snapshots si no hay histórico real — solo decorativo/indicativo, se documenta como tal).
- Badge de salud (reutiliza `healthState`/`healthLabel` ya existentes).
- Dropdown de acciones rápidas (ej. "Abrir módulo", "Ver desactivados") con una directiva
  `ClickOutsideDirective` + `[class.open]` propia, sin librería.

## Backend — nuevos endpoints de desglose

Un `record` compartido:
```java
public record ModuloBreakdownItem(String label, long count) {}
```

Nuevos endpoints en `DashboardController` (mismo patrón que los existentes: método propio,
`@PreAuthorize("hasRole('ADMIN') || hasAuthority('READ_<modulo>')")`):

| Endpoint | Agrupa por | Repositorio |
|---|---|---|
| `GET /dashboard/impresoras-por-estado` | `Impresora.estado` | `ImpresoraRepository` (nueva `@Query`) |
| `GET /dashboard/vpn-por-estado-solicitud` | `Vpn.estadoSolicitud` | `VpnRepository` (nueva `@Query`, lista agrupada — no solo count) |
| `GET /dashboard/wifi-por-estado` | `Wifi.estado` | `WifiRepository` (nueva `@Query`) |
| `GET /dashboard/correos-por-estado` | `VwGwDashboard.estado` | `VwGwDashboardRepository` (nueva `@Query`, JPQL sobre entidad `@Immutable`, solo lectura) |
| `GET /dashboard/equipos-por-tipo` | `VwInvComputerFull.tipoEquipo` (filtrado `eliminado = 0`) | `VwInvComputerFullRepository` (nueva `@Query`) |

Licencias reutiliza `GET /dashboard/licencias-por-tipo` ya existente (mapeado en frontend a
`ModuloBreakdownItem`). Usuarios de Red usa un desglose simple Activos/Inactivos derivado
de `DashboardCounts` (no requiere endpoint nuevo — ya viene en `/dashboard/counts`).

## Testing

- Backend: test unitario por cada nueva query de repositorio (o test de servicio con datos
  sembrados) + test de controller (`@PreAuthorize` deniega sin permiso, 200 con permiso).
  `mvn verify` debe seguir en verde.
- Frontend: actualizar `dashboard.component.spec.ts` para cubrir el selector de módulo
  (cambia de pill → dispara la llamada al servicio correcta → actualiza el panel). Suite
  Karma (`npx ng test --watch=false`) en verde.

## Fuera de alcance

Dashboards de Equipos/Impresoras/VPN/WiFi/Correos/Usuarios Red, listados, formularios,
modales de todos los módulos de negocio. Migración completa de Chart.js → ApexCharts.
Adopción de `@ng-bootstrap/ng-bootstrap`.
