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
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title">
          <strong>Control operativo de correos</strong>
          <span>Licencias, seguridad 2FA, distribucion por dependencia y cuentas sin uso.</span>
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
        <div class="module-dash-stat"><span>Licencias totales</span><strong>{{ d.kpis.licenciasTotales }}</strong><small>Capacidad disponible</small></div>
        <div class="module-dash-stat tone-success"><span>Activas</span><strong>{{ d.kpis.activasCount }}</strong><small>Cuentas operativas</small></div>
        <div class="module-dash-stat tone-warning"><span>Suspendidas</span><strong>{{ d.kpis.suspendidasCount }}</strong><small>Revisar estado</small></div>
        <div class="module-dash-stat tone-info"><span>Disponibles</span><strong>{{ d.kpis.licenciasDisponibles }}</strong><small>Sin asignar</small></div>
        <div class="module-dash-stat"><span>Sede Central</span><strong>{{ d.kpis.sedeCentralCount }}</strong><small>Asignaciones</small></div>
        <div class="module-dash-stat"><span>EEAs</span><strong>{{ d.kpis.eeasCount }}</strong><small>Asignaciones</small></div>
      </section>

      <section class="module-dash-visual-grid" *ngIf="dashboard as d">
        <article class="module-dash-card module-dash-mini-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Licencias Workspace</strong>
              <span>Asignadas frente a disponibles</span>
            </div>
          </header>
          <canvas baseChart [data]="licenciasChartData" [options]="doughnutOptions" [type]="'doughnut'"></canvas>
        </article>

        <article class="module-dash-card module-dash-mini-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Seguridad y uso</strong>
              <span>2FA, cuentas activas y cuentas sin uso</span>
            </div>
          </header>
          <canvas baseChart [data]="seguridadChartData" [options]="lineOptions" [type]="'line'"></canvas>
        </article>
      </section>

      <section class="module-dash-grid" *ngIf="dashboard as d">
        <article class="module-dash-card module-dash-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Distribucion por dependencia</strong>
              <span>{{ d.distribucionPorDependencia.length }} dependencias registradas</span>
            </div>
          </header>
          <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
        </article>

        <div class="module-dash-side">
          <article class="module-dash-highlight">
            <strong>{{ d.porcentaje2FA.toFixed(1) }}%</strong>
            <span>{{ d.cuentasCon2FA }} de {{ d.totalCuentas }} cuentas con verificacion en 2 pasos.</span>
          </article>

          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Uso de licencias</strong>
                <span>Asignadas frente a capacidad total</span>
              </div>
            </header>
            <div class="module-dash-progress">
              <div class="module-dash-progress-row">
                <span>Asignadas</span><strong>{{ percent(d.kpis.licenciasAsignadas, d.kpis.licenciasTotales) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.kpis.licenciasAsignadas, d.kpis.licenciasTotales)"></i></div>
              </div>
              <div class="module-dash-progress-row">
                <span>Disponibles</span><strong>{{ percent(d.kpis.licenciasDisponibles, d.kpis.licenciasTotales) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.kpis.licenciasDisponibles, d.kpis.licenciasTotales)"></i></div>
              </div>
            </div>
          </article>

          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Cuentas sin uso 30+ dias</strong>
                <span>Primeras cuentas para revisar</span>
              </div>
              <span class="badge badge-warning">{{ d.totalSinUso }}</span>
            </header>
            <div class="module-dash-list">
              <div class="module-dash-row tone-warning" *ngFor="let row of d.sinUso">
                <strong>{{ row.nombreCompleto || row.email }}</strong>
                <span>{{ row.email }}</span>
                <small>{{ row.detalle }}</small>
              </div>
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
    </div>
  `,
  styleUrl: './correos.shared.scss',
})
export class CorreosDashboardComponent implements OnInit {
  private service = inject(CorreoService);

  dashboard: CorreoDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Cuentas', backgroundColor: '#8b5cf6' }],
  };

  licenciasChartData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#8754ec', '#13deb9'] }],
  };

  seguridadChartData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Cuentas', borderColor: '#8754ec', backgroundColor: 'rgba(135,84,236,.16)', tension: .35, fill: true, pointBackgroundColor: '#8754ec' }],
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

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } },
  };

  lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } },
    scales: {
      x: { grid: { color: '#e5eaf2' } },
      y: { beginAtZero: true, grid: { color: '#e5eaf2' }, ticks: { precision: 0 } },
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

  private applyChart(dashboard: CorreoDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorDependencia ?? [];
    this.chartData = {
      labels: rows.map((row) => row.dependencia),
      datasets: [{ data: rows.map((row) => row.total), label: 'Cuentas', backgroundColor: '#8b5cf6' }],
    };

    this.licenciasChartData = {
      labels: ['Asignadas', 'Disponibles'],
      datasets: [{
        data: dashboard ? [dashboard.kpis.licenciasAsignadas, dashboard.kpis.licenciasDisponibles] : [],
        backgroundColor: ['#8754ec', '#13deb9'],
      }],
    };

    this.seguridadChartData = {
      labels: ['Activas', 'Con 2FA', 'Suspendidas', 'Sin uso 30+'],
      datasets: [{
        data: dashboard ? [dashboard.kpis.activasCount, dashboard.cuentasCon2FA, dashboard.kpis.suspendidasCount, dashboard.totalSinUso] : [],
        label: 'Cuentas',
        borderColor: '#8754ec',
        backgroundColor: 'rgba(135,84,236,.16)',
        tension: .35,
        fill: true,
        pointBackgroundColor: '#8754ec',
      }],
    };
  }

  percent(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
