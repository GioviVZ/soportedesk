# Módulo VPN — tab "Solicitudes" para encargados (responsables)

## Contexto

El rediseño de solicitud/aprobación de VPN (`docs/superpowers/specs/2026-07-07-vpn-solicitudes-design.md`)
implementó el flujo completo de creación, aprobación, rechazo y observación de solicitudes, más una
alerta pequeña en el Dashboard general ("Solicitudes VPN pendientes"). Falta un espacio dedicado
*dentro del propio módulo VPN* para que los responsables (permiso `aprobar-vpn`) vean de un vistazo
cuántas solicitudes hay en cada estado y revisen rápidamente las pendientes, sin mezclarse con el
listado completo de todos los accesos VPN.

El módulo `equipos` ya resuelve un problema análogo con un patrón de tabs: "Inventario" / "Salud del
inventario", con un badge de alerta rojo en la tab cuando hay elementos qué atender
(`equipos-list.component.html:10-17`, `.scss:50-88`). Este diseño reutiliza ese mismo patrón visual
para VPN.

## Decisiones confirmadas

- **Estructura**: dos tabs en el header del módulo VPN — "Todas" (comportamiento actual, tabla sin
  cambios, primera/por defecto para todos) y "Solicitudes" (solo visible si `canWriteAprobar`, con
  badge de alerta mostrando el conteo de pendientes).
- **KPI cards**: dentro de la tab "Solicitudes", una fila de 4 cards — Pendientes, Aprobadas,
  Rechazadas, Observadas — mismo componente visual (`kpi-grid`/`kpi-card`/`tone-*`) que ya usa
  Equipos.
- **Filtro**: cada KPI card es clickeable y filtra la tabla de abajo a ese estado (clic de nuevo
  sobre la misma card quita el filtro, mostrando todas). El filtrado es 100% client-side sobre los
  datos ya cargados por `GET /api/vpn` — no se hace una llamada nueva al backend por cada clic.
- **Tabla reutilizada**: la tab "Solicitudes" no duplica la tabla — se reutiliza el mismo
  `<app-generic-table>` que ya existe, cambiando solo qué subconjunto de `items` recibe como `data`
  según la tab activa y el filtro de estado seleccionado. El botón "Ver" sigue abriendo el mismo
  modal de detalle con Aprobar/Rechazar/Observar (sin cambios ahí).
- **Tab por defecto**: "Todas" siempre es la tab inicial, incluso para responsables — no hay
  auto-selección de "Solicitudes" al entrar.
- **Backend**: nuevo endpoint `GET /api/vpn/kpis` → `VpnKpisDto(pendientes, aprobadas, rechazadas,
  observadas)`, mismo patrón que `GET /api/equipos/kpis` → `EquipoKpisDto`. Misma autorización que el
  listado actual (`GET /api/vpn`), sin restricción adicional (son solo conteos, no datos sensibles).

## Backend

### `VpnKpisDto.java` (nuevo)

```java
package com.inia.soportedesk.vpn;

public record VpnKpisDto(
        long pendientes,
        long aprobadas,
        long rechazadas,
        long observadas
) {
}
```

### `VpnService.java`

Nuevo método `getKpis()`, usando `VpnRepository.countByEstadoSolicitud(String)` (ya existe desde el
rediseño anterior — no requiere cambios en el repositorio):

```java
public VpnKpisDto getKpis() {
    return new VpnKpisDto(
            repository.countByEstadoSolicitud("PENDIENTE"),
            repository.countByEstadoSolicitud("APROBADO"),
            repository.countByEstadoSolicitud("RECHAZADO"),
            repository.countByEstadoSolicitud("OBSERVADO")
    );
}
```

### `VpnController.java`

```java
@GetMapping("/kpis")
@PreAuthorize(CAN_VIEW)
public VpnKpisDto getKpis() {
    return service.getKpis();
}
```

(`CAN_VIEW` es la constante `@PreAuthorize` ya existente en el controller, la misma que protege
`GET /api/vpn`.)

## Frontend

### `vpn.model.ts`

```typescript
export interface VpnKpis {
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  observadas: number;
}
```

### `vpn.service.ts`

```typescript
getKpis(): Observable<VpnKpis> {
  return this.http.get<VpnKpis>(`${this.apiUrl}/kpis`);
}
```

### `vpn-list.component.ts`

Se agregan (siguiendo el estilo de propiedades planas que ya usa este componente, no signals —
consistente con el resto del archivo):

