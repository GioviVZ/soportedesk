import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryDashboardCompleto } from './active-directory.model';
import { AdKpisComponent } from './ad-kpis.component';

@Component({
  selector: 'app-usuarios-red-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, AdKpisComponent],
  template: `
    <div class="usuarios-red-page">
      <div class="dashboard-toolbar">
        <p>Distribucion por OU y cuentas que requieren seguimiento administrativo.</p>
        <button type="button" class="btn btn-ghost" (click)="load()" [disabled]="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>

      <div class="notice error" *ngIf="error">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        No se pudo cargar. Intenta nuevamente.
      </div>

      <app-ad-kpis [dashboard]="dashboard" />

      <section class="dashboard-grid" *ngIf="dashboard">
        <article class="card chart-card">
          <header>
            <strong>Distribucion por OU</strong>
            <span class="muted">{{ dashboard.distribucionPorOu.length }} unidades</span>
          </header>
          <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
        </article>

        <div class="alert-list">
          <ng-container *ngTemplateOutlet="alertCard; context: {
            title: 'Contrasenas vencidas',
            total: dashboard.totalPasswordsVencidas,
            rows: dashboard.passwordsVencidas
          }" />
          <ng-container *ngTemplateOutlet="alertCard; context: {
            title: 'Cuentas inactivas',
            total: dashboard.totalCuentasInactivas,
            rows: dashboard.cuentasInactivas
          }" />
          <ng-container *ngTemplateOutlet="alertCard; context: {
            title: 'Cuentas bloqueadas',
            total: dashboard.totalCuentasBloqueadas,
            rows: dashboard.cuentasBloqueadas
          }" />
        </div>
      </section>

      <section class="empty-state" *ngIf="!dashboard && !loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <strong>Sin datos de dashboard</strong>
        <span>El servicio devolvio un resumen vacio o no disponible.</span>
      </section>
    </div>

    <ng-template #alertCard let-title="title" let-total="total" let-rows="rows">
      <article class="card alert-card">
        <header>
          <strong>{{ title }}</strong>
          <span class="badge badge-warning">{{ total }}</span>
        </header>
        <button class="alert-row" type="button" *ngFor="let row of rows" (click)="goToAdmin(row.samAccountName)">
          <strong>{{ row.samAccountName }}</strong>
          <span>{{ row.displayName || 'Sin nombre' }}</span>
          <small class="muted">{{ row.detalle }}</small>
        </button>
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
}
