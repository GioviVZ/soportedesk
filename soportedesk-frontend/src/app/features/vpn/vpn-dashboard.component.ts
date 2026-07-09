import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { VpnService } from './vpn.service';
import { VpnDashboardCompleto } from './vpn.model';

@Component({
  selector: 'app-vpn-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-toolbar">
      <p>Distribucion de solicitudes por tipo de equipo y antivirus por vencer.</p>
      <button type="button" class="btn btn-ghost" (click)="load()" [disabled]="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        {{ loading ? 'Cargando...' : 'Actualizar' }}
      </button>
    </div>

    <div class="notice error" *ngIf="error">No se pudo cargar. Intenta nuevamente.</div>

    <section class="module-stats" *ngIf="dashboard">
      <div class="stat-pill"><strong>{{ dashboard.pendientes }}</strong><span>Pendientes</span></div>
      <div class="stat-pill"><strong>{{ dashboard.aprobadas }}</strong><span>Aprobadas</span></div>
      <div class="stat-pill"><strong>{{ dashboard.rechazadas }}</strong><span>Rechazadas</span></div>
      <div class="stat-pill"><strong>{{ dashboard.observadas }}</strong><span>Observadas</span></div>
      <div class="stat-pill"><strong>{{ dashboard.total }}</strong><span>Total</span></div>
    </section>

    <section class="dashboard-grid" *ngIf="dashboard">
      <article class="card chart-card">
        <header>
          <strong>Distribucion por tipo de equipo</strong>
          <span class="muted">{{ dashboard.distribucionPorTipoEquipo.length }} tipos</span>
        </header>
        <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
      </article>

      <div class="alert-list">
        <ng-container *ngTemplateOutlet="alertCard; context: {
          title: 'Antivirus vencidos',
          total: dashboard.totalAntivirusVencidos,
          rows: dashboard.antivirusVencidos
        }" />
        <ng-container *ngTemplateOutlet="alertCard; context: {
          title: 'Antivirus por vencer',
          total: dashboard.totalAntivirusPorVencer,
          rows: dashboard.antivirusPorVencer
        }" />
      </div>
    </section>

    <section class="empty-state" *ngIf="!dashboard && !loading">
      <strong>Sin datos de dashboard</strong>
      <span>El servicio devolvio un resumen vacio o no disponible.</span>
    </section>

    <ng-template #alertCard let-title="title" let-total="total" let-rows="rows">
      <article class="card alert-card">
        <header>
          <strong>{{ title }}</strong>
          <span class="badge badge-warning">{{ total }}</span>
        </header>
        <button class="alert-row" type="button" *ngFor="let row of rows" (click)="goToRegistros(row.vpnId)">
          <strong>{{ row.titular }}</strong>
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
  styleUrl: './vpn.shared.scss',
})
export class VpnDashboardComponent implements OnInit {
  private service = inject(VpnService);
  private router = inject(Router);

  dashboard: VpnDashboardCompleto | null = null;
  loading = false;
  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Solicitudes', backgroundColor: '#ef4444' }],
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } },
    scales: {
      x: { beginAtZero: true, grid: { color: '#e2e8f0' }, ticks: { precision: 0 } },
      y: { grid: { display: false } },
    },
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.service.getDashboardCompleto().subscribe({
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

  goToRegistros(vpnId: number): void {
    this.router.navigate(['/vpn/registros'], { queryParams: { id: vpnId } });
  }

  private applyChart(dashboard: VpnDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorTipoEquipo ?? [];
    this.chartData = {
      labels: rows.map((row) => row.tipoEquipo),
      datasets: [{ data: rows.map((row) => row.total), label: 'Solicitudes', backgroundColor: '#ef4444' }],
    };
  }
}
