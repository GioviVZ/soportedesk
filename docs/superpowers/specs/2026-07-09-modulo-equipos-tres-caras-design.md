# Módulo Inventario de Equipos — Rediseño en 3 caras (Inventario / Mantenimiento / Dashboard)

**Fecha:** 2026-07-09
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Precedente:** [2026-07-09-modulo-impresoras-tres-caras-design.md](2026-07-09-modulo-impresoras-tres-caras-design.md) (mismo modelo de permiso plano y del mismo split en 3 caras; principal diferencia: Equipos no tiene CRUD, es solo lectura contra GLPI con una capa de enriquecimiento propia)

---

## 1. Objetivo

Reorganizar la página única actual de Inventario de Equipos (`equipos-list.component.ts`, con un
toggle de cliente Inventario/Salud) en **tres caras** con rutas y guards reales, replicando el
patrón de Impresoras/AD. Equipos usa un único permiso plano `equipos`
(`READ_equipos`/`WRITE_equipos`), igual que Impresoras y AD (no split de autoridades como VPN).

1. **Inventario** — KPI grid + filtros + tabla/tarjetas móviles, **solo lectura**. Visible para
   `READ_equipos`. Es el contenido actual de la pestaña "Inventario", sin cambios de
   comportamiento.
2. **Mantenimiento** — la cola de trabajo administrativa: KPI grid de alertas + tabla "Salud del
   Inventario" (hoy mezclada dentro de Inventario). Click en una fila navega a la ficha
   (`/equipos/:id`), donde ya vive el formulario de enriquecimiento editable (código
   patrimonial, tipo override, estado de depuración, observaciones) sin cambios. Visible
   **solo** para `WRITE_equipos` (pestaña oculta si no se tiene).
3. **Dashboard** — vista analítica nueva: KPIs (Total/Desktop/Laptop/Otros/Sede Central/EEAs) +
   distribución por fabricante + resumen de salud (rojos/amarillos/ok, sin patrimonial/usuario/
   sede) + top 10 dependencias con más equipos. Visible solo para `WRITE_equipos`.

A diferencia de Impresoras, Equipos no tiene crear/editar/eliminar del recurso principal (los
equipos vienen de GLPI, solo lectura). Lo único editable es la capa de enriquecimiento en
`ssti`, que ya vive dentro de la ficha de detalle (`EquipoDetailComponent`) y **no cambia** en
este rediseño — solo cambia dónde vive la tabla de Salud que apunta hacia ella.

## 2. Arquitectura y rutas

```
/equipos                                      (layout: EquiposShellComponent)
  ├── ''              redirectTo 'inventario'
  ├── /inventario     canActivate: moduloGuard('equipos')                  [default]
  ├── /mantenimiento  canActivate: moduloGuard('equipos', { write: true })
  └── /dashboard      canActivate: moduloGuard('equipos', { write: true })
/equipos/:id                                  canActivate: moduloGuard('equipos')  [SIN CAMBIOS]
```

- `EquiposShellComponent`: mismo patrón que `ImpresorasShellComponent` — `module-header` +
  `nav.ad-tabs` + `<router-outlet>`. Las pestañas de Mantenimiento/Dashboard no se renderizan si
  `!authService.canWrite('equipos')`.
- No se necesita un guard nuevo — `moduloGuard('equipos', { write: true })` ya existe (mismo
  mecanismo usado por AD/Impresoras).
- El ítem del sidebar sigue siendo uno solo ("Inventario de Equipos"), apunta a `/equipos` y
  redirige a `inventario`.
- `/equipos/:id` (la ficha, `EquipoDetailComponent`) **no cambia de ruta ni de guard** — sigue
  siendo una página única compartida por ambas caras de lectura/escritura. El gating de su
  sección "Mantenimiento / Enriquecimiento" sigue siendo por permiso real
  (`*ngIf="auth.canWrite('equipos')"`), no por un input explícito como el `allowActions` de
  Impresoras — no hace falta esa distinción porque acá no hay una ficha embebida duplicada por
  cara, es una sola ruta.

## 3. Componentes

- **`EquiposShellComponent`** (nuevo) — calco de `ImpresorasShellComponent`: header + 3 tabs +
  router-outlet.
- **`EquiposInventarioComponent`** (nuevo, reemplaza a `EquiposListComponent` como página) —
  contenido actual de la pestaña "Inventario": KPI grid (Total Activos/Desktop/Laptop/Otros/
  Sede Central/EEAs), filtros (búsqueda, sede, dependencia, subdependencia, tipo, fabricante),
  `app-generic-table` + tarjetas móviles. Se retira el `tab-toggle` y todo lo relativo a Salud
  (se muda al componente de Mantenimiento). Click en fila navega a `/equipos/:id`.
