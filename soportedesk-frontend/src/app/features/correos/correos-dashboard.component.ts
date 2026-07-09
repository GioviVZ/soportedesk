import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CorreoService } from './correo.service';
import { CorreoDashboardCompleto } from './correo.model';

@Component({
  selector: 'app-correos-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="dashboard-toolbar">
      <p>Licencias, distribucion por dependencia y cuentas que requieren seguimiento.</p>
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
      <div class="stat-pill"><strong>{{ d.kpis.licenciasTotales }}</strong><span>Licencias Totales</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.activasCount }}</strong><span>Activas</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.suspendidasCount }}</strong><span>Suspendidas</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.licenciasDisponibles }}</strong><span>Disponibles</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.sedeCentralCount }}</strong><span>Sede Central</span></div>
      <div class="stat-pill"><strong>{{ d.kpis.eeasCount }}</strong><span>EEAs</span></div>
    </section>

    <section class="dashboard-grid" *ngIf="dashboard as d">
      <article class="card chart-card">
        <header>
          <strong>Distribucion por dependencia</strong>
          <span class="muted">{{ d.distribucionPorDependencia.length }} dependencias</span>
        </header>
        <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
      </article>

      <div class="alert-list">
        <article class="card stat-highlight">
          <strong>{{ d.porcentaje2FA.toFixed(1) }}%</strong>
          <span>{{ d.cuentasCon2FA }} de {{ d.totalCuentas }} cuentas con verificacion en 2 pasos</span>
        </article>

        <article class="card alert-card">
          <header>
            <strong>Cuentas sin uso 30+ dias</strong>
            <span class="badge badge-warning">{{ d.totalSinUso }}</span>
          </header>
          <div class="alert-row" *ngFor="let row of d.sinUso">
            <strong>{{ row.nombreCompleto || row.email }}</strong>
            <small class="muted">{{ row.detalle }}</small>
          </div>
          <p class="muted" *ngIf="!d.sinUso.length">Sin registros criticos.</p>
          <p class="muted" *ngIf="d.totalSinUso > d.sinUso.length">+{{ d.totalSinUso - d.sinUso.length }} mas</p>
        </article>
      </div>
    </section>

    <section class="empty-state" *ngIf="!dashboard && !loading">
      <strong>Sin datos de dashboard</strong>
      <span>El servicio devolvio un resumen vacio o no disponible.</span>
    </section>
  `,
  styleUrl: './correos.shared.scss',
})
export class CorreosDashboardComponent implements OnInit {
  private service = inject(CorreoService);

  dashboard: CorreoDashboardCompleto | null = null;
  loading = false;
  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Cuentas', backgroundColor: '#8b5cf6' }],
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

  private applyChart(dashboard: CorreoDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorDependencia ?? [];
    this.chartData = {
      labels: rows.map((row) => row.dependencia),
      datasets: [{ data: rows.map((row) => row.total), label: 'Cuentas', backgroundColor: '#8b5cf6' }],
    };
  }
}
