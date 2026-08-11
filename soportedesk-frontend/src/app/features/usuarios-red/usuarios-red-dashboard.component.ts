import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardBreakdownComponent, DashboardBreakdownItem } from '../../shared/dashboard-breakdown/dashboard-breakdown.component';
import { ActiveDirectoryDashboardCompleto } from './active-directory.model';
import { ActiveDirectoryService } from './active-directory.service';

@Component({
  selector: 'app-usuarios-red-dashboard',
  imports: [CommonModule, DashboardBreakdownComponent],
  template: `
    <div class="usuarios-red-page">
      <div class="module-dash">
        <div class="module-dash-toolbar">
          <div class="module-dash-title"><strong>Control operativo Active Directory</strong><span>Estado del directorio, dependencias, unidades organizativas y alertas.</span></div>
          <div class="module-dash-actions">@if (updatedAt) { <span class="module-dash-updated">Actualizado {{ updatedAt | date:'HH:mm' }}</span> }</div>
        </div>

        @if (error) { <div class="module-dash-notice">No se pudo cargar. Se mantiene la última vista disponible.</div> }
        @if (dashboard; as d) {
          <section class="module-dash-stats">
            <div class="module-dash-stat tone-success"><span>Habilitados</span><strong>{{ d.usuariosHabilitados }}</strong><small>Cuentas activas</small></div>
            <div class="module-dash-stat tone-danger"><span>Bloqueados</span><strong>{{ d.usuariosBloqueados }}</strong><small>Requieren revisión</small></div>
            <div class="module-dash-stat tone-warning"><span>Deshabilitados</span><strong>{{ d.usuariosDeshabilitados }}</strong><small>Fuera de operación</small></div>
            <div class="module-dash-stat tone-warning"><span>Contratos por vencer</span><strong>{{ d.totalContratosPorVencer }}</strong><small>Próximos 30 días</small></div>
            <div class="module-dash-stat tone-info"><span>Controladores</span><strong>{{ d.controladoresDominio }}</strong><small>Dominio AD</small></div>
          </section>

          <section class="module-dash-breakdowns">
            <app-dashboard-breakdown title="Usuarios por dependencia" subtitle="Cuentas activas según oficina AD" unit="usuarios" [items]="oficinas(d)" [expanded]="true" [colors]="organizationColors" />
            <app-dashboard-breakdown title="Usuarios por subdependencia / OU" subtitle="Detalle por unidad organizativa" unit="usuarios" [items]="ous(d)" [colors]="suborganizationColors" />
            <app-dashboard-breakdown title="Estado de cuentas" subtitle="Habilitadas, deshabilitadas y bloqueadas" unit="cuentas" [items]="estados(d)" [colors]="statusColors" />
            <app-dashboard-breakdown title="Alertas administrativas" subtitle="Contratos, contraseñas, inactividad y bloqueos" unit="alertas" [items]="alertas(d)" [colors]="alertColors" />
          </section>

          <section class="module-dash-operations">
            <article class="module-dash-highlight"><strong>{{ totalAlertas(d) }}</strong><span>Alertas de cuentas por resolver.</span></article>
            <article class="module-dash-card">
              <header class="module-dash-card__header"><div><strong>Salud del directorio</strong><span>Estado del universo visible</span></div></header>
              <div class="module-dash-progress">
                <div class="module-dash-progress-row"><span>Habilitadas</span><strong>{{ percent(d.usuariosHabilitados, totalUsuarios(d)) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.usuariosHabilitados, totalUsuarios(d))"></i></div></div>
                <div class="module-dash-progress-row"><span>Con bloqueo</span><strong>{{ percent(d.usuariosBloqueados, totalUsuarios(d)) }}%</strong><div class="module-dash-track"><i [style.width.%]="percent(d.usuariosBloqueados, totalUsuarios(d))"></i></div></div>
              </div>
            </article>
            <ng-container *ngTemplateOutlet="alertCard; context: { title: 'Contratos por vencer', total: d.totalContratosPorVencer, rows: d.contratosPorVencer, tone: 'tone-warning' }" />
            <ng-container *ngTemplateOutlet="alertCard; context: { title: 'Contraseñas vencidas', total: d.totalPasswordsVencidas, rows: d.passwordsVencidas, tone: 'tone-warning' }" />
            <ng-container *ngTemplateOutlet="alertCard; context: { title: 'Cuentas inactivas', total: d.totalCuentasInactivas, rows: d.cuentasInactivas, tone: 'tone-info' }" />
            <ng-container *ngTemplateOutlet="alertCard; context: { title: 'Cuentas bloqueadas', total: d.totalCuentasBloqueadas, rows: d.cuentasBloqueadas, tone: 'tone-danger' }" />
          </section>
        }

        @if (!dashboard && !loading) { <section class="empty-state"><strong>Sin datos de dashboard</strong><span>El servicio devolvió un resumen vacío o no disponible.</span></section> }
      </div>
    </div>

    <ng-template #alertCard let-title="title" let-total="total" let-rows="rows" let-tone="tone">
      <article class="module-dash-card">
        <header class="module-dash-card__header"><div><strong>{{ title }}</strong><span>Primeras cuentas para revisar</span></div><span class="badge badge-warning">{{ total }}</span></header>
        <div class="module-dash-list">
          @for (row of rows; track row.samAccountName) { <button class="module-dash-row clickable" [ngClass]="tone" type="button" (click)="goToAdmin(row.samAccountName)"><strong>{{ row.samAccountName }}</strong><span>{{ row.displayName || 'Sin nombre' }}</span><small class="muted">{{ row.detalle }}</small></button> }
        </div>
        @if (!rows.length) { <p class="muted">Sin registros críticos.</p> }
        @if (total > rows.length) { <p class="muted">+{{ total - rows.length }} más</p> }
      </article>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './usuarios-red.shared.scss',
})
export class UsuariosRedDashboardComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private router = inject(Router);
  dashboard: ActiveDirectoryDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;
  readonly organizationColors = ['#9a6718', '#bd8424', '#d5a249', '#e4bd72', '#5d7090', '#7892ad', '#507a70'];
  readonly suborganizationColors = ['#315d8a', '#5a8fb8', '#77afc7', '#2f766d', '#6b9b71', '#c3a44f', '#ca765f'];
  readonly statusColors = ['#4e8b55', '#c1a04b', '#bd665b'];
  readonly alertColors = ['#a86200', '#c39b3f', '#5b8d9b', '#bd665b'];

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true;
    this.error = false;
    this.adService.getDashboardCompleto().subscribe({
      next: (dashboard) => { this.dashboard = dashboard; this.updatedAt = new Date(); this.loading = false; },
      error: () => { this.dashboard = null; this.error = true; this.loading = false; },
    });
  }

  goToAdmin(sam: string): void { this.router.navigate(['/usuarios-red/administracion'], { queryParams: { sam } }); }
  oficinas(d: ActiveDirectoryDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorOficina.map((row) => ({ label: row.oficina, total: row.activos })); }
  ous(d: ActiveDirectoryDashboardCompleto): DashboardBreakdownItem[] { return d.distribucionPorOu.map((row) => ({ label: row.ou, total: row.activos })); }
  estados(d: ActiveDirectoryDashboardCompleto): DashboardBreakdownItem[] { return [{ label: 'Habilitadas', total: d.usuariosHabilitados }, { label: 'Deshabilitadas', total: d.usuariosDeshabilitados }, { label: 'Bloqueadas', total: d.usuariosBloqueados }]; }
  alertas(d: ActiveDirectoryDashboardCompleto): DashboardBreakdownItem[] { return [{ label: 'Contratos por vencer', total: d.totalContratosPorVencer }, { label: 'Contraseñas vencidas', total: d.totalPasswordsVencidas }, { label: 'Cuentas inactivas', total: d.totalCuentasInactivas }, { label: 'Cuentas bloqueadas', total: d.totalCuentasBloqueadas }]; }
  totalAlertas(d: ActiveDirectoryDashboardCompleto): number { return d.totalContratosPorVencer + d.totalPasswordsVencidas + d.totalCuentasInactivas + d.totalCuentasBloqueadas; }
  totalUsuarios(d: ActiveDirectoryDashboardCompleto): number { return d.usuariosHabilitados + d.usuariosDeshabilitados; }
  percent(value: number, total: number): number { return total > 0 ? Math.round((value / total) * 100) : 0; }
}