- **`EquiposMantenimientoComponent`** (nuevo) — contenido actual de la pestaña "Salud del
  inventario": KPI grid de alertas (Críticos/Advertencia/Sin patrimonial/Sin usuario/Sin sede) +
  tabla de salud con badges por nivel. Click en fila navega a `/equipos/:id`.
- **`EquiposDashboardComponent`** (nuevo) — ver sección 5.
- **Sin cambios**: `EquipoDetailComponent`, `equipo.service.ts` (se le agrega
  `getDashboardCompleto()`), `equipo.model.ts` (se le agrega `EquipoDashboardCompleto` y tipos
  relacionados).
- **`EquiposListComponent`** (el actual) se elimina, reemplazado por los 3 componentes de arriba.

## 4. Backend — nuevo endpoint

Dentro de `com.inia.soportedesk.equipos` (paquete ya existente, sin subpaquete `dto`, igual que
`EquipoKpisDto`/`EquipoSaludDto` ya están planos ahí).

```
GET /api/equipos/dashboard/completo
```
- `@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_equipos')")`.
- Reutiliza `repository.findFiltered(null, null, null, null, null, null)` (igual que
  `getKpis()`/`getSalud()` hoy), agrega en memoria (lógica pura, testeable):
  - Los 6 conteos que ya calcula `getKpis()` — se duplican en este payload para que el
    Dashboard sea una sola llamada (mismo criterio ya usado en el dashboard de Impresoras).
  - **Distribución por fabricante**: agrupa por `fabricanteEquipo`, cuenta equipos (incluye
    `null`/vacío como `"Sin fabricante"`).
  - **Top 10 dependencias**: agrupa por `oficinaId`, cuenta equipos, orden descendente, corte en
    10 (fallback `"Sin dependencia"`).
  - **Resumen de salud**: rojos/amarillos/ok + sinPatrimonial/sinUsuario/sinSede. Para no
    duplicar los umbrales de alerta (`sinEncendido > 12m`, `sinActualizacion > 6m`, etc.), se
    extrae la lógica de `buildSaludDto()` en un método privado reutilizable
    (`resolveNivelAlerta(VwInvComputerFull, LocalDateTime)`), usado tanto por `getSalud()` como
    por este nuevo agregado.
- DTOs (en el paquete `equipos`, sin subpaquete `dto`):
  ```java
  public record EquipoFabricanteCount(String fabricante, long total) {}
  public record EquipoDependenciaCount(String dependencia, long total) {}
  public record EquipoSaludResumen(
      long rojos, long amarillos, long ok,
      long sinPatrimonial, long sinUsuario, long sinSede
  ) {}
  public record EquipoDashboardCompleto(
      long total, long desktopCount, long laptopCount, long otrosCount,
      long sedeCentralCount, long eeasCount,
      List<EquipoFabricanteCount> distribucionPorFabricante,
      List<EquipoDependenciaCount> topDependencias,
      EquipoSaludResumen salud
  ) {}
  ```
- Ante error: mismo patrón lenient ya establecido (AD/VPN/Correos/Impresoras) — capturar
  excepción, loguear `WARN`, devolver DTO vacío con HTTP 200.
- **No se tocan** `GET /api/equipos/kpis` ni `GET /api/equipos/salud` — siguen siendo usados tal
  cual por Inventario y Mantenimiento respectivamente.

### Autorización

| Endpoint | Rol requerido |
|---|---|
| `GET /api/equipos` , `/kpis`, `/sedes`, `/tipos`, `/dependencias`, `/subdependencias`, `/fabricantes`, `/{id}` | `READ_equipos` o `ADMIN` (sin cambio) |
| `GET /api/equipos/salud` | `READ_equipos` o `ADMIN` (sin cambio — la ruta sigue existiendo, solo cambia qué componente de UI la consume) |
| `GET /api/equipos/dashboard/completo` | `WRITE_equipos` o `ADMIN` (nuevo) |
| `PUT /api/equipos/{id}/enrichment`, `GET /historial` | `WRITE_equipos`/`READ_equipos` (sin cambio) |

## 5. Cara 1 — Inventario

Ruta `/equipos/inventario`, visible para `READ_equipos`.

Contenido idéntico a la pestaña "Inventario" de hoy: KPI grid, filtros, tabla, tarjetas móviles.
Click en fila → `/equipos/:id`. Sin cambios de comportamiento, solo se muda a un componente
dedicado.

## 6. Cara 2 — Mantenimiento

