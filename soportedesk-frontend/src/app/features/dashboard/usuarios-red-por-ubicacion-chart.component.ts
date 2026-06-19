import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardService } from './dashboard.service';
import { UbicacionUsuariosCount } from './ubicacion-usuarios-count.model';

type Nivel = 'sede' | 'dependencia';

@Component({
  selector: 'app-usuarios-red-por-ubicacion-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './usuarios-red-por-ubicacion-chart.component.html',
  styleUrl: './usuarios-red-por-ubicacion-chart.component.scss',
})
export class UsuariosRedPorUbicacionChartComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  nivel: Nivel = 'sede';
  error = false;

  chartData: ChartData<'bar', number[], string> = {
    labels: [],
    datasets: [
      { data: [], label: 'Activos', backgroundColor: '#16a34a' },
      { data: [], label: 'Inactivos', backgroundColor: '#ef4444' },
    ],
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { beginAtZero: true } },
  };

  ngOnInit(): void {
    this.load();
  }

  setNivel(nivel: Nivel): void {
    if (this.nivel === nivel) return;
    this.nivel = nivel;
    this.load();
  }

  private load(): void {
    this.error = false;
    this.dashboardService.getUsuariosRedPorUbicacion(this.nivel).subscribe({
      next: (rows) => this.applyData(rows),
      error: () => (this.error = true),
    });
  }

  private applyData(rows: UbicacionUsuariosCount[]): void {
    this.chartData = {
      labels: rows.map((r) => r.nombre),
      datasets: [
        { data: rows.map((r) => r.activos), label: 'Activos', backgroundColor: '#16a34a' },
        { data: rows.map((r) => r.inactivos), label: 'Inactivos', backgroundColor: '#ef4444' },
      ],
    };
  }
}
