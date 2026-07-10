import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { EquipoService } from './equipo.service';
import { EquipoDashboardCompleto } from './equipo.model';

@Component({
  selector: 'app-equipos-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title">
          <strong>Panorama del inventario de equipos</strong>
          <span>Distribucion por fabricante, dependencias con mas equipos y salud general del parque.</span>
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
        <div class="module-dash-stat"><span>Total</span><strong>{{ d.total }}</strong><small>Equipos registrados</small></div>
        <div class="module-dash-stat"><span>Desktop</span><strong>{{ d.desktopCount }}</strong><small>Equipos de escritorio</small></div>
        <div class="module-dash-stat"><span>Laptop</span><strong>{{ d.laptopCount }}</strong><small>Equipos portatiles</small></div>
        <div class="module-dash-stat"><span>Otros</span><strong>{{ d.otrosCount }}</strong><small>Servidores y demas</small></div>
        <div class="module-dash-stat tone-info"><span>Sede Central</span><strong>{{ d.sedeCentralCount }}</strong><small>En sede central</small></div>
        <div class="module-dash-stat tone-info"><span>EEAs</span><strong>{{ d.eeasCount }}</strong><small>En estaciones experimentales</small></div>
      </section>

      <section class="module-dash-grid" *ngIf="dashboard as d">
        <article class="module-dash-card module-dash-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Distribucion por fabricante</strong>
              <span>{{ d.distribucionPorFabricante.length }} fabricantes registrados</span>
            </div>
          </header>
          <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
        </article>

        <div class="module-dash-side">
          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Resumen de salud</strong>
                <span>Participacion por nivel de alerta</span>
              </div>
            </header>
            <div class="module-dash-progress">
              <div class="module-dash-progress-row">
                <span>Criticos (Rojo)</span><strong>{{ percent(d.salud.rojos, d.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.salud.rojos, d.total)"></i></div>
              </div>
              <div class="module-dash-progress-row">
                <span>Advertencia (Amarillo)</span><strong>{{ percent(d.salud.amarillos, d.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.salud.amarillos, d.total)"></i></div>
              </div>
              <div class="module-dash-progress-row">
                <span>Al dia (OK)</span><strong>{{ percent(d.salud.ok, d.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(d.salud.ok, d.total)"></i></div>
              </div>
            </div>
            <div class="module-dash-list">
              <div class="module-dash-row tone-warning"><strong>Sin codigo patrimonial</strong><small>{{ d.salud.sinPatrimonial }} equipos</small></div>
              <div class="module-dash-row tone-warning"><strong>Sin usuario</strong><small>{{ d.salud.sinUsuario }} equipos</small></div>
              <div class="module-dash-row tone-warning"><strong>Sin sede</strong><small>{{ d.salud.sinSede }} equipos</small></div>
            </div>
          </article>

          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Top dependencias</strong>
                <span>Dependencias con mas equipos registrados</span>
              </div>
              <span class="badge">{{ d.topDependencias.length }}</span>
            </header>
            <div class="module-dash-list">
              <div class="module-dash-row tone-info" *ngFor="let row of d.topDependencias">
                <strong>{{ row.dependencia }}</strong>
                <small>{{ row.total }} equipos</small>
              </div>
            </div>
            <p *ngIf="!d.topDependencias.length">Sin dependencias registradas.</p>
          </article>
        </div>
      </section>

      <section class="empty-state" *ngIf="!dashboard && !loading">
        <strong>Sin datos de dashboard</strong>
        <span>El servicio devolvio un resumen vacio o no disponible.</span>
      </section>
    </div>
  `,
  styleUrl: './equipos.shared.scss',
})
export class EquiposDashboardComponent implements OnInit {
  private service = inject(EquipoService);

  dashboard: EquipoDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Equipos', backgroundColor: '#16a34a' }],
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

  private applyChart(dashboard: EquipoDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorFabricante ?? [];
    this.chartData = {
      labels: rows.map((row) => row.fabricante),
      datasets: [{ data: rows.map((row) => row.total), label: 'Equipos', backgroundColor: '#16a34a' }],
    };
  }

  percent(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
