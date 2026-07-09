# Módulo Impresoras — Rediseño en 3 caras (Consultas / Administración / Dashboard)

**Fecha:** 2026-07-09
**Estado:** Diseño aprobado — pendiente de plan de implementación
**Precedente:** [2026-07-08-modulo-active-directory-tres-caras-design.md](2026-07-08-modulo-active-directory-tres-caras-design.md) (mismo modelo de permiso plano y del mismo split Consultas/Administración/Dashboard)

---

## 1. Objetivo

Reorganizar la página única actual de Impresoras (`impresoras-list.component.ts`) en **tres
caras**, replicando el patrón de AD: Impresoras usa un único permiso plano `impresoras`
(`READ_impresoras`/`WRITE_impresoras`, sin split de autoridades como VPN), así que el modelo de
audiencia es idéntico al de AD, no al de VPN.

1. **Consultas** — filtros + tabla/lista + ficha de detalle, **solo lectura** (sin
   crear/editar/eliminar, sin importar el permiso real del usuario — el input explícito de la
   ficha controla esto, no se infiere del permiso). Visible para `READ_impresoras`.
2. **Administración** — los mismos filtros + tabla + ficha, más las acciones existentes
   (Agregar, Editar, Eliminar) con sus modales. Visible **solo** para `WRITE_impresoras`
   (pestaña oculta si no se tiene, igual que AD).
3. **Dashboard** — vista analítica nueva: los 3 stat-pills actuales (Total/Activas/
   Mantenimiento) + distribución por marca + desglose por estado + distribución por sede +
   top-10 consumibles (toners) más demandados en la flota. Visible solo para `WRITE_impresoras`
   (igual que AD, donde Administración y Dashboard comparten el mismo nivel de audiencia).

El panel "Ver consumibles" (resumen de toners agrupados, ya implementado en
`impresora-resumen.component.ts`) **se queda en Consultas sin cambios**, disponible para
cualquiera con lectura — no es analítica agregada de la flota, es una consulta operativa
puntual (qué toner corresponde a estas impresoras filtradas). El Dashboard además incluye su
propia métrica de consumibles (top-10 a nivel de toda la flota, no filtrable), calculada en el
backend.

## 2. Arquitectura y rutas

```
/impresoras                                    (layout: ImpresorasShellComponent)
  ├── /consultas       canActivate: moduloGuard('impresoras')                  [default redirect]
  ├── /administracion  canActivate: moduloGuard('impresoras', { write: true })
  └── /dashboard       canActivate: moduloGuard('impresoras', { write: true })
```

- `ImpresorasShellComponent`: mismo patrón que `UsuariosRedShellComponent` — `module-header` +
  `nav.ad-tabs` + `<router-outlet>`. Las pestañas de Administración/Dashboard no se renderizan
  si `!authService.canWrite('impresoras')`.
- No se necesita un guard nuevo — `moduloGuard('impresoras', { write: true })` ya existe (mismo
  mecanismo usado por AD).
- El ítem del sidebar sigue siendo uno solo ("Impresoras"), apunta a `/impresoras` y redirige a
  `consultas`.
- `impresora.service.ts` y `impresora.model.ts` se extienden con el nuevo método/tipos del
  punto 3; no se toca ninguna operación de escritura existente.

## 3. Componentes compartidos (evitar duplicación)

Siguiendo el mismo patrón que `ad-user-detail.component.ts` (compartido entre Consultas y
Administración de AD):

- **`ImpresoraFichaComponent`** (ya existe) se extiende con `@Input allowActions = true`. El
  botón "Editar" del template cambia de `*ngIf="isAdmin"` a `*ngIf="isAdmin && allowActions"`.
  Consultas pasa `[allowActions]="false"` explícitamente (para que la ficha sea de solo lectura
  incluso si quien la abre además tiene `WRITE_impresoras` y decidió mirar Consultas);
  Administración no pasa nada (default `true`).
