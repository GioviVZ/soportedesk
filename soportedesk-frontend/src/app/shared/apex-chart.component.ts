import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import ApexCharts from 'apexcharts';

@Component({
  selector: 'app-apex-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<div #chartEl></div>`,
})
export class ApexChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartEl', { static: true }) chartEl!: ElementRef<HTMLElement>;
  @Input({ required: true }) options!: ApexCharts.ApexOptions;

  private chart: ApexCharts | null = null;

  ngAfterViewInit(): void {
    this.chart = new ApexCharts(this.chartEl.nativeElement, this.options);
    this.chart.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['options'] || changes['options'].firstChange || !this.chart) return;
    this.chart.updateOptions(this.options, true, true);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
