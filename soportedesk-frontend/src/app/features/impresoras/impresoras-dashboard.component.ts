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
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title">
          <strong>Control operativo de impresoras</strong>
          <span>Estado de flota, distribucion por marca y consumibles con mayor demanda.</span>
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

      <section class="module-dash-stats" *ngIf="dashboard as d">
        <div class="module-dash-stat"><span>Total</span><strong>{{ d.total }}</strong><small>Flota registrada</small></div>
        <div class="module-dash-stat tone-success"><span>Activas</span><strong>{{ d.activas }}</strong><small>En operacion</small></div>
        <div class="module-dash-stat tone-warning"><span>Mantenimiento</span><strong>{{ d.enMantenimiento }}</strong><small>Requieren atencion</small></div>
        <div class="module-dash-stat tone-danger"><span>De baja</span><strong>{{ d.deBaja }}</strong><small>Fuera de servicio</small></div>
      </section>

      <section class="module-dash-visual-grid" *ngIf="dashboard as d">
        <article class="module-dash-card module-dash-mini-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Estado de la flota</strong>
              <span>Activas, mantenimiento y baja</span>
            </div>
          </header>
          <canvas baseChart [data]="estadoChartData" [options]="doughnutOptions" [type]="'doughnut'"></canvas>
        </article>

        <article class="module-dash-card module-dash-mini-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Impresoras por sede</strong>
              <span>Distribución territorial de la flota</span>
            </div>
          </header>
          <canvas baseChart [data]="sedeChartData" [options]="sedeChartOptions" [type]="'bar'"></canvas>
        </article>
      </section>

      <section class="module-dash-grid" *ngIf="dashboard as d">
        <article class="module-dash-card module-dash-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Distribucion por marca</strong>
              <span>{{ d.distribucionPorMarca.length }} marcas registradas</span>
            </div>
          </header>
          <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
        </article>

        <div class="module-dash-side">
          <article class="module-dash-highlight">
            <strong>{{ percent(d.activas, d.total) }}%</strong>
            <span>De la flota se encuentra activa.</span>
          </article>

          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Estado de flota</strong>
                <span>Participacion por estado operativo</span>
              </div>
            </header>
            <div class="module-dash-progress">
              <div class="module-dash-progress-row">
                <span>Activas</span><strong>{{ percent(d.activas, d.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.activas, d.total)"></i></div>
              </div>
              <div class="module-dash-progress-row">
                <span>Mantenimiento</span><strong>{{ percent(d.enMantenimiento, d.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.enMantenimiento, d.total)"></i></div>
              </div>
              <div class="module-dash-progress-row">
                <span>De baja</span><strong>{{ percent(d.deBaja, d.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.deBaja, d.total)"></i></div>
              </div>
            </div>
          </article>

          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Distribucion por sede</strong>
                <span>Sedes con impresoras registradas</span>
              </div>
              <span class="badge badge-info">{{ d.distribucionPorSede.length }}</span>
            </header>
            <div class="module-dash-list">
              <div class="module-dash-row tone-info" *ngFor="let row of d.distribucionPorSede">
                <strong>{{ row.sede }}</strong>
                <small>{{ row.total }} impresoras</small>
              </div>
            </div>
          </article>

          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Top 10 consumibles mas demandados</strong>
                <span>Codigos con mayor alcance en flota</span>
              </div>
              <span class="badge badge-warning">{{ d.totalConsumiblesDistintos }}</span>
            </header>
            <div class="module-dash-list">
              <div class="module-dash-row tone-warning" *ngFor="let row of d.topConsumibles">
                <strong>Toner {{ row.color }} - {{ row.variante }}</strong>
                <small>{{ row.codigo }} - {{ row.cantidad }} impresoras</small>
              </div>
            </div>
            <p class="muted" *ngIf="!d.topConsumibles.length">Sin registros criticos.</p>
          </article>
        </div>
      </section>

      <section class="empty-state" *ngIf="!dashboard && !loading">
        <strong>Sin datos de dashboard</strong>
        <span>El servicio devolvio un resumen vacio o no disponible.</span>
      </section>
    </div>
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
  updatedAt: Date | null = null;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Impresoras', backgroundColor: '#64748b' }],
  };

  estadoChartData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#13deb9', '#ffae1f', '#fa896b'] }],
  };

  sedeChartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Impresoras', backgroundColor: '#539bff' }],
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

  sedeChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 35, minRotation: 0 } },
      y: { beginAtZero: true, grid: { color: '#e5eaf2' }, ticks: { precision: 0 } },
    },
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } },
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

  private applyChart(dashboard: ImpresoraDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorMarca ?? [];
    this.chartData = {
      labels: rows.map((row) => row.marca),
      datasets: [{ data: rows.map((row) => row.total), label: 'Impresoras', backgroundColor: '#64748b' }],
    };

    this.estadoChartData = {
      labels: ['Activas', 'Mantenimiento', 'De baja'],
      datasets: [{
        data: dashboard ? [dashboard.activas, dashboard.enMantenimiento, dashboard.deBaja] : [],
        backgroundColor: ['#13deb9', '#ffae1f', '#fa896b'],
      }],
    };

    const sedes = dashboard?.distribucionPorSede ?? [];
    this.sedeChartData = {
      labels: sedes.map((row) => row.sede),
      datasets: [{ data: sedes.map((row) => row.total), label: 'Impresoras', backgroundColor: '#539bff' }],
    };
  }

  percent(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
