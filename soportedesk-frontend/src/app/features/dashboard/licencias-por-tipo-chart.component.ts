import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardService } from './dashboard.service';
import { LicenciaTipoCount } from './licencia-tipo-count.model';

@Component({
    selector: 'app-licencias-por-tipo-chart',
    imports: [BaseChartDirective],
    templateUrl: './licencias-por-tipo-chart.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './licencias-por-tipo-chart.component.scss'
})
export class LicenciasPorTipoChartComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Claves', backgroundColor: '#456b8a' }],
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#e1e5df' },
        ticks: { precision: 0 },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  ngOnInit(): void {
    this.dashboardService.getLicenciasPorTipo().subscribe({
      next: (rows) => this.applyData(rows),
      error: () => (this.error = true),
    });
  }

  private applyData(rows: LicenciaTipoCount[]): void {
    this.chartData = {
      labels: rows.map((r) => r.nombre),
      datasets: [{ data: rows.map((r) => r.totalClaves), label: 'Claves', backgroundColor: '#456b8a' }],
    };
  }
}
