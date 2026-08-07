import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { DashboardService } from './dashboard.service';
import { UbicacionUsuariosCount } from './ubicacion-usuarios-count.model';

type Nivel = 'sede' | 'dependencia';

const TOP_COUNT = 5;

@Component({
    selector: 'app-usuarios-red-por-ubicacion-chart',
    imports: [FormsModule, BaseChartDirective],
    templateUrl: './usuarios-red-por-ubicacion-chart.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './usuarios-red-por-ubicacion-chart.component.scss'
})
export class UsuariosRedPorUbicacionChartComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  nivel: Nivel = 'sede';
  error = false;
  rows: UbicacionUsuariosCount[] = [];
  searchTerm = '';
  selectedName: string | null = null;

  detailDoughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } },
    },
  };

  ngOnInit(): void {
    this.load();
  }

  setNivel(nivel: Nivel): void {
    if (this.nivel === nivel) return;
    this.nivel = nivel;
    this.clearSelection();
    this.load();
  }

  get topRows(): UbicacionUsuariosCount[] {
    return [...this.rows]
      .sort((a, b) => b.inactivos - a.inactivos || b.activos - a.activos)
      .slice(0, TOP_COUNT);
  }

  get selectedRow(): UbicacionUsuariosCount | null {
    return this.rows.find((row) => row.nombre === this.selectedName) ?? null;
  }

  get selectedChartData(): ChartData<'doughnut', number[], string> | null {
    const row = this.selectedRow;
    if (!row || row.activos + row.inactivos === 0) return null;
    return {
      labels: ['Activos', 'Inactivos'],
      datasets: [{
        data: [row.activos, row.inactivos],
        backgroundColor: ['#2f7d4a', '#a86200'],
        borderColor: 'rgba(255,255,255,.58)',
        borderWidth: 2,
      }],
    };
  }

  activosPercent(row: UbicacionUsuariosCount): number {
    const total = row.activos + row.inactivos;
    return total > 0 ? Math.round((row.activos / total) * 100) : 0;
  }

  onSearch(term: string): void {
    const match = this.rows.find((row) => row.nombre.toLowerCase() === term.trim().toLowerCase());
    if (match) {
      this.selectOffice(match.nombre);
    }
  }

  selectOffice(nombre: string): void {
    this.selectedName = nombre;
    this.searchTerm = nombre;
  }

  clearSelection(): void {
    this.selectedName = null;
    this.searchTerm = '';
  }

  private load(): void {
    this.error = false;
    this.dashboardService.getUsuariosRedPorUbicacion(this.nivel).subscribe({
      next: (rows) => (this.rows = rows),
      error: () => (this.error = true),
    });
  }
}