```typescript
type VpnTab = 'todas' | 'solicitudes';
type EstadoSolicitud = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';

activeTab: VpnTab = 'todas';
kpis: VpnKpis | null = null;
solicitudFiltro: EstadoSolicitud | null = null;

get displayedItems(): Vpn[] {
  if (this.activeTab !== 'solicitudes' || !this.solicitudFiltro) return this.items;
  return this.items.filter((v) => v.estadoSolicitud === this.solicitudFiltro);
}

get kpiCards(): { label: string; value: number; estado: EstadoSolicitud; tone: string }[] {
  const k = this.kpis;
  return [
    { label: 'Pendientes', value: k?.pendientes ?? 0, estado: 'PENDIENTE', tone: 'orange' },
    { label: 'Aprobadas', value: k?.aprobadas ?? 0, estado: 'APROBADO', tone: 'green' },
    { label: 'Rechazadas', value: k?.rechazadas ?? 0, estado: 'RECHAZADO', tone: 'red' },
    { label: 'Observadas', value: k?.observadas ?? 0, estado: 'OBSERVADO', tone: 'yellow' },
  ];
}

setTab(tab: VpnTab): void {
  this.activeTab = tab;
}

setFiltro(estado: EstadoSolicitud): void {
  this.solicitudFiltro = this.solicitudFiltro === estado ? null : estado;
}
```

`ngOnInit` agrega `this.loadKpis()` junto al `load()` existente. `onSaved()`/`onAprobarSaved()`/
`onResolucionSaved()` (que ya llaman `this.load()` tras guardar) agregan también `this.loadKpis()`,
para que las KPI cards y el badge de la tab se actualicen sin recargar la página.

```typescript
loadKpis(): void {
  this.service.getKpis().subscribe((data) => (this.kpis = data));
}
```

### `vpn-list.component.html`

En `.module-header`, se agrega el `tab-toggle` (mismo markup que Equipos):

```html
<div class="tab-toggle" *ngIf="canWriteAprobar">
  <button type="button" [class.active]="activeTab === 'todas'" (click)="setTab('todas')">
    Todas
  </button>
  <button type="button" [class.active]="activeTab === 'solicitudes'"
    (click)="setTab('solicitudes')"
    [class.has-alert]="(kpis?.pendientes ?? 0) > 0">
    Solicitudes
    <span class="alert-count" *ngIf="(kpis?.pendientes ?? 0) > 0">{{ kpis?.pendientes }}</span>
  </button>
</div>
```

Antes de `<app-generic-table>`, sección de KPI cards visible solo en la tab "Solicitudes":

```html
<section class="kpi-grid" *ngIf="activeTab === 'solicitudes'">
  <article *ngFor="let card of kpiCards" class="kpi-card" [class]="'tone-' + card.tone"
    [class.kpi-card--active]="solicitudFiltro === card.estado"
    (click)="setFiltro(card.estado)" style="cursor: pointer;">
    <span>{{ card.label }}</span>
    <strong>{{ card.value }}</strong>
  </article>
</section>
```

`<app-generic-table [data]="displayedItems" ...>` reemplaza el actual `[data]="items"` — es el
único cambio al binding existente de la tabla; el resto (columnas, `canEdit`, acciones, `ng-template
#extraCell`) queda igual.

### `vpn-list.component.scss`

Se copian los bloques `.kpi-grid`, `.kpi-card` (+ `span`/`strong`), `.tone-orange`, `.tone-green`,
`.tone-red`, `.tone-yellow`, `.tab-toggle` (+ `button`/`button.active`/`button.has-alert`),
`.alert-count` desde `equipos-list.component.scss:7-88`, más una regla nueva `.kpi-card--active`
(borde/fondo resaltado para la card cuyo filtro está activo).

## Testing

- **`VpnServiceTest`** (backend): `getKpis()` delega correctamente a `countByEstadoSolicitud` para
  cada uno de los 4 estados y arma el DTO en el orden correcto.
- **`VpnControllerIT`**: `GET /api/vpn/kpis` respeta la misma autorización que `GET /api/vpn`
  (`READ_vpn`/`READ_solicitar-vpn`/`READ_aprobar-vpn` o sus variantes `WRITE_*`, o `ROLE_ADMIN`) y
  devuelve 403 sin ninguna de esas autoridades.
- **Manual**: verificar visualmente que el badge de la tab se actualiza tras aprobar/rechazar/
  observar sin recargar, y que el clic en una KPI card filtra y el clic repetido la quita.

## Archivos

**Nuevos**: `VpnKpisDto.java`.

**Modificados**: `VpnService.java`, `VpnController.java`, `VpnServiceTest.java`,
`VpnControllerIT.java`, `vpn.model.ts`, `vpn.service.ts`, `vpn-list.component.ts`,
`vpn-list.component.html`, `vpn-list.component.scss`.

**Sin cambios**: todo lo demás del módulo VPN (formularios de solicitud/aprobar/rechazar-observar,
`GenericTableComponent`, modal de detalle).
