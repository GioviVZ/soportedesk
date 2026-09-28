import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

export interface DashboardBreakdownItem {
  label: string;
  total: number;
}

@Component({
  selector: 'app-dashboard-breakdown',
  imports: [BaseChartDirective],
  template: `
    <article class="breakdown breakdown--open">
      <div class="breakdown__header">
        <span class="breakdown__identity">
          <span class="breakdown__eyebrow">{{ eyebrow }}</span>
          <strong>{{ title }}</strong>
          <small>{{ subtitle }}</small>
        </span>
        <span class="breakdown__summary">
          <strong>{{ total }}</strong>
          <small>{{ items.length }} {{ items.length === 1 ? 'categoría' : 'categorías' }}</small>
        </span>
      </div>

      <div class="breakdown__body">
        @if (items.length) {
          <div class="breakdown__visuals">
            <div class="breakdown__chart">
              <canvas baseChart [data]="chartData" [options]="chartOptions" [type]="'doughnut'"></canvas>
              <span class="breakdown__center"><strong>{{ total }}</strong><small>{{ unit }}</small></span>
            </div>
            <div class="breakdown__columns">
              <span class="breakdown__chart-label">Comparación por categoría</span>
              <canvas baseChart [data]="barChartData" [options]="barChartOptions" [type]="'bar'"></canvas>
            </div>
          </div>
          <div class="breakdown__ranking" tabindex="0" aria-label="Detalle de categorías">
            @for (item of items; track item.label; let index = $index) {
              <div class="breakdown__row">
                <i [style.background]="rankingColor(index)" aria-hidden="true"></i>
                <span [title]="item.label">{{ item.label }}</span>
                <strong>{{ item.total }}</strong>
                <small>{{ percentage(item.total) }}%</small>
              </div>
            }
          </div>
        } @else {
          <div class="breakdown__empty">{{ emptyText }}</div>
        }
      </div>
    </article>
  `,
  styleUrl: './dashboard-breakdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardBreakdownComponent implements OnChanges {
  @Input({ required: true }) title = '';
  @Input() eyebrow = 'Distribución';
  @Input() subtitle = 'Distribución y comparación por categoría';
  @Input() unit = 'registros';
  @Input() emptyText = 'No hay datos suficientes para esta distribución.';
  // Se conserva para compatibilidad con las vistas existentes; el panel permanece abierto.
  @Input() expanded = true;
  @Input() items: DashboardBreakdownItem[] = [];
  @Input() colors: string[] = [
    '#315d8a', '#5a8fb8', '#77afc7', '#2f766d', '#6b9b71',
    '#90b681', '#c3a44f', '#ca765f', '#765f91', '#58727c',
  ];

  chartData: ChartData<'doughnut', number[], string> = { labels: [], datasets: [{ data: [] }] };
  barChartData: ChartData<'bar', number[], string> = { labels: [], datasets: [{ data: [] }] };

  readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: { duration: 360 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.formattedValue}`,
        },
      },
    },
  };

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 420 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.formattedValue} ${this.unit}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          autoSkip: true,
          maxRotation: 35,
          minRotation: 0,
          maxTicksLimit: 8,
          color: (context) => this.cssColor(context.chart.canvas, '--color-text-secondary', '#5f7064'),
        },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: (context) => this.cssColor(context.chart.canvas, '--color-border', '#e1e5df') },
        ticks: {
          precision: 0,
          color: (context) => this.cssColor(context.chart.canvas, '--color-text-secondary', '#5f7064'),
        },
      },
    },
  };

  get total(): number {
    return this.items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }

  ngOnChanges(): void {
    this.expanded = true;
    const visible = this.chartItems();
    const labels = visible.map((item) => item.label);
    const data = visible.map((item) => item.total);
    const backgroundColor = visible.map((_, index) => this.colorAt(index));

    this.chartData = {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor: 'rgba(255,255,255,.62)',
        borderWidth: 2,
        hoverOffset: 7,
      }],
    };

    this.barChartData = {
      labels,
      datasets: [{
        data,
        backgroundColor,
        borderColor: backgroundColor,
        borderWidth: 1,
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 42,
      }],
    };
  }

  colorAt(index: number): string {
    return this.colors[index % this.colors.length] ?? '#315d8a';
  }

  rankingColor(index: number): string {
    return this.colorAt(index < 8 ? index : 8);
  }

  percentage(value: number): number {
    return this.total > 0 ? Math.round((value / this.total) * 100) : 0;
  }

  private cssColor(canvas: HTMLCanvasElement, variable: string, fallback: string): string {
    return getComputedStyle(canvas).getPropertyValue(variable).trim() || fallback;
  }

  private chartItems(): DashboardBreakdownItem[] {
    if (this.items.length <= 9) return this.items;
    const head = this.items.slice(0, 8);
    const others = this.items.slice(8).reduce((sum, item) => sum + item.total, 0);
    return [...head, { label: 'Otros', total: others }];
  }
}
