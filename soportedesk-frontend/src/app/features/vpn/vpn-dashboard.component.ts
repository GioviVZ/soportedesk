import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardBreakdownComponent, DashboardBreakdownItem } from '../../shared/dashboard-breakdown/dashboard-breakdown.component';
import { VpnDashboardCompleto } from './vpn.model';
import { VpnService } from './vpn.service';

@Component({
  selector: 'app-vpn-dashboard',
  imports: [CommonModule, DashboardBreakdownComponent],
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title"><strong>Control operativo VPN</strong><span>Solicitudes, ubicación organizacional y vencimientos por atender.</span></div>
        <div class="module-dash-actions">
          @if (updatedAt) { <span class="module-dash-updated">Actualizado {{ updatedAt | date:'HH:mm' }}</span> }
          <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading"><span class="module-dash-refresh-icon" aria-hidden="true"></span>{{ loading ? 'Actualizando' : 'Actualizar' }}</button>
        </div>
      </div>

      @if (error) { <div class="module-dash-notice">No se pudo cargar. Se mantiene la última vista disponible.</div> }
      @if (dashboard; as d) {
        <section class="module-dash-stats">
          <div class="module-dash-stat tone-warning"><span>Pendientes</span><strong>{{ d.pendientes }}</strong><small>Por revisar</small></div>
          <div class="module-dash-stat tone-success"><span>Aprobadas</span><strong>{{ d.aprobadas }}</strong><small>Accesos habilitados</small></div>
          <div class="module-dash-stat tone-danger"><span>Rechazadas</span><strong>{{ d.rechazadas }}</strong><small>No proceden</small></div>
          <div class="module-dash-stat tone-info"><span>Observadas</span><strong>{{ d.observadas }}</strong><small>Con corrección</small></div>
        </section>

        <section class="module-dash-breakdowns">
          <app-dashboard-breakdown title="Solicitudes por dependencia" subtitle="Cantidad según oficina del titular AD" unit="solicitudes" [items]="dependencias(d)" [expanded]="true" [colors]="organizationColors" />
          <app-dashboard-breakdown title="Solicitudes por subdependencia" subtitle="Detalle según unidad organizativa AD" unit="solicitudes" [items]="subdependencias(d)" [colors]="suborganizationColors" />
          <app-dashboard-breakdown title="Estado de solicitudes" subtitle="Avance del flujo de atención" unit="solicitudes" [items]="estados(d)" [colors]="statusColors" />
          <app-dashboard-breakdown title="Tipo de equipo" subtitle="Equipos INIA y personales" unit="solicitudes" [items]="tiposEquipo(d)" [colors]="equipmentColors" />
        </section>

        <section class="module-dash-operations">
          <article class="module-dash-highlight"><strong>{{ d.totalAntivirusVencidos + d.totalAntivirusPorVencer }}</strong><span>Equipos con antivirus vencido o por vencer.</span></article>
          <article class="module-dash-card">
            <header class="module-dash-card__header"><div><strong>Flujo de atención</strong><span>Situación general de las solicitudes</span></div></header>
            <div class="module-dash-progress">
              <div class="module-dash-progress-row"><span>Resueltas</span><strong>{{ percent(d.aprobadas + d.rechazadas + d.observadas, d.total) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.aprobadas + d.rechazadas + d.observadas, d.total)"></i></div></div>
              <div class="module-dash-progress-row"><span>Pendientes</span><strong>{{ percent(d.pendientes, d.total) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.pendientes, d.total)"></i></div></div>
            </div>
          </article>
          <ng-container *ngTemplateOutlet="alertCard; context: { title: 'Antivirus vencidos', total: d.totalAntivirusVencidos, rows: d.antivirusVencidos, tone: 'tone-danger' }" />
          <ng-container *ngTemplateOutlet="alertCard; context: { title: 'Antivirus por vencer', total: d.totalAntivirusPorVencer, rows: d.antivirusPorVencer, tone: 'tone-warning' }" />
        </section>
      }

      @if (!dashboard && !loading) { <section class="empty-state"><strong>Sin datos de dashboard</strong><span>El servicio devolvió un resumen vacío o no disponible.</span></section> }
    </div>

    <ng-template #alertCard let-title="title" let-total="total" let-rows="rows" let-tone="tone">
      <article class="module-dash-card">
        <header class="module-dash-card__header"><div><strong>{{ title }}</strong><span>Primeros registros por atender</span></div><span class="badge badge-warning">{{ total }}</span></header>
        <div class="module-dash-list">
          @for (row of rows; track row.vpnId) { <button class="module-dash-row clickable" [ngClass]="tone" type="button" (click)="goToRegistros(row.vpnId)"><strong>{{ row.titular }}</strong><small class="muted">{{ row.detalle }}</small></button> }
        </div>
        @if (!rows.length) { <p class="muted">Sin registros críticos.</p> }
        @if (total > rows.length) { <p class="muted">+{{ total - rows.length }} más</p> }
      </article>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './vpn.shared.scss',
})
export class VpnDashboardComponent implements OnInit {
  private service = inject(VpnService);
  private router = inject(Router);
  dashboard: VpnDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;
  readonly organizationColors = ['#825044', '#a86656', '#c98670', '#dca893', '#536f8e', '#7695ad', '#52786d'];
  readonly suborganizationColors = ['#315d8a', '#5a8fb8', '#77afc7', '#2f766d', '#6b9b71', '#b19851', '#bd705e'];
  readonly statusColors = ['#c19b42', '#4e8b55', '#5b8e9b', '#bd665b'];
  readonly equipmentColors = ['#426d91', '#81afc3', '#65796e'];

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.error = false;
    this.service.getDashboardCompleto().subscribe({
      next: (dashboard) => { this.dashboard = dashboard; this.updatedAt = new Date(); this.loading = false; },
      error: () => { this.dashboard = null; this.error = true; this.loading = false; },
    });
  }

  goToRegistros(vpnId: number): void { this.router.navigate(['/vpn/registros'], { queryParams: { id: vpnId } }); }
  dependencias(d: VpnDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorDependencia.map((row) => ({ label: row.dependencia, total: row.total })); }
  subdependencias(d: VpnDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorSubdependencia.map((row) => ({ label: row.subdependencia, total: row.total })); }
  estados(d: VpnDashboardCompleto): DashboardBreakdownItem[] { return [{ label: 'Pendientes', total: d.pendientes }, { label: 'Aprobadas', total: d.aprobadas }, { label: 'Observadas', total: d.observadas }, { label: 'Rechazadas', total: d.rechazadas }]; }
  tiposEquipo(d: VpnDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorTipoEquipo.map((row) => ({ label: this.tipoEquipoLabel(row.tipoEquipo), total: row.total })); }
  percent(value: number, total: number): number { return total > 0 ? Math.round((value / total) * 100) : 0; }
  private tipoEquipoLabel(value: string): string { return value === 'INIA' ? 'Equipo INIA' : value === 'PERSONAL' ? 'Equipo personal' : 'Sin tipo'; }
}
