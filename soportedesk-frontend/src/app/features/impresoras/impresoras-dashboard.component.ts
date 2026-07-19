import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DashboardBreakdownComponent, DashboardBreakdownItem } from '../../shared/dashboard-breakdown/dashboard-breakdown.component';
import { ImpresoraDashboardCompleto } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
  selector: 'app-impresoras-dashboard',
  imports: [CommonModule, DashboardBreakdownComponent],
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title"><strong>Control operativo de impresoras</strong><span>Flota, ubicación organizacional y consumibles de mayor demanda.</span></div>
        <div class="module-dash-actions">
          @if (updatedAt) { <span class="module-dash-updated">Actualizado {{ updatedAt | date:'HH:mm' }}</span> }
          <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading"><span class="module-dash-refresh-icon" aria-hidden="true"></span>{{ loading ? 'Actualizando' : 'Actualizar' }}</button>
        </div>
      </div>

      @if (error) { <div class="module-dash-notice">No se pudo cargar. Se mantiene la última vista disponible.</div> }
      @if (dashboard; as d) {
        <section class="module-dash-stats">
          <div class="module-dash-stat"><span>Total</span><strong>{{ d.total }}</strong><small>Flota registrada</small></div>
          <div class="module-dash-stat tone-success"><span>Activas</span><strong>{{ d.activas }}</strong><small>En operación</small></div>
          <div class="module-dash-stat tone-warning"><span>Mantenimiento</span><strong>{{ d.enMantenimiento }}</strong><small>Requieren atención</small></div>
          <div class="module-dash-stat tone-danger"><span>De baja</span><strong>{{ d.deBaja }}</strong><small>Fuera de servicio</small></div>
        </section>

        <section class="module-dash-breakdowns">
          <app-dashboard-breakdown title="Impresoras por dependencia" subtitle="Cantidad exacta por dependencia" unit="impresoras" [items]="dependencias(d)" [expanded]="true" [colors]="organizationColors" />
          <app-dashboard-breakdown title="Impresoras por subdependencia" subtitle="Detalle por oficina o unidad" unit="impresoras" [items]="subdependencias(d)" [colors]="suborganizationColors" />
          <app-dashboard-breakdown title="Distribución por sede" subtitle="Presencia territorial de la flota" unit="impresoras" [items]="sedes(d)" [colors]="siteColors" />
          <app-dashboard-breakdown title="Distribución por marca" subtitle="Fabricantes presentes en la flota" unit="impresoras" [items]="marcas(d)" [colors]="brandColors" />
          <app-dashboard-breakdown title="Estado de la flota" subtitle="Operativas, mantenimiento y baja" unit="impresoras" [items]="estados(d)" [colors]="statusColors" />
        </section>

        <section class="module-dash-operations">
          <article class="module-dash-highlight"><strong>{{ percent(d.activas, d.total) }}%</strong><span>De la flota se encuentra activa.</span></article>
          <article class="module-dash-card">
            <header class="module-dash-card__header"><div><strong>Salud de la flota</strong><span>Participación por estado operativo</span></div></header>
            <div class="module-dash-progress">
              <div class="module-dash-progress-row"><span>Activas</span><strong>{{ percent(d.activas, d.total) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.activas, d.total)"></i></div></div>
              <div class="module-dash-progress-row"><span>Mantenimiento</span><strong>{{ percent(d.enMantenimiento, d.total) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.enMantenimiento, d.total)"></i></div></div>
              <div class="module-dash-progress-row"><span>De baja</span><strong>{{ percent(d.deBaja, d.total) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.deBaja, d.total)"></i></div></div>
            </div>
          </article>
          <article class="module-dash-card">
            <header class="module-dash-card__header"><div><strong>Top 10 consumibles demandados</strong><span>Códigos con mayor alcance en flota</span></div><span class="badge badge-warning">{{ d.totalConsumiblesDistintos }}</span></header>
            <div class="module-dash-list">
              @for (row of d.topConsumibles; track row.codigo) { <div class="module-dash-row tone-warning"><strong>Tóner {{ row.color }} · {{ row.variante }}</strong><small>{{ row.codigo }} · {{ row.cantidad }} impresoras</small></div> }
            </div>
            @if (!d.topConsumibles.length) { <p class="muted">Sin consumibles registrados.</p> }
          </article>
        </section>
      }

      @if (!dashboard && !loading) { <section class="empty-state"><strong>Sin datos de dashboard</strong><span>El servicio devolvió un resumen vacío o no disponible.</span></section> }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasDashboardComponent implements OnInit {
  private service = inject(ImpresoraService);
  dashboard: ImpresoraDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;
  readonly organizationColors = ['#46554b', '#65746a', '#87938a', '#506e82', '#7496a7', '#8a744f', '#aa9167'];
  readonly suborganizationColors = ['#315d8a', '#5a8fb8', '#77afc7', '#2f766d', '#6b9b71', '#90b681', '#c3a44f'];
  readonly siteColors = ['#3f6a87', '#6791a9', '#8db3c2', '#3d786f', '#72a196'];
  readonly brandColors = ['#495b51', '#6e7f74', '#95a298', '#435f78', '#6d8da6', '#a18a56'];
  readonly statusColors = ['#4e8b55', '#c2a049', '#bd665b'];

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.error = false;
    this.service.getDashboardCompleto().subscribe({
      next: (dashboard) => { this.dashboard = dashboard; this.updatedAt = new Date(); this.loading = false; },
      error: () => { this.dashboard = null; this.error = true; this.loading = false; },
    });
  }

  dependencias(d: ImpresoraDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorDependencia.map((row) => ({ label: row.dependencia, total: row.total })); }
  subdependencias(d: ImpresoraDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorSubdependencia.map((row) => ({ label: row.subdependencia, total: row.total })); }
  sedes(d: ImpresoraDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorSede.map((row) => ({ label: row.sede, total: row.total })); }
  marcas(d: ImpresoraDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorMarca.map((row) => ({ label: row.marca, total: row.total })); }
  estados(d: ImpresoraDashboardCompleto): DashboardBreakdownItem[] { return [{ label: 'Activas', total: d.activas }, { label: 'Mantenimiento', total: d.enMantenimiento }, { label: 'De baja', total: d.deBaja }]; }
  percent(value: number, total: number): number { return total > 0 ? Math.round((value / total) * 100) : 0; }
}
