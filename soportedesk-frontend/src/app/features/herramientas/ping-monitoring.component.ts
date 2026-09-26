import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import {
  MonitorPing,
  MonitorPingEstadisticas,
  MonitorPingEvent,
  MonitorPingHistorial,
  MonitorPingPunto,
  MonitorPingRequest,
  MonitorPingSalud,
  PingResult,
} from './herramientas.model';
import { HerramientasService } from './herramientas.service';
import { MonitorPingStreamService } from './monitor-ping-stream.service';

type PingView = 'single' | 'monitors';
type MonitorFilter = 'TODOS' | 'ACTIVO' | 'PROBLEMAS' | 'PAUSADO' | 'ARCHIVADO';
type MonitorRange = '15m' | '1h' | '24h' | '7d' | '30d';
type MonitorChartType = 'bar' | 'line';

interface RangeOption {
  id: MonitorRange;
  label: string;
  milliseconds: number;
}

const RANGES: RangeOption[] = [
  { id: '15m', label: '15 min', milliseconds: 15 * 60 * 1000 },
  { id: '1h', label: '1 hora', milliseconds: 60 * 60 * 1000 },
  { id: '24h', label: '24 horas', milliseconds: 24 * 60 * 60 * 1000 },
  { id: '7d', label: '7 días', milliseconds: 7 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: '30 días', milliseconds: 30 * 24 * 60 * 60 * 1000 },
];

