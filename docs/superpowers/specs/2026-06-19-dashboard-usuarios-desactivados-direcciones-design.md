# Dashboard: Usuarios Desactivados y Gráfico por Ubicación — Design

## Goal

Extender el dashboard de SoporteDesk INIA con dos elementos nuevos para monitorear usuarios de red (AD): (1) una tarjeta KPI de usuarios desactivados con acceso directo a la lista filtrada, y (2) un gráfico de barras agrupadas (Activos vs Inactivos) por Sede o Dependencia.

## Context

El dashboard actual (`DashboardComponent`) muestra 7 tarjetas KPI con conteos simples (Licencias Office, Correos, Usuarios de Red/AD, VPN, Claves WiFi, Impresoras, Equipos), alimentadas por `GET /api/dashboard/counts` → `DashboardCounts` (record). No existe ninguna librería de gráficos instalada en el frontend.

`UsuarioRed` tiene un campo `estado: String` con valores observados en producción: `"Activo"` (835) e `"Inactivo"` (1), de un total de 836 usuarios. Existen 27 `Sede` y 39 `Dependencia` en el catálogo. "Sede Central" concentra ~91% de los usuarios.

## Architecture

### Backend

**`UsuarioRedRepository`** — dos queries nuevas:

1. Conteo de desactivados (no asume valores exactos, futuro-compatible):
   ```java
   @Query("SELECT COUNT(u) FROM UsuarioRed u WHERE u.estado IS NULL OR LOWER(u.estado) <> 'activo'")
   long countDesactivados();
   ```

2. Conteo agrupado por ubicación y estado, una fila por (ubicación, estado):
   ```java
   @Query("SELECT s.nombre, u.estado, COUNT(u) FROM UsuarioRed u JOIN u.sede s GROUP BY s.nombre, u.estado")
   List<Object[]> countGroupedBySedeAndEstado();

   @Query("SELECT d.nombre, u.estado, COUNT(u) FROM UsuarioRed u JOIN u.dependencia d GROUP BY d.nombre, u.estado")
   List<Object[]> countGroupedByDependenciaAndEstado();
   ```

**`DashboardCounts`** (record) — un campo nuevo: `usuariosRedInactivos: long`.

**`DashboardService`** — puebla `usuariosRedInactivos` desde `countDesactivados()`. Nuevo método `usuariosRedPorUbicacion(String nivel)` que llama a la query correspondiente según `nivel` (`"sede"` o `"dependencia"`) y pivota los `Object[]` crudos en una lista de DTOs `UbicacionUsuariosCount(String nombre, long activos, long inactivos)` — pivoteo en Java, no en SQL/JPQL, para evitar `CASE WHEN` frágil entre dialectos.

**`DashboardController`** — nuevo endpoint:
```
GET /api/dashboard/usuarios-red-por-ubicacion?nivel=sede|dependencia
```
Responde `List<UbicacionUsuariosCount>`. `nivel` inválido o ausente → default a `"sede"`.

### Frontend

**Tarjeta KPI "Usuarios Desactivados"**
- Se agrega como 8ª tarjeta en `dashboard.component.html`, mismo estilo que las 7 existentes.
- `dashboard-counts.model.ts` gana el campo `usuariosRedInactivos: number`.
- `DashboardCard` (interfaz en `dashboard.component.ts`) gana un campo opcional `queryParams?: Record<string, string>`; la nueva tarjeta lo usa con `{ search: 'Inactivo' }` para navegar a `/usuarios-red` ya filtrada. El template pasa `[queryParams]="card.queryParams"` junto al `[routerLink]` existente (las 7 tarjetas actuales simplemente no definen este campo, sin cambio de comportamiento para ellas).
- **Corrección necesaria en `totalRegistros`:** hoy `ngOnInit` calcula `totalRegistros = Object.values(counts).reduce((a, b) => a + b, 0)`, sumando *todos* los campos del record `DashboardCounts` a ciegas. Si `usuariosRedInactivos` se agrega a ese mismo record, quedaría sumado dos veces (ya está incluido dentro de `usuariosRed`). Se cambia ese cálculo para sumar explícitamente solo los 7 campos que ya representan categorías de "registros" (los mismos usados en `toCards()`, sin incluir `usuariosRedInactivos`), en vez de iterar `Object.values(counts)` a ciegas.