- **Filtros + tabla + mobile-list**: hoy viven inline en `impresoras-list.component.html`. Se
  extraen a un componente compartido `ImpresorasListViewComponent` (filtros, `app-generic-table`,
  card-list móvil, export Excel, panel de consumibles) con `@Input canManage = false` que
  controla si se muestra el botón "Agregar" del `app-generic-table` (`[canAdd]="canManage"`) y
  si las filas emiten `edit`/`delete` (`[canEdit]="canManage"`). Reutilizado por ambas caras.
- `ImpresoraFormComponent` (crear/editar) y el modal de confirmación de borrado permanecen
  exclusivos de Administración — no se tocan.

## 4. Backend — nuevo endpoint

Dentro de `com.inia.soportedesk.impresoras` (paquete ya existente, sin subpaquete `dto`, igual
que `ImpresoraRequest` ya está plano ahí).

```
GET /api/impresoras/dashboard/completo
```
- `@PreAuthorize("hasRole('ADMIN') || hasAuthority('WRITE_impresoras')")`.
- Reutiliza `ImpresoraRepository.findAll()` (ya usado por `findAll(null)` en el service), agrega
  en memoria (lógica pura, testeable):
  - Los 3 conteos actuales (total/activas/mantenimiento) + conteo de "De baja" (hoy no se
    muestra en ningún stat-pill, se agrega como cuarto dato ya que `IMPRESORA_ESTADOS` ya
    reconoce ese estado).
  - **Distribución por marca**: agrupa por `modeloImpresora.marca.nombre`, cuenta todas las
    impresoras (no solo activas).
  - **Distribución por sede**: agrupa por `sede.nombre` (fallback `"Sin sede"`).
  - **Top 10 consumibles**: para cada impresora, para cada tóner de `modeloImpresora.toners`,
    incrementa un contador por `color|variante|codigo` — misma clave y misma lógica que ya usa
    `impresora-resumen.component.ts::calcularResumen()` en el cliente hoy, solo que aquí es
    sobre **toda** la flota, no filtrada. Top 10 por cantidad descendente + total de consumibles
    distintos.
- DTOs (en el paquete `impresoras`, sin subpaquete `dto`):
  ```java
  public record ImpresoraMarcaCount(String marca, long total) {}
  public record ImpresoraSedeCount(String sede, long total) {}
  public record ImpresoraConsumibleCount(String color, String variante, String codigo, long cantidad) {}
  public record ImpresoraDashboardCompleto(
      long total, long activas, long enMantenimiento, long deBaja,
      List<ImpresoraMarcaCount> distribucionPorMarca,
      List<ImpresoraSedeCount> distribucionPorSede,
      List<ImpresoraConsumibleCount> topConsumibles, long totalConsumiblesDistintos
  ) {}
  ```
- Ante error, mismo patrón lenient ya establecido (AD/VPN/Correos): capturar excepción, loguear
  `WARN`, devolver DTO vacío con HTTP 200.

## 5. Cara 1 — Consultas

Ruta `/impresoras/consultas`, visible para `READ_impresoras`.

- `ImpresorasListViewComponent` con `[canManage]="false"` — filtros (sede, dependencia,
  subdependencia, IP, marca, modelo), tabla/mobile-list, exportar Excel, toggle "Ver
  consumibles" con `app-impresora-resumen` (sin cambios).
- Click en una fila abre `ImpresoraFichaComponent` con `[allowActions]="false"` — solo lectura,
  sin botón Editar.

## 6. Cara 2 — Administración

Ruta `/impresoras/administracion`, visible solo con `WRITE_impresoras`.

- Fila de stat-pills (Total/Activas/Mant.), igual que hoy — se queda como referencia operativa
  rápida en esta cara, calculada en el cliente sobre `filteredItems` (mismo comportamiento
  actual, sin cambios), siguiendo el mismo precedente que AD y VPN (ambos muestran un resumen
  compacto en su cara de Administración, no solo en Dashboard). Vive en
  `ImpresorasAdministracionComponent`, no en el componente de lista compartido.