@Component({
  selector: 'app-ping-monitoring',
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './ping-monitoring.component.html',
  styleUrl: './ping-monitoring.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PingMonitoringComponent implements OnInit, OnDestroy {
  private service = inject(HerramientasService);
  private stream = inject(MonitorPingStreamService);
  private auth = inject(AuthService);
  private streamSubscription?: Subscription;
  private refreshTimer?: ReturnType<typeof setInterval>;

  readonly ranges = RANGES;
  readonly intervals = [5, 10, 30, 60, 300];

  view: PingView = 'monitors';
  singleHost = '8.8.8.8';
  singleLoading = false;
  singleResult: PingResult | null = null;
  singleError = '';

  monitors: MonitorPing[] = [];
  monitorsLoading = true;
  monitorsError = '';
  search = '';
  filter: MonitorFilter = 'TODOS';
  selectedId: number | null = null;
  history: MonitorPingHistorial | null = null;
  historyLoading = false;
  historyError = '';
  selectedRange: MonitorRange = '1h';
  chartType: MonitorChartType = this.readChartPreference();

  showForm = false;
  editingId: number | null = null;
  form: MonitorPingRequest = this.emptyForm();
  formError = '';
  saving = false;
  operationId: number | null = null;
  feedback = '';

  chartData: ChartData<ChartType, number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Latencia' }],
  };

  chartOptions: ChartConfiguration<ChartType>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    animation: { duration: 260 },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 8, maxRotation: 0 },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 50,
        title: { display: true, text: 'Latencia (ms)' },
        ticks: { callback: (value) => `${value} ms` },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = this.history?.puntos[context.dataIndex];
            if (!point || point.disponibles === 0) return 'Sin respuesta';
            return `Latencia: ${point.latenciaPromedioMs ?? 0} ms · disponibilidad ${point.disponibilidadPorcentaje}%`;
          },
        },
      },
    },
  };

  ngOnInit(): void {
    this.loadMonitors();
    this.streamSubscription = this.stream.events().subscribe((event) => this.applyLiveEvent(event));
    this.refreshTimer = setInterval(() => this.refreshSilently(), 30_000);
  }

  ngOnDestroy(): void {
    this.streamSubscription?.unsubscribe();
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  get canManage(): boolean {
    return this.auth.canWrite('herramientas');
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  get selectedMonitor(): MonitorPing | null {
    return this.monitors.find((monitor) => monitor.id === this.selectedId) ?? null;
  }

  get filteredMonitors(): MonitorPing[] {
    const term = this.search.trim().toLocaleLowerCase('es');
    return this.monitors.filter((monitor) => {
      const matchesTerm = !term
        || monitor.nombre.toLocaleLowerCase('es').includes(term)
        || monitor.host.toLocaleLowerCase('es').includes(term);
      const matchesFilter = this.filter === 'TODOS'
        || (this.filter === 'PROBLEMAS' && ['LATENCIA_ALTA', 'SIN_RESPUESTA'].includes(monitor.salud))
        || (this.filter === 'ACTIVO' && monitor.estado === 'ACTIVO')
        || (this.filter === 'PAUSADO' && monitor.estado === 'PAUSADO')
        || (this.filter === 'ARCHIVADO' && monitor.estado === 'ARCHIVADO');
      return matchesTerm && matchesFilter;
    });
  }

  get activeCount(): number {
    return this.monitors.filter((monitor) => monitor.estado === 'ACTIVO').length;
  }

  get problemCount(): number {
    return this.monitors.filter((monitor) => ['LATENCIA_ALTA', 'SIN_RESPUESTA'].includes(monitor.salud)).length;
  }

  setView(view: PingView): void {
    this.view = view;
    this.feedback = '';
  }

  runSinglePing(): void {
    const host = this.singleHost.trim();
    if (!host) {
      this.singleError = 'Ingresa una IP o dominio para ejecutar la prueba.';
      return;
    }
    this.singleLoading = true;
    this.singleError = '';
    this.singleResult = null;
    this.service.ping(host).subscribe({
      next: (result) => {
        this.singleResult = result;
        this.singleLoading = false;
      },
      error: (error) => {
        this.singleError = this.errorMessage(error, 'No se pudo ejecutar la prueba de ping.');
        this.singleLoading = false;
      },
    });
  }

  loadMonitors(preferredId?: number): void {
    this.monitorsLoading = true;
    this.monitorsError = '';
    this.service.getMonitoresPing().subscribe({
      next: (monitors) => {
        this.monitors = monitors;
        this.monitorsLoading = false;
        const target = preferredId ?? this.selectedId;
        if (target && monitors.some((monitor) => monitor.id === target)) {
          this.selectMonitor(target, false);
        } else if (monitors.length) {
          this.selectMonitor(monitors.find((monitor) => monitor.estado === 'ACTIVO')?.id ?? monitors[0].id);
        } else {
          this.selectedId = null;
          this.history = null;
        }
      },
      error: (error) => {
        this.monitorsLoading = false;
        this.monitorsError = this.errorMessage(error, 'No se pudieron cargar los monitores.');
      },
    });
  }

  selectMonitor(id: number, loadHistory = true): void {
    this.selectedId = id;
    this.feedback = '';
    if (loadHistory) this.loadHistory();
  }

  loadHistory(): void {
    const monitor = this.selectedMonitor;
    if (!monitor) return;
    const range = this.ranges.find((option) => option.id === this.selectedRange) ?? this.ranges[1];
    this.historyLoading = true;
    this.historyError = '';
    this.service.getMonitorPingHistorial(monitor.id, new Date(Date.now() - range.milliseconds)).subscribe({
      next: (history) => {
        if (this.selectedId !== history.monitorId) return;
        this.history = history;
        this.historyLoading = false;
        this.rebuildChart();
      },
      error: (error) => {
        this.historyLoading = false;
        this.historyError = this.errorMessage(error, 'No se pudo cargar el historial del monitor.');
      },
    });
  }

  setRange(range: MonitorRange): void {
    if (this.selectedRange === range) return;
    this.selectedRange = range;
    this.loadHistory();
  }

  setChartType(type: MonitorChartType): void {
    this.chartType = type;
    try {
      localStorage.setItem('soportedesk:monitor-ping-chart', type);
    } catch {
      // La preferencia visual es opcional.
    }
    this.rebuildChart();
  }

  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.formError = '';
    this.showForm = true;
  }

  openEdit(monitor: MonitorPing): void {
    this.editingId = monitor.id;
    this.form = {
      nombre: monitor.nombre,
      host: monitor.host,
      intervaloSegundos: monitor.intervaloSegundos,
    };
    this.formError = '';
    this.showForm = true;
  }

  closeForm(): void {
    if (this.saving) return;
    this.showForm = false;
    this.formError = '';
  }

  saveMonitor(): void {
    const request: MonitorPingRequest = {
      nombre: this.form.nombre.trim(),
      host: this.form.host.trim(),
      intervaloSegundos: Number(this.form.intervaloSegundos),
    };
    if (!request.nombre || !request.host) {
      this.formError = 'Completa el nombre y la IP o dominio.';
      return;
    }

    this.saving = true;
    this.formError = '';
    const operation = this.editingId
      ? this.service.updateMonitorPing(this.editingId, request)
      : this.service.createMonitorPing(request);
    operation.subscribe({
      next: (monitor) => {
        this.saving = false;
        this.showForm = false;
        this.upsertMonitor(monitor);
        this.selectMonitor(monitor.id);
        this.feedback = this.editingId ? 'Monitor actualizado.' : 'Monitor creado y ejecutándose en el servidor.';
      },
      error: (error) => {
        this.saving = false;
        this.formError = this.errorMessage(error, 'No se pudo guardar el monitor.');
      },
    });
  }

  changeState(monitor: MonitorPing, action: 'pausar' | 'reanudar' | 'archivar'): void {
    this.operationId = monitor.id;
    this.feedback = '';
    this.service.setMonitorPingEstado(monitor.id, action).subscribe({
      next: (updated) => {
        this.operationId = null;
        this.upsertMonitor(updated);
        const messages = {
          pausar: 'Monitoreo pausado. Su historial se conserva.',
          reanudar: 'Monitoreo reanudado en el servidor.',
          archivar: 'Monitor archivado. Puedes reanudarlo cuando lo necesites.',
        };
        this.feedback = messages[action];
      },
      error: (error) => {
        this.operationId = null;
        this.feedback = this.errorMessage(error, 'No se pudo cambiar el estado del monitor.');
      },
    });
  }

  deleteMonitor(monitor: MonitorPing): void {
    if (!this.isAdmin) return;
    const advertenciaEstado = monitor.estado !== 'ARCHIVADO'
      ? ' El monitoreo se detendrá de inmediato.'
      : '';
    if (!window.confirm(`Eliminar definitivamente "${monitor.nombre}" y todo su historial?${advertenciaEstado}`)) return;
    this.operationId = monitor.id;
    this.service.deleteMonitorPing(monitor.id).subscribe({
      next: () => {
        this.operationId = null;
        this.monitors = this.monitors.filter((item) => item.id !== monitor.id);
        this.selectedId = null;
        this.history = null;
        if (this.monitors.length) this.selectMonitor(this.monitors[0].id);
        this.feedback = 'Monitor eliminado definitivamente.';
      },
      error: (error) => {
        this.operationId = null;
        this.feedback = this.errorMessage(error, 'No se pudo eliminar el monitor.');
      },
    });
  }

  exportCsv(): void {
    const monitor = this.selectedMonitor;
    const history = this.history;
    if (!monitor || !history?.puntos.length) return;
    const rows = [
      ['Fecha', 'Latencia promedio (ms)', 'Latencia mínima (ms)', 'Latencia máxima (ms)', 'Disponibilidad (%)', 'Muestras'],
      ...history.puntos.map((point) => [
        point.fecha,
        point.latenciaPromedioMs ?? '',
        point.latenciaMinimaMs ?? '',
        point.latenciaMaximaMs ?? '',
        point.disponibilidadPorcentaje,
        point.muestras,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ping-${monitor.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${this.selectedRange}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  statusLabel(salud: MonitorPingSalud): string {
    return {
      PENDIENTE: 'Preparando',
      DISPONIBLE: 'Disponible',
      LATENCIA_ALTA: 'Latencia alta',
      SIN_RESPUESTA: 'Sin respuesta',
      PAUSADO: 'Pausado',
      ARCHIVADO: 'Archivado',
    }[salud];
  }

  statusClass(salud: MonitorPingSalud): string {
    return salud.toLowerCase().replace('_', '-');
  }

  trackMonitor(_index: number, monitor: MonitorPing): number {
    return monitor.id;
  }

  private refreshSilently(): void {
    this.service.getMonitoresPing().subscribe({
      next: (monitors) => {
        this.monitors = monitors;
        if (this.selectedId && !monitors.some((monitor) => monitor.id === this.selectedId)) {
          this.selectedId = monitors[0]?.id ?? null;
        }
      },
    });
  }

  private applyLiveEvent(event: MonitorPingEvent): void {
    const current = this.monitors.find((monitor) => monitor.id === event.monitorId);
    if (current) {
      this.upsertMonitor({
        ...current,
        salud: event.salud,
        ultimaMedicion: event.fecha,
        ultimaDisponible: event.disponible,
        ultimaLatenciaMs: event.latenciaMs,
        fallosConsecutivos: event.disponible ? 0 : current.fallosConsecutivos + 1,
        totalMuestras: event.totalMuestras,
        totalFallidas: event.totalFallidas,
        perdidaPorcentaje: event.perdidaPorcentaje,
      });
    }
    if (this.selectedId !== event.monitorId || !this.history) return;

    const range = this.ranges.find((option) => option.id === this.selectedRange) ?? this.ranges[1];
    const cutoff = Date.now() - range.milliseconds;
    const point: MonitorPingPunto = {
      fecha: event.fecha,
      latenciaPromedioMs: event.latenciaMs,
      latenciaMinimaMs: event.latenciaMs,
      latenciaMaximaMs: event.latenciaMs,
      disponibilidadPorcentaje: event.disponible ? 100 : 0,
      muestras: 1,
      disponibles: event.disponible ? 1 : 0,
    };
    const points = [...this.history.puntos, point]
      .filter((item) => new Date(item.fecha).getTime() >= cutoff)
      .slice(-500);
    this.history = {
      ...this.history,
      hasta: event.fecha,
      puntos: points,
      estadisticas: this.calculateStatistics(points),
    };
    this.rebuildChart();
  }

  private rebuildChart(): void {
    const points = this.history?.puntos ?? [];
    const colors = points.map((point) => {
      if (point.disponibles === 0) return '#c2413b';
      if ((point.latenciaPromedioMs ?? 0) > 150) return '#d97706';
      if ((point.latenciaPromedioMs ?? 0) > 80) return '#c59a2e';
      return '#16815d';
    });
    const labels = points.map((point) => this.formatChartDate(point.fecha));
    const data = points.map((point) => point.disponibles === 0 ? 0 : (point.latenciaPromedioMs ?? 0));

    this.chartData = {
      labels,
      datasets: [{
        data,
        label: 'Latencia',
        borderColor: '#1554ad',
        backgroundColor: this.chartType === 'bar' ? colors : 'rgba(21, 84, 173, .14)',
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        borderWidth: 2,
        pointRadius: points.length > 120 ? 0 : 3,
        pointHoverRadius: 5,
        tension: 0.28,
        fill: this.chartType === 'line',
        maxBarThickness: 18,
        minBarLength: 3,
      }],
    };
  }

  private formatChartDate(value: string): string {
    const date = new Date(value);
    if (this.selectedRange === '7d' || this.selectedRange === '30d') {
      return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit' }).format(date);
    }
    return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
  }

  private calculateStatistics(points: MonitorPingPunto[]): MonitorPingEstadisticas {
    const muestras = points.reduce((sum, point) => sum + point.muestras, 0);
    const disponibles = points.reduce((sum, point) => sum + point.disponibles, 0);
    const values = points
      .filter((point) => point.latenciaPromedioMs !== null)
      .map((point) => point.latenciaPromedioMs as number);
    const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) * 10 / values.length) / 10 : null;
    const availability = muestras ? Math.round(disponibles * 1000 / muestras) / 10 : 0;
    return {
      muestras,
      disponibles,
      latenciaPromedioMs: average,
      latenciaMinimaMs: values.length ? Math.min(...values) : null,
      latenciaMaximaMs: values.length ? Math.max(...values) : null,
      disponibilidadPorcentaje: availability,
      perdidaPorcentaje: muestras ? Math.round((100 - availability) * 10) / 10 : 0,
    };
  }

  private upsertMonitor(monitor: MonitorPing): void {
    const index = this.monitors.findIndex((item) => item.id === monitor.id);
    if (index < 0) {
      this.monitors = [...this.monitors, monitor].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      return;
    }
    this.monitors = this.monitors.map((item) => item.id === monitor.id ? monitor : item);
  }

  private emptyForm(): MonitorPingRequest {
    return { nombre: '', host: '', intervaloSegundos: 10 };
  }

  private readChartPreference(): MonitorChartType {
    try {
      return localStorage.getItem('soportedesk:monitor-ping-chart') === 'bar' ? 'bar' : 'line';
    } catch {
      return 'line';
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    const httpError = error as HttpErrorResponse;
    const message = httpError?.error?.message || httpError?.error?.detail;
    return typeof message === 'string' && message.trim() ? message : fallback;
  }
}
