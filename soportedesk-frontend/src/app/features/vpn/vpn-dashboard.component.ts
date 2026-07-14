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
    <div class="module-dash">
      <div class="module-dash-toolbar">
        <div class="module-dash-title">
          <strong>Control operativo VPN</strong>
          <span>Solicitudes, aprobaciones y vencimientos de antivirus que requieren seguimiento.</span>
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
        <div class="module-dash-stat tone-warning"><span>Pendientes</span><strong>{{ dashboard.pendientes }}</strong><small>Por revisar</small></div>
        <div class="module-dash-stat tone-success"><span>Aprobadas</span><strong>{{ dashboard.aprobadas }}</strong><small>Accesos habilitados</small></div>
        <div class="module-dash-stat tone-danger"><span>Rechazadas</span><strong>{{ dashboard.rechazadas }}</strong><small>No proceden</small></div>
        <div class="module-dash-stat tone-info"><span>Observadas</span><strong>{{ dashboard.observadas }}</strong><small>Con correccion</small></div>
        <div class="module-dash-stat"><span>Total</span><strong>{{ dashboard.total }}</strong><small>Solicitudes registradas</small></div>
      </section>

      <section class="module-dash-visual-grid" *ngIf="dashboard as d">
        <article class="module-dash-card module-dash-mini-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Estados de solicitudes</strong>
              <span>Pendientes, aprobadas, observadas y rechazadas</span>
            </div>
          </header>
          <canvas baseChart [data]="estadoChartData" [options]="doughnutOptions" [type]="'doughnut'"></canvas>
        </article>

        <article class="module-dash-card module-dash-mini-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Flujo de atención</strong>
              <span>Lectura lineal del estado operativo VPN</span>
            </div>
          </header>
          <canvas baseChart [data]="flujoChartData" [options]="lineOptions" [type]="'line'"></canvas>
        </article>
      </section>

      <section class="module-dash-grid" *ngIf="dashboard">
        <article class="module-dash-card module-dash-chart">
          <header class="module-dash-card__header">
            <div>
              <strong>Distribucion por tipo de equipo</strong>
              <span>{{ dashboard.distribucionPorTipoEquipo.length }} tipos registrados</span>
            </div>
          </header>
        <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'bar'"></canvas>
      </article>

        <div class="module-dash-side">
          <article class="module-dash-highlight">
            <strong>{{ dashboard.totalAntivirusVencidos + dashboard.totalAntivirusPorVencer }}</strong>
            <span>Equipos con antivirus vencido o por vencer.</span>
          </article>

          <article class="module-dash-card">
            <header class="module-dash-card__header">
              <div>
                <strong>Composicion de solicitudes</strong>
                <span>Avance general del flujo VPN</span>
              </div>
            </header>
            <div class="module-dash-progress">
              <div class="module-dash-progress-row">
                <span>Resueltas</span><strong>{{ percent(dashboard.aprobadas + dashboard.rechazadas + dashboard.observadas, dashboard.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(dashboard.aprobadas + dashboard.rechazadas + dashboard.observadas, dashboard.total)"></i></div>
              </div>
              <div class="module-dash-progress-row">
                <span>Pendientes</span><strong>{{ percent(dashboard.pendientes, dashboard.total) }}%</strong>
                <div class="module-dash-track"><i [style.width.%]="percent(dashboard.pendientes, dashboard.total)"></i></div>
              </div>
            </div>
          </article>

          <ng-container *ngTemplateOutlet="alertCard; context: {
            title: 'Antivirus vencidos',
            total: dashboard.totalAntivirusVencidos,
            rows: dashboard.antivirusVencidos,
            tone: 'tone-danger'
          }" />
          <ng-container *ngTemplateOutlet="alertCard; context: {
            title: 'Antivirus por vencer',
            total: dashboard.totalAntivirusPorVencer,
            rows: dashboard.antivirusPorVencer,
            tone: 'tone-warning'
          }" />
        </div>
      </section>

      <section class="empty-state" *ngIf="!dashboard && !loading">
        <strong>Sin datos de dashboard</strong>
        <span>El servicio devolvio un resumen vacio o no disponible.</span>
      </section>
    </div>

    <ng-template #alertCard let-title="title" let-total="total" let-rows="rows" let-tone="tone">
      <article class="module-dash-card">
        <header class="module-dash-card__header">
          <div>
            <strong>{{ title }}</strong>
            <span>Primeros registros por atender</span>
          </div>
          <span class="badge badge-warning">{{ total }}</span>
        </header>
        <div class="module-dash-list">
        <button class="module-dash-row clickable" [ngClass]="tone" type="button" *ngFor="let row of rows" (click)="goToRegistros(row.vpnId)">
          <strong>{{ row.titular }}</strong>
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
  styleUrl: './vpn.shared.scss',
})
export class VpnDashboardComponent implements OnInit {
  private service = inject(VpnService);
  private router = inject(Router);

  dashboard: VpnDashboardCompleto | null = null;
  loading = false;
  error = false;
  updatedAt: Date | null = null;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Solicitudes', backgroundColor: '#ef4444' }],
  };

  estadoChartData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#ffae1f', '#13deb9', '#539bff', '#fa896b'] }],
  };

  flujoChartData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Solicitudes', borderColor: '#fa896b', backgroundColor: 'rgba(250,137,107,.16)', tension: .35, fill: true, pointBackgroundColor: '#fa896b' }],
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

  goToRegistros(vpnId: number): void {
    this.router.navigate(['/vpn/registros'], { queryParams: { id: vpnId } });
  }

  private applyChart(dashboard: VpnDashboardCompleto | null): void {
    const rows = dashboard?.distribucionPorTipoEquipo ?? [];
    this.chartData = {
      labels: rows.map((row) => row.tipoEquipo),
      datasets: [{ data: rows.map((row) => row.total), label: 'Solicitudes', backgroundColor: '#ef4444' }],
    };

    this.estadoChartData = {
      labels: ['Pendientes', 'Aprobadas', 'Observadas', 'Rechazadas'],
      datasets: [{
        data: dashboard ? [dashboard.pendientes, dashboard.aprobadas, dashboard.observadas, dashboard.rechazadas] : [],
        backgroundColor: ['#ffae1f', '#13deb9', '#539bff', '#fa896b'],
      }],
    };

    this.flujoChartData = {
      labels: ['Pendientes', 'Aprobadas', 'Observadas', 'Rechazadas'],
      datasets: [{
        data: dashboard ? [dashboard.pendientes, dashboard.aprobadas, dashboard.observadas, dashboard.rechazadas] : [],
        label: 'Solicitudes',
        borderColor: '#fa896b',
        backgroundColor: 'rgba(250,137,107,.16)',
        tension: .35,
        fill: true,
        pointBackgroundColor: '#fa896b',
      }],
    };
  }

  percent(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
