import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryDashboardCompleto } from './active-directory.model';

@Component({
  selector: 'app-usuarios-red-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="usuarios-red-page">
      <div class="module-dash">
        <div class="module-dash-toolbar">
          <div class="module-dash-title">
            <strong>Control operativo Active Directory</strong>
            <span>Estado del directorio, distribucion por OU y cuentas con riesgo administrativo.</span>
          </div>
          <div class="module-dash-actions">
            <span class="module-dash-updated" *ngIf="updatedAt">Actualizado {{ updatedAt | date:'HH:mm' }}</span>
            <button type="button" class="module-dash-refresh" (click)="load()" [disabled]="loading">
              <span class="module-dash-refresh-icon" aria-hidden="true"></span>
              {{ loading ? 'Actualizando' : 'Actualizar' }}
            </button>
          </div>
        </div>

        <div class="module-dash-notice" *ngIf="error">No se pudo cargar. Se mantiene la ultima vista disponible.</div>

        <section class="module-dash-stats" *ngIf="dashboard">
          <div class="module-dash-stat tone-success"><span>Habilitados</span><strong>{{ dashboard.usuariosHabilitados }}</strong><small>Cuentas activas</small></div>
          <div class="module-dash-stat tone-danger"><span>Bloqueados</span><strong>{{ dashboard.usuariosBloqueados }}</strong><small>Requieren revision</small></div>
          <div class="module-dash-stat tone-warning"><span>Deshabilitados</span><strong>{{ dashboard.usuariosDeshabilitados }}</strong><small>Fuera de operacion</small></div>
          <div class="module-dash-stat tone-info"><span>Controladores</span><strong>{{ dashboard.controladoresDominio }}</strong><small>Dominio AD</small></div>
        </section>

        <section class="module-dash-grid" *ngIf="dashboard">
          <article class="module-dash-card module-dash-chart">
            <header class="module-dash-card__header">
              <div>
                <strong>Distribucion por OU</strong>
                <span>{{ dashboard.distribucionPorOu.length }} unidades registradas</span>
              </div>
            </header>
          <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
        </article>

          <div class="module-dash-side">
            <article class="module-dash-highlight">
              <strong>{{ dashboard.totalPasswordsVencidas + dashboard.totalCuentasInactivas + dashboard.totalCuentasBloqueadas }}</strong>
              <span>Alertas de cuentas por resolver.</span>
            </article>

            <article class="module-dash-card">
              <header class="module-dash-card__header">
                <div>
                  <strong>Salud del directorio</strong>
                  <span>Relacion de cuentas habilitadas frente al total visible</span>
                </div>
              </header>
              <div class="module-dash-progress">
                <div class="module-dash-progress-row">
                  <span>Habilitadas</span><strong>{{ percent(dashboard.usuariosHabilitados, totalUsuarios(dashboard)) }}%</strong>
                  <div class="module-dash-track"><i [style.width.%]="percent(dashboard.usuariosHabilitados, totalUsuarios(dashboard))"></i></div>
                </div>
                <div class="module-dash-progress-row">
                  <span>Con bloqueo</span><strong>{{ percent(dashboard.usuariosBloqueados, totalUsuarios(dashboard)) }}%</strong>
                  <div class="module-dash-track"><i [style.width.%]="percent(dashboard.usuariosBloqueados, totalUsuarios(dashboard))"></i></div>
                </div>
              </div>
            </article>

            <ng-container *ngTemplateOutlet="alertCard; context: {
              title: 'Contrasenas vencidas',
              total: dashboard.totalPasswordsVencidas,
              rows: dashboard.passwordsVencidas,
              tone: 'tone-warning'
            }" />
            <ng-container *ngTemplateOutlet="alertCard; context: {
              title: 'Cuentas inactivas',
              total: dashboard.totalCuentasInactivas,
              rows: dashboard.cuentasInactivas,
              tone: 'tone-info'
            }" />
            <ng-container *ngTemplateOutlet="alertCard; context: {
              title: 'Cuentas bloqueadas',
              total: dashboard.totalCuentasBloqueadas,
              rows: dashboard.cuentasBloqueadas,
              tone: 'tone-danger'
            }" />
          </div>
        </section>

        <section class="empty-state" *ngIf="!dashboard && !loading">
          <strong>Sin datos de dashboard</strong>
          <span>El servicio devolvio un resumen vacio o no disponible.</span>
        </section>
      </div>
    </div>

    <ng-template #alertCard let-title="title" let-total="total" let-rows="rows" let-tone="tone">
      <article class="module-dash-card">
        <header class="module-dash-card__header">
          <div>
            <strong>{{ title }}</strong>
            <span>Primeras cuentas para revisar</span>
          </div>
          <span class="badge badge-warning">{{ total }}</span>
        </header>
        <div class="module-dash-list">
        <button class="module-dash-row clickable" [ngClass]="tone" type="button" *ngFor="let row of rows" (click)="goToAdmin(row.samAccountName)">
          <strong>{{ row.samAccountName }}</strong>
          <span>{{ row.displayName || 'Sin nombre' }}</span>
          <small class="muted">{{ row.detalle }}</small>
        </button>
        </div>
        <p class="muted" *ngIf="!rows.length">Sin registros criticos.</p>
        <p class="muted" *ngIf="total > rows.length">+{{ total - rows.length }} mas</p>
      </article>
    </ng-template>
  `,
  styles: [`
    .dashboard-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: -6px;
    }
    .dashboard-toolbar p {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 13px;
    }
  `],
  styleUrl: './usuarios-red.shared.scss',
})
export class UsuariosRedDashboardComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);
  private router = inject(Router);

  dashboard: ActiveDirectoryDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Activos', backgroundColor: '#f97316' }],
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#e2e8f0' },
        ticks: { precision: 0 },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.adService.getDashboardCompleto().subscribe({
      next: (dashboard) => {
        this.loading = false;
        this.dashboard = dashboard;
        this.updatedAt = new Date();
        this.applyChart(dashboard);
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.dashboard = null;
        this.applyChart(null);
      },
    });
  }

  goToAdmin(sam: string): void {
    this.router.navigate(['/usuarios-red/administracion'], { queryParams: { sam } });
  }

  private applyChart(dashboard: ActiveDirectoryDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorOu ?? [];
    this.chartData = {
      labels: rows.map((row) => row.ou),
      datasets: [{ data: rows.map((row) => row.activos), label: 'Activos', backgroundColor: '#f97316' }],
    };
  }

  totalUsuarios(dashboard: ActiveDirectoryDashboardCompleto): number {
    return dashboard.usuariosHabilitados + dashboard.usuariosDeshabilitados;
  }

  percent(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