**Pre-filtrado de la lista de Usuarios de Red**
- `GenericTableComponent` gana `@Input() initialSearch = ''`; en `ngOnInit` inicializa `searchTerm` desde ese input y lo refleja en el `value` del input de búsqueda existente (para que el usuario vea "Inactivo" ya escrito, no solo la tabla filtrada).
- `UsuariosRedListComponent` lee el query param `search` (via `ActivatedRoute`) en `ngOnInit`, lo pasa a `<app-generic-table [initialSearch]="...">` y llama `this.load(search)` si está presente.

**Gráfico por ubicación**
- Nuevas dependencias npm: `chart.js`, `ng2-charts`.
- Nuevo componente standalone `UsuariosRedPorUbicacionChartComponent`:
  - Dos botones toggle: "Por Sede" / "Por Dependencia" (default: Sede).
  - Llama a `DashboardService.getUsuariosRedPorUbicacion(nivel)` al cambiar el toggle y al iniciar.
  - Renderiza un `<canvas baseChart>` (ng2-charts) tipo `bar` con `indexAxis: 'y'` (barras horizontales) y dos datasets agrupados: "Activos" e "Inactivos".
  - Se monta en `app-config.ts` / en el propio componente con `provideCharts(withDefaultRegisterables())`.
- Se inserta en `dashboard.component.html` debajo de la grilla de tarjetas KPI.

## Data Flow

1. `DashboardComponent.ngOnInit()` pide `counts` (incluye `usuariosRedInactivos`) y el componente de gráfico pide `usuarios-red-por-ubicacion?nivel=sede` por separado.
2. Clic en la tarjeta → `Router.navigate(['/usuarios-red'], { queryParams: { search: 'Inactivo' } })`.
3. `UsuariosRedListComponent` lee el query param, pre-filtra la tabla y refleja el término en la caja de búsqueda.
4. Toggle del gráfico → nueva llamada HTTP con el `nivel` elegido, re-render del chart.

## Error Handling

- El dashboard actual no maneja errores de carga (el `subscribe` de `getCounts()` no tiene callback de error); este feature no cambia eso para las tarjetas existentes.
- El nuevo componente de gráfico es el primero en introducir manejo de error en el dashboard: si `usuarios-red-por-ubicacion` falla, muestra un mensaje de texto simple ("No se pudo cargar el gráfico") en el lugar del canvas, sin afectar el resto de la página.
- `nivel` fuera de `{sede, dependencia}` en el backend → se trata como `"sede"` (no se lanza error 400, ya que es un parámetro de UI controlado, no input de usuario externo).

## Testing

- Backend: `DashboardServiceTest` (Mockito) — nuevo test para `usuariosRedPorUbicacion` verificando el pivoteo de `Object[]` a activos/inactivos, y test para que `usuariosRedInactivos` se calcule correctamente. Convención existente del proyecto (no `@SpringBootTest`).
- Frontend: `DashboardComponent` spec — verificar que el clic en la tarjeta navega con los `queryParams` correctos. `UsuariosRedPorUbicacionChartComponent` spec — verificar que el toggle dispara la llamada HTTP con el `nivel` correcto (via `HttpTestingController`, sin renderizar el canvas real). `UsuariosRedListComponent` spec — verificar que lee el query param `search` y lo pasa a `initialSearch`/`load`.

## Global Constraints

- No se introduce ninguna librería de gráficos adicional a `chart.js` + `ng2-charts`.
- El conteo de "desactivados" se basa en `estado <> 'Activo'` (case-insensitive) o `estado IS NULL` — no en una lista fija de valores "inactivos" conocidos.
- No se modifica el comportamiento de búsqueda existente de `UsuariosRedListComponent` para términos que no provienen de query param (sigue funcionando igual que hoy).
- El gráfico por defecto agrupa por Sede; el toggle permite cambiar a Dependencia.
