import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DashboardBreakdownComponent, DashboardBreakdownItem } from '../../shared/dashboard-breakdown/dashboard-breakdown.component';
import { EquipoDashboardCompleto } from './equipo.model';
import { EquipoService } from './equipo.service';

@Component({
  selector: 'app-equipos-dashboard',
  imports: [CommonModule, DashboardBreakdownComponent],
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title"><strong>Panorama del inventario de equipos</strong><span>Distribución organizacional, composición y salud del parque informático.</span></div>
        <div class="module-dash-actions">
          @if (updatedAt) { <span class="module-dash-updated">Actualizado {{ updatedAt | date:'HH:mm' }}</span> }
          <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading"><span class="module-dash-refresh-icon" aria-hidden="true"></span>{{ loading ? 'Actualizando' : 'Actualizar' }}</button>
        </div>
      </div>

      @if (error) { <div class="module-dash-notice">No se pudo cargar. Se mantiene la última vista disponible.</div> }
      @if (dashboard; as d) {
        <section class="module-dash-stats">
          <div class="module-dash-stat"><span>Total</span><strong>{{ d.total }}</strong><small>Equipos acordados</small></div>
          <div class="module-dash-stat tone-deep"><span>Desktop</span><strong>{{ d.desktopCount }}</strong><small>Computadoras de escritorio</small></div>
          <div class="module-dash-stat tone-info"><span>Laptop</span><strong>{{ d.laptopCount }}</strong><small>Equipos portátiles</small></div>
          <div class="module-dash-stat tone-success"><span>All in One</span><strong>{{ d.allInOneCount }}</strong><small>Equipos integrados</small></div>
          <div class="module-dash-stat tone-warning"><span>Recientes</span><strong>{{ d.recientes30Dias }}</strong><small>Agregados en 30 días</small></div>
          <div class="module-dash-stat tone-warning"><span>Desactualizados</span><strong>{{ d.sinActualizarMasTresMeses }}</strong><small>Más de 3 meses</small></div>
        </section>

        <section class="module-dash-breakdowns">
          <app-dashboard-breakdown title="Equipos por dependencia" subtitle="Cantidad exacta por dependencia" unit="equipos" [items]="dependencias(d)" [expanded]="true" [colors]="organizationColors" />
          <app-dashboard-breakdown title="Equipos por subdependencia" subtitle="Detalle por oficina o unidad" unit="equipos" [items]="subdependencias(d)" [colors]="suborganizationColors" />
          <app-dashboard-breakdown title="Tipo de equipo" subtitle="Solo laptop, escritorio y All in One" unit="equipos" [items]="tipos(d)" [colors]="typeColors" />
          <app-dashboard-breakdown title="Distribución por fabricante" subtitle="Marcas presentes en el inventario" unit="equipos" [items]="fabricantes(d)" [colors]="brandColors" />
          <app-dashboard-breakdown title="Salud del inventario" subtitle="Al día, advertencia y críticos" unit="equipos" [items]="salud(d)" [colors]="healthColors" />
        </section>

        <section class="module-dash-operations">
          <article class="module-dash-highlight"><strong>{{ percent(d.salud.ok, d.total) }}%</strong><span>Del inventario se encuentra al día.</span></article>
          <article class="module-dash-card">
            <header class="module-dash-card__header"><div><strong>Resumen de salud</strong><span>Participación por nivel de alerta</span></div></header>
            <div class="module-dash-progress">
              <div class="module-dash-progress-row"><span>Críticos</span><strong>{{ percent(d.salud.rojos, d.total) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.salud.rojos, d.total)"></i></div></div>
              <div class="module-dash-progress-row"><span>Advertencia</span><strong>{{ percent(d.salud.amarillos, d.total) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.salud.amarillos, d.total)"></i></div></div>
              <div class="module-dash-progress-row"><span>Al día</span><strong>{{ percent(d.salud.ok, d.total) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.salud.ok, d.total)"></i></div></div>
            </div>
          </article>
          <article class="module-dash-card">
            <header class="module-dash-card__header"><div><strong>Calidad de inventario</strong><span>Datos pendientes de completar</span></div></header>
            <div class="module-dash-list">
              <div class="module-dash-row tone-warning"><strong>Sin código patrimonial</strong><small>{{ d.salud.sinPatrimonial }} equipos</small></div>
              <div class="module-dash-row tone-warning"><strong>Sin usuario</strong><small>{{ d.salud.sinUsuario }} equipos</small></div>
              <div class="module-dash-row tone-warning"><strong>Sin sede</strong><small>{{ d.salud.sinSede }} equipos</small></div>
            </div>
          </article>
        </section>
      }

      @if (!dashboard && !loading) { <section class="empty-state"><strong>Sin datos de dashboard</strong><span>El servicio devolvió un resumen vacío o no disponible.</span></section> }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './equipos.shared.scss',
})
export class EquiposDashboardComponent implements OnInit {
  private service = inject(EquipoService);
  dashboard: EquipoDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;
  readonly organizationColors = ['#2f682e', '#4f8747', '#73a766', '#9bc486', '#3d6c8c', '#648fa7', '#9a824a'];
  readonly suborganizationColors = ['#315d8a', '#5a8fb8', '#77afc7', '#2f766d', '#6b9b71', '#90b681', '#c3a44f'];
  readonly typeColors = ['#315d8a', '#2f682e', '#90b681'];
  readonly brandColors = ['#2f682e', '#568b4d', '#7cad6d', '#a5c891', '#416f8e', '#7299ae', '#a58e55'];
  readonly healthColors = ['#4e8b55', '#c1a04b', '#bd665b'];

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.error = false;
    this.service.getDashboardCompleto().subscribe({
      next: (dashboard) => { this.dashboard = dashboard; this.updatedAt = new Date(); this.loading = false; },
      error: () => { this.dashboard = null; this.error = true; this.loading = false; },
    });
  }

  dependencias(d: EquipoDashboardCompleto): DashboardBreakdownItem[] { return d.topDependencias.map((row) => ({ label: row.dependencia, total: row.total })); }
  subdependencias(d: EquipoDashboardCompleto): DashboardBreakdownItem[] { return d.topSubdependencias.map((row) => ({ label: row.subdependencia, total: row.total })); }
  tipos(d: EquipoDashboardCompleto): DashboardBreakdownItem[] { return [{ label: 'Laptop', total: d.laptopCount }, { label: 'Computadora de escritorio', total: d.desktopCount }, { label: 'All in One', total: d.allInOneCount }]; }
  fabricantes(d: EquipoDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorFabricante.map((row) => ({ label: row.fabricante, total: row.total })); }
  salud(d: EquipoDashboardCompleto): DashboardBreakdownItem[] { return [{ label: 'Al día', total: d.salud.ok }, { label: 'Advertencia', total: d.salud.amarillos }, { label: 'Críticos', total: d.salud.rojos }]; }
  percent(value: number, total: number): number { return total > 0 ? Math.round((value / total) * 100) : 0; }
}