Ruta `/equipos/mantenimiento`, visible solo con `WRITE_equipos`.

Contenido idéntico a la pestaña "Salud del inventario" de hoy: KPI grid de alertas + tabla de
salud con badges (ROJO/AMARILLO) y etiquetas de problema (sin patrimonial/usuario/sede). Click
en fila → `/equipos/:id`, donde aparece la sección Mantenimiento/Enriquecimiento (sin cambios).
No incluye buscador propio — para enriquecer un equipo sin alertas, el admin lo ubica en
Inventario y entra a su ficha (la sección de enriquecimiento aparece igual, gateada por permiso
real, sin importar desde qué cara se llegó).

## 7. Cara 3 — Dashboard

Ruta `/equipos/dashboard`, visible solo con `WRITE_equipos`. Usa
`GET /equipos/dashboard/completo`. Mismo layout visual que `impresoras-dashboard.component.ts`
(toolbar con "Actualizado HH:mm" + botón refrescar, manejo de error con "no se pudo cargar").

- Fila de KPIs: Total, Desktop, Laptop, Otros, Sede Central, EEAs.
- Gráfico de barras horizontal (`ng2-charts`, mismo patrón visual que los demás dashboards):
  distribución por fabricante.
- Tarjeta "Resumen de salud": barras de progreso Rojo/Amarillo/OK (estilo "Estado de flota" de
  Impresoras) + conteos de sin patrimonial/sin usuario/sin sede.
- Tarjeta "Top dependencias": lista de las 10 dependencias con más equipos registrados (sin
  chart — evita un segundo gráfico compitiendo con el de fabricante, mismo criterio que
  Impresoras con su distribución por sede).

## 8. Manejo de errores

- Dashboard completo: mismo patrón que AD/VPN/Correos/Impresoras — DTO vacío con HTTP 200 ante
  error, frontend muestra "No se pudo cargar" + botón reintentar.
- Inventario/Mantenimiento no cambian su manejo de errores actual.

## 9. Pruebas

- **Backend unit** (`EquipoServiceTest`): cálculo de agregados nuevos — distribución por
  fabricante, top-10 dependencias (orden descendente, corte en 10), resumen de salud
  reutilizando el mismo umbral que ya prueba `getSalud()`.
- **Backend integración** (`EquipoControllerIT`): nueva ruta `GET /api/equipos/dashboard/completo`
  con el service mockeado — verifica ruta, `@PreAuthorize` (403 sin `WRITE_equipos`), forma de
  la respuesta.
- **Frontend**: no existen specs de `equipos-list.component.ts` que migrar. Verificación manual:
  filtros/tabla en Inventario, tabla de salud en Mantenimiento, los 3 bloques del Dashboard con
  datos reales, y que un usuario con solo `READ_equipos` no vea las pestañas Mantenimiento/
  Dashboard ni pueda entrar por URL directa (bloqueado por el guard).

## 10. Fuera de alcance

- Cualquier escritura a GLPI (sigue siendo solo lectura) o cambios a `equipos_enrichment`.
- Cambios a `EquipoDetailComponent`, `/api/equipos/kpis` o `/api/equipos/salud` (se quedan tal
  cual, solo cambia qué componente de UI los consume).
- El tema de fotos de inventario adjuntas en GLPI (investigado en conversación previa) — fuera
  de alcance de este rediseño.
- Un buscador propio dentro de Mantenimiento — se apoya en Inventario para llegar a cualquier
  equipo.

## 11. Decisiones registradas

| Tema | Decisión |
|---|---|
| Modelo de audiencia | Igual que AD/Impresoras (permiso plano `equipos`): Inventario = READ, Mantenimiento y Dashboard = WRITE |
| Nombre de la primera cara | "Inventario" (no "Consultas"), para no ser redundante con el nombre del módulo ("Inventario de Equipos") |
| Ubicación de "Salud del Inventario" | Se muda de la pestaña Inventario a Mantenimiento — es una cola de trabajo administrativa, no información de solo lectura |
| Ficha de detalle (`/equipos/:id`) | Sin cambios — ruta única compartida, gating de la sección Mantenimiento por permiso real, no por input explícito como en Impresoras |
| Construcción del dashboard | Reutiliza `repository.findFiltered()`, agregados en memoria; resumen de salud reutiliza (no duplica) los umbrales de `getSalud()` vía método privado extraído |
| Gráfico de dependencias | Lista simple (top 10), no un segundo chart — mismo criterio que Impresoras con distribución por sede |
| Endpoints existentes (`/kpis`, `/salud`) | Sin cambios — el nuevo `/dashboard/completo` es aditivo, no los reemplaza |