- `ImpresorasListViewComponent` con `[canManage]="true"` — mismos filtros/tabla/consumibles +
  botón "Agregar impresora" + acciones Editar/Eliminar por fila.
- `ImpresoraFichaComponent` con `allowActions` en su valor por defecto (`true`) — muestra
  "Editar" (ya gateado internamente por `isAdmin`, redundante pero seguro con el guard de ruta).
- Modales de formulario (crear/editar) y confirmación de borrado — sin cambios de lógica.

## 7. Cara 3 — Dashboard

Ruta `/impresoras/dashboard`, visible solo con `WRITE_impresoras`. Usa
`GET /impresoras/dashboard/completo`.

- Fila de KPIs: Total, Activas, En mantenimiento, De baja.
- Gráfico de barras horizontal de distribución por marca (`ng2-charts`, mismo patrón visual que
  los demás dashboards).
- Tarjeta de distribución por sede (lista simple, no gráfico — evita un segundo chart compitiendo
  visualmente con el de marca en la misma pantalla).
- Tarjeta "Top 10 consumibles más demandados": conteo total de consumibles distintos destacado
  arriba + las 10 filas más demandadas (tóner color/variante, código, cantidad de impresoras que
  lo usan). Sin acción de click (no hay a dónde navegar — no es un registro individual).

## 8. Manejo de errores

- Dashboard completo: mismo patrón que AD/VPN/Correos — DTO vacío con HTTP 200 ante error,
  frontend muestra "No se pudo cargar" + botón reintentar.
- Consultas/Administración no cambian su manejo de errores actual.

## 9. Pruebas

- **Backend unit**: cálculo de agregados (distribución por marca/sede, top-10 consumibles con
  el mismo criterio de agrupación que el cliente, conteos por estado incluyendo "De baja").
- **Backend integración**: `@SpringBootTest`/`@AutoConfigureMockMvc` del endpoint nuevo con el
  service mockeado — verifica ruta, `@PreAuthorize` (403 sin `WRITE_impresoras`), forma de la
  respuesta.
- **Frontend**: se retira `impresoras-list.component.spec.ts` (2 tests) y se reparten sus casos:
  "carga la lista en modo lectura" → spec de Consultas; "no abre el formulario sin permiso de
  escritura" → spec de Administración (el guard de ruta ya lo impide, pero se mantiene el check
  defensivo interno igual que hoy). `impresora-ficha.component.spec.ts` se actualiza para cubrir
  el nuevo input `allowActions`.
- **Verificación manual**: filtros/consumibles en Consultas, CRUD completo en Administración,
  los 3 bloques del Dashboard con datos reales.

## 10. Fuera de alcance

- Cambios a `ImpresoraFormComponent`, al modal de borrado, o a cualquier operación de escritura
  existente.
- Un campo real de "próximo mantenimiento"/edad del equipo (no existe en el modelo hoy); el
  conteo "En mantenimiento" sigue siendo solo el valor actual de `estado`.
- Vincular impresoras con GLPI (no existe ese campo en `Impresora` hoy).

## 11. Decisiones registradas

| Tema | Decisión |
|---|---|
| Modelo de audiencia | Igual que AD (permiso plano `impresoras`): Consultas = READ, Administración y Dashboard = WRITE |
| Panel de consumibles existente | Se queda en Consultas sin cambios, disponible para lectura |
| Métrica de consumibles del Dashboard | Top-10 a nivel de toda la flota, calculada en el backend, misma clave de agrupación que ya usa el cliente |
| Componente de ficha compartido | `ImpresoraFichaComponent` + nuevo `@Input allowActions`, explícito por el padre, no inferido del permiso del usuario |
| Componente de lista compartido | Nuevo `ImpresorasListViewComponent` con `@Input canManage`, reutilizado por ambas caras |
| Gráfico de distribución por sede | Lista simple, no un segundo chart (evita saturar el Dashboard) |
| Construcción del dashboard | Reutiliza `ImpresoraRepository.findAll()`, agregados en memoria |
