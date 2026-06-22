import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardService } from './dashboard.service';
import { LicenciaTipoCount } from './licencia-tipo-count.model';

@Component({
  selector: 'app-licencias-por-tipo-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './licencias-por-tipo-chart.component.html',
  styleUrl: './licencias-por-tipo-chart.component.scss',
})
export class LicenciasPorTipoChartComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Claves', backgroundColor: '#3b82f6' }],
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } },
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
      datasets: [{ data: rows.map((r) => r.totalClaves), label: 'Claves', backgroundColor: '#3b82f6' }],
    };
  }
}
