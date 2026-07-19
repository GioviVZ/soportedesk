import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DashboardBreakdownComponent, DashboardBreakdownItem } from '../../shared/dashboard-breakdown/dashboard-breakdown.component';
import { CorreoDashboardCompleto } from './correo.model';
import { CorreoService } from './correo.service';

@Component({
  selector: 'app-correos-dashboard',
  imports: [CommonModule, DashboardBreakdownComponent],
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title"><strong>Control operativo de correos</strong><span>Licencias, seguridad y distribución organizacional.</span></div>
        <div class="module-dash-actions">
          @if (updatedAt) { <span class="module-dash-updated">Actualizado {{ updatedAt | date:'HH:mm' }}</span> }
          <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading"><span class="module-dash-refresh-icon" aria-hidden="true"></span>{{ loading ? 'Actualizando' : 'Actualizar' }}</button>
        </div>
      </div>

      @if (error) { <div class="module-dash-notice">No se pudo cargar. Se mantiene la última vista disponible.</div> }
      @if (dashboard; as d) {
        <section class="module-dash-stats">
          <div class="module-dash-stat"><span>Licencias totales</span><strong>{{ d.kpis.licenciasTotales }}</strong><small>Capacidad disponible</small></div>
          <div class="module-dash-stat tone-success"><span>Activas</span><strong>{{ d.kpis.activasCount }}</strong><small>Cuentas operativas</small></div>
          <div class="module-dash-stat tone-warning"><span>Suspendidas</span><strong>{{ d.kpis.suspendidasCount }}</strong><small>Revisar estado</small></div>
          <div class="module-dash-stat tone-info"><span>Disponibles</span><strong>{{ d.kpis.licenciasDisponibles }}</strong><small>Sin asignar</small></div>
        </section>

        <section class="module-dash-breakdowns">
          <app-dashboard-breakdown title="Cuentas por dependencia" subtitle="Cantidad exacta por dependencia" unit="cuentas" [items]="dependencias(d)" [expanded]="true" [colors]="organizationColors" />
          <app-dashboard-breakdown title="Cuentas por subdependencia" subtitle="Detalle por oficina o unidad" unit="cuentas" [items]="subdependencias(d)" [colors]="suborganizationColors" />
          <app-dashboard-breakdown title="Uso de licencias" subtitle="Asignadas frente a disponibles" unit="licencias" [items]="licencias(d)" [colors]="licenseColors" />
          <app-dashboard-breakdown title="Estado de cuentas" subtitle="Operativas, suspendidas y sin uso" unit="cuentas" [items]="estados(d)" [colors]="statusColors" />
        </section>

        <section class="module-dash-operations">
          <article class="module-dash-highlight"><strong>{{ d.porcentaje2FA.toFixed(1) }}%</strong><span>{{ d.cuentasCon2FA }} de {{ d.totalCuentas }} cuentas con verificación en 2 pasos.</span></article>
          <article class="module-dash-card">
            <header class="module-dash-card__header"><div><strong>Uso de licencias</strong><span>Asignación de la capacidad total</span></div></header>
            <div class="module-dash-progress">
              <div class="module-dash-progress-row"><span>Asignadas</span><strong>{{ percent(d.kpis.licenciasAsignadas, d.kpis.licenciasTotales) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.kpis.licenciasAsignadas, d.kpis.licenciasTotales)"></i></div></div>
              <div class="module-dash-progress-row"><span>Disponibles</span><strong>{{ percent(d.kpis.licenciasDisponibles, d.kpis.licenciasTotales) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.kpis.licenciasDisponibles, d.kpis.licenciasTotales)"></i></div></div>
            </div>
          </article>
          <article class="module-dash-card">
            <header class="module-dash-card__header"><div><strong>Cuentas sin uso 30+ días</strong><span>Primeras cuentas para revisar</span></div><span class="badge badge-warning">{{ d.totalSinUso }}</span></header>
            <div class="module-dash-list">
              @for (row of d.sinUso; track row.email) { <div class="module-dash-row tone-warning"><strong>{{ row.nombreCompleto || row.email }}</strong><span>{{ row.email }}</span><small>{{ row.detalle }}</small></div> }
            </div>
            @if (!d.sinUso.length) { <p class="muted">Sin registros críticos.</p> }
            @if (d.totalSinUso > d.sinUso.length) { <p class="muted">+{{ d.totalSinUso - d.sinUso.length }} más</p> }
          </article>
        </section>
      }

      @if (!dashboard && !loading) { <section class="empty-state"><strong>Sin datos de dashboard</strong><span>El servicio devolvió un resumen vacío o no disponible.</span></section> }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './correos.shared.scss',
})
export class CorreosDashboardComponent implements OnInit {
  private service = inject(CorreoService);
  dashboard: CorreoDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;
  readonly organizationColors = ['#3f527d', '#6577a1', '#8998b7', '#527f9b', '#72a4b4', '#48756d', '#739676', '#a58c4a'];
  readonly suborganizationColors = ['#315d8a', '#507fa5', '#70a0bc', '#8bbdca', '#2f766d', '#65a097', '#7ba877', '#b9a458'];
  readonly licenseColors = ['#586b95', '#91c2ca'];
  readonly statusColors = ['#4e8b55', '#c1a04b', '#bb685d'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.getDashboardCompleto().subscribe({
      next: (dashboard) => { this.dashboard = dashboard; this.updatedAt = new Date(); this.loading = false; },
      error: () => { this.dashboard = null; this.error = true; this.loading = false; },
    });
  }

  dependencias(d: CorreoDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorDependencia.map((row) => ({ label: row.dependencia, total: row.total })); }
  subdependencias(d: CorreoDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorSubdependencia.map((row) => ({ label: row.subdependencia, total: row.total })); }
  licencias(d: CorreoDashboardCompleto): DashboardBreakdownItem[] { return [{ label: 'Asignadas', total: d.kpis.licenciasAsignadas }, { label: 'Disponibles', total: d.kpis.licenciasDisponibles }]; }
  estados(d: CorreoDashboardCompleto): DashboardBreakdownItem[] { return [{ label: 'Activas', total: d.kpis.activasCount }, { label: 'Suspendidas', total: d.kpis.suspendidasCount }, { label: 'Sin uso 30+ días', total: d.totalSinUso }]; }
  percent(value: number, total: number): number { return total > 0 ? Math.round((value / total) * 100) : 0; }
}
