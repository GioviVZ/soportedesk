import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ImpresoraService } from './impresora.service';
import { ImpresoraDashboardCompleto } from './impresora.model';

@Component({
  selector: 'app-impresoras-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-toolbar">
      <p>Distribucion por marca, por sede y consumibles mas demandados de la flota.</p>
      <button type="button" class="btn btn-ghost" (click)="load()" [disabled]="loading">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        {{ loading ? 'Cargando...' : 'Actualizar' }}
      </button>
    </div>

    <div class="notice error" *ngIf="error">No se pudo cargar. Intenta nuevamente.</div>

    <section class="module-stats" *ngIf="dashboard as d">
      <div class="stat-pill"><strong>{{ d.total }}</strong><span>Total</span></div>
      <div class="stat-pill"><strong>{{ d.activas }}</strong><span>Activas</span></div>
      <div class="stat-pill"><strong>{{ d.enMantenimiento }}</strong><span>Mant.</span></div>
      <div class="stat-pill"><strong>{{ d.deBaja }}</strong><span>De baja</span></div>
    </section>

    <section class="dashboard-grid" *ngIf="dashboard as d">
      <article class="card chart-card">
        <header>
          <strong>Distribucion por marca</strong>
          <span class="muted">{{ d.distribucionPorMarca.length }} marcas</span>
        </header>
        <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
      </article>

      <div class="alert-list">
        <article class="card alert-card">
          <header>
            <strong>Distribucion por sede</strong>
            <span class="badge badge-info">{{ d.distribucionPorSede.length }}</span>
          </header>
          <div class="alert-row" *ngFor="let row of d.distribucionPorSede">
            <strong>{{ row.sede }}</strong>
            <small class="muted">{{ row.total }} impresoras</small>
          </div>
        </article>

        <article class="card alert-card">
          <header>
            <strong>Top 10 consumibles mas demandados</strong>
            <span class="badge badge-warning">{{ d.totalConsumiblesDistintos }}</span>
          </header>
          <div class="alert-row" *ngFor="let row of d.topConsumibles">
            <strong>Toner {{ row.color }} - {{ row.variante }}</strong>
            <small class="muted">{{ row.codigo }} - {{ row.cantidad }} impresoras</small>
          </div>
          <p class="muted" *ngIf="!d.topConsumibles.length">Sin registros criticos.</p>
        </article>
      </div>
    </section>

    <section class="empty-state" *ngIf="!dashboard && !loading">
      <strong>Sin datos de dashboard</strong>
      <span>El servicio devolvio un resumen vacio o no disponible.</span>
    </section>
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
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasDashboardComponent implements OnInit {
  private service = inject(ImpresoraService);

  dashboard: ImpresoraDashboardCompleto | null = null;
  loading = false;
  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Impresoras', backgroundColor: '#64748b' }],
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

  private applyChart(dashboard: ImpresoraDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorMarca ?? [];
    this.chartData = {
      labels: rows.map((row) => row.marca),
      datasets: [{ data: rows.map((row) => row.total), label: 'Impresoras', backgroundColor: '#64748b' }],
    };
  }
}
