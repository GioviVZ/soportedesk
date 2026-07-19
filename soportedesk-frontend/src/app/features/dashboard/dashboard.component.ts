import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from './dashboard.service';
import { DashboardCounts } from './dashboard-counts.model';
import { UsuariosRedPorUbicacionChartComponent } from './usuarios-red-por-ubicacion-chart.component';
import { LicenciasPorTipoChartComponent } from './licencias-por-tipo-chart.component';
import { RealtimeChange } from '../../core/services/realtime.service';
import { OrdenServicio } from '../herramientas/herramientas.model';

interface DashboardCard {
  label: string;
  description: string;
  value: number;
  path: string;
  color: string;
  icon: SafeHtml;
  category: string;
  metricLabel: string;
  metricValue: number;
  healthLabel: string;
  healthState: 'neutral' | 'success' | 'warning';
  actionLabel: string;
  queryParams?: Record<string, string>;
}

interface SummaryMetric {
  label: string;
  value: number;
  detail: string;
  path?: string;
  queryParams?: Record<string, string>;
  state?: 'neutral' | 'success' | 'warning';
}

interface PriorityItem {
  label: string;
  value: number | string;
  detail: string;
  path?: string;
  state: 'success' | 'warning' | 'neutral';
  valueKind?: 'date';
}

interface MixItem {
  label: string;
  value: number;
  percent: number;
  color: string;
}

const ICONS: Record<string, string> = {
  key: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  wifi: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  printer: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
  monitor: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  userX: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg>`,
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, UsuariosRedPorUbicacionChartComponent, LicenciasPorTipoChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  cards: DashboardCard[] = [];
  summaryMetrics: SummaryMetric[] = [];
  totalRegistros = 0;
  usuariosActivos = 0;
  showUsuariosChart = false;
  showLicenciasChart = false;
  showOrdenesServicio = false;
  ordenesServicio: OrdenServicio[] = [];
  ordenesLoading = false;
  priorityItems: PriorityItem[] = [];
  mixItems: MixItem[] = [];
  loading = false;
  error = false;
  updatedAt: Date | null = null;

  composicionChartData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#5d87ff', '#13deb9', '#ffae1f'] }],
  };

  volumenChartData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Registros', borderColor: '#5d87ff', backgroundColor: 'rgba(93,135,255,.16)', tension: .35, fill: true, pointBackgroundColor: '#5d87ff' }],
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

  @HostListener('window:soportedesk:data-change', ['$event'])
  onRealtimeChange(_event: CustomEvent<RealtimeChange>): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = false;
    this.dashboardService.getCounts().subscribe({
      next: (counts) => {
        this.loading = false;
        this.updatedAt = new Date();
        this.totalRegistros = this.totalAllowedRecords(counts);
        this.usuariosActivos = Math.max(counts.usuariosRed - counts.usuariosRedInactivos, 0);
        this.cards = this.toCards(counts);
        this.showUsuariosChart = this.authService.canRead('usuarios-red');
        this.showLicenciasChart = this.authService.canRead('licencias');
        this.showOrdenesServicio = this.authService.canRead('herramientas');
        if (this.showOrdenesServicio) {
          this.loadOrdenesServicio();
        }
        this.summaryMetrics = this.toSummaryMetrics(counts);
        this.priorityItems = this.toPriorityItems(counts);
        this.mixItems = this.toMixItems(counts);
        this.applyOverviewCharts(counts);
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  ordenEstado(orden: OrdenServicio): string {
    if (orden.diasRestantes > 1) return `Faltan ${orden.diasRestantes} días`;
    if (orden.diasRestantes === 1) return 'Falta 1 día';
    if (orden.diasRestantes === 0) return 'Vence hoy';
    if (orden.diasRestantes === -1) return 'Venció ayer';
    return `Vencida hace ${Math.abs(orden.diasRestantes)} días`;
  }

  ordenEstadoClass(orden: OrdenServicio): 'ok' | 'warn' | 'bad' {
    if (orden.diasRestantes < 0) return 'bad';
    if (orden.diasRestantes <= 5) return 'warn';
    return 'ok';
  }

  ordenConteoValor(orden: OrdenServicio): number {
    return Math.abs(orden.diasRestantes);
  }

  ordenUnidadDias(orden: OrdenServicio): string {
    return this.ordenConteoValor(orden) === 1 ? 'día' : 'días';
  }

  ordenSemaforo(orden: OrdenServicio): string {
    const estado = this.ordenEstadoClass(orden);
    if (estado === 'bad') return 'Vencida';
    if (estado === 'warn') return 'Por vencer';
    return 'En plazo';
  }

  private loadOrdenesServicio(): void {
    this.ordenesLoading = true;
    this.dashboardService.getOrdenesServicio().subscribe({
      next: (ordenes) => {
        this.ordenesServicio = ordenes;
        this.ordenesLoading = false;
      },
      error: () => {
        this.ordenesServicio = [];
        this.ordenesLoading = false;
      },
    });
  }

  private svg(key: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[key]);
  }

  private toCards(counts: DashboardCounts): DashboardCard[] {
    const cards: DashboardCard[] = [
      {
        label: 'Licencias',
        description: 'Claves y software registrado',
        value: counts.licencias,
        path: '/licencias',
        color: '#5d87ff',
        icon: this.svg('key'),
        category: 'Software',
        metricLabel: 'Licencias activas',
        metricValue: counts.licencias,
        healthLabel: 'Inventario visible',
        healthState: 'neutral',
        actionLabel: 'Abrir licencias',
      },
      {
        label: 'Correos Institucionales',
        description: 'Cuentas y accesos de correo',
        value: counts.correos,
        path: '/correos',
        color: '#8754ec',
        icon: this.svg('mail'),
        category: 'Comunicaciones',
        metricLabel: 'Cuentas registradas',
        metricValue: counts.correos,
        healthLabel: 'Directorio de correos',
        healthState: 'neutral',
        actionLabel: 'Abrir correos',
      },
      {
        label: 'Usuarios de Red/AD',
        description: 'Cuentas activas e historicas',
        value: counts.usuariosRed,
        path: '/usuarios-red/consultas',
        color: '#ffae1f',
        icon: this.svg('users'),
        category: 'Active Directory',
        metricLabel: 'Usuarios activos',
        metricValue: this.usuariosActivos,
        healthLabel: counts.usuariosRedInactivos > 0 ? `${counts.usuariosRedInactivos} inactivos` : 'Sin inactivos',
        healthState: counts.usuariosRedInactivos > 0 ? 'warning' : 'success',
        actionLabel: 'Buscar usuarios',
      },
      {
        label: 'VPN',
        description: 'Credenciales de acceso remoto',
        value: counts.vpn,
        path: '/vpn',
        color: '#fa896b',
        icon: this.svg('lock'),
        category: 'Acceso remoto',
        metricLabel: 'Solicitudes pendientes',
        metricValue: counts.vpnPendientes,
        healthLabel: counts.vpnPendientes > 0 ? 'Requiere atencion' : 'Sin pendientes',
        healthState: counts.vpnPendientes > 0 ? 'warning' : 'success',
        actionLabel: 'Gestionar VPN',
      },
      {
        label: 'Claves WiFi',
        description: 'Redes y claves administradas',
        value: counts.wifi,
        path: '/wifi',
        color: '#44b7f7',
        icon: this.svg('wifi'),
        category: 'Conectividad',
        metricLabel: 'Redes registradas',
        metricValue: counts.wifi,
        healthLabel: 'Claves administradas',
        healthState: 'neutral',
        actionLabel: 'Abrir WiFi',
      },
      {
        label: 'Impresoras',
        description: 'Equipos de impresion registrados',
        value: counts.impresoras,
        path: '/impresoras',
        color: '#7c8fac',
        icon: this.svg('printer'),
        category: 'Perifericos',
        metricLabel: 'Impresoras registradas',
        metricValue: counts.impresoras,
        healthLabel: 'Inventario de impresion',
        healthState: 'neutral',
        actionLabel: 'Abrir impresoras',
      },
      {
        label: 'Inventario de Equipos',
        description: 'Inventario operativo asignado',
        value: counts.equipos,
        path: '/equipos',
        color: '#13deb9',
        icon: this.svg('monitor'),
        category: 'Infraestructura',
        metricLabel: 'Equipos asignados',
        metricValue: counts.equipos,
        healthLabel: 'Inventario operativo',
        healthState: 'success',
        actionLabel: 'Abrir equipos',
      },
    ];

    if (this.authService.canWrite('usuarios-red')) {
      cards.push({
        label: 'Usuarios Desactivados',
        description: 'Cuentas marcadas como inactivas',
        value: counts.usuariosRedInactivos,
        path: '/usuarios-red/dashboard',
        color: '#ffae1f',
        icon: this.svg('userX'),
        category: 'Alertas AD',
        metricLabel: 'Cuentas por revisar',
        metricValue: counts.usuariosRedInactivos,
        healthLabel: counts.usuariosRedInactivos > 0 ? 'Revisar estado' : 'Sin alertas',
        healthState: counts.usuariosRedInactivos > 0 ? 'warning' : 'success',
        actionLabel: 'Ver desactivados',
      });
    }

    return cards.filter((card) => this.canOpen(card.path));
  }

  private toSummaryMetrics(counts: DashboardCounts): SummaryMetric[] {
    const accesos = this.sumAllowed([
      ['licencias', counts.licencias],
      ['correos', counts.correos],
      ['usuarios-red', counts.usuariosRed],
      ['vpn', counts.vpn],
      ['wifi', counts.wifi],
    ]);
    const infraestructura = this.sumAllowed([
      ['impresoras', counts.impresoras],
      ['equipos', counts.equipos],
    ]);

    const metrics: SummaryMetric[] = [
      {
        label: 'Registros totales',
        value: this.totalRegistros,
        detail: 'Inventario general del sistema',
        state: 'neutral',
      },
      {
        label: 'Accesos gestionados',
        value: accesos,
        detail: 'Licencias, correos, red, VPN y WiFi',
        state: 'success',
      },
      {
        label: 'Infraestructura',
        value: infraestructura,
        detail: 'Equipos asignados e impresoras',
        state: 'neutral',
      },
    ];

    if (this.authService.canWrite('usuarios-red')) {
      metrics.push({
        label: 'Usuarios activos',
        value: this.usuariosActivos,
        detail: `${counts.usuariosRedInactivos} usuarios desactivados`,
        path: '/usuarios-red/dashboard',
        state: counts.usuariosRedInactivos > 0 ? 'warning' : 'success',
      });
    }

    if (this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn')) {
      metrics.push({
        label: 'Solicitudes VPN pendientes',
        value: counts.vpnPendientes,
        detail: 'Esperando verificacion y aprobacion',
        path: '/vpn/administracion',
        state: counts.vpnPendientes > 0 ? 'warning' : 'success',
      });
    }

    return metrics;
  }

  private toPriorityItems(counts: DashboardCounts): PriorityItem[] {
    const items: PriorityItem[] = [];

    if (this.authService.canWrite('aprobar-vpn')) {
      items.push({
        label: 'Solicitudes VPN pendientes',
        value: counts.vpnPendientes,
        detail: counts.vpnPendientes > 0 ? 'Requieren verificacion y aprobacion' : 'Sin solicitudes por resolver',
        path: '/vpn/administracion',
        state: counts.vpnPendientes > 0 ? 'warning' : 'success',
      });
    }

    if (this.authService.canRead('usuarios-red')) {
      const vencimiento = counts.proximoVencimientoUsuarioRed;
      const diasRestantes = this.daysUntil(vencimiento);
      items.push({
        label: 'Vencimiento de usuarios de red',
        value: vencimiento ? this.formatCompactDate(vencimiento) : '—',
        detail: vencimiento ? this.vencimientoDetail(vencimiento, diasRestantes) : 'Sin fechas futuras registradas',
        path: '/usuarios-red/consultas',
        state: diasRestantes !== null && diasRestantes <= 30 ? 'warning' : 'neutral',
        valueKind: 'date',
      });
    }

    if (this.authService.canRead('licencias')) {
      items.push({
        label: 'Inventario de licencias',
        value: counts.licencias,
        detail: 'Claves y software bajo seguimiento',
        path: '/licencias',
        state: 'neutral',
      });
    }

    return items.slice(0, 3);
  }

  private daysUntil(value: string | null): number | null {
    if (!value) return null;
    const target = new Date(`${value}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
  }

  private formatCompactDate(value: string): string {
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}` : value;
  }

  private vencimientoDetail(value: string, diasRestantes: number | null): string {
    const [year, month, day] = value.split('-');
    const fecha = year && month && day ? `${day}/${month}/${year}` : value;
    if (diasRestantes === 0) return `Vence hoy · ${fecha}`;
    if (diasRestantes === 1) return `Vence mañana · ${fecha}`;
    return diasRestantes !== null ? `Faltan ${diasRestantes} días · ${fecha}` : `Vence ${fecha}`;
  }

  private toMixItems(counts: DashboardCounts): MixItem[] {
    const raw = [
      { label: 'Accesos', value: this.sumAllowed([['licencias', counts.licencias], ['correos', counts.correos], ['usuarios-red', counts.usuariosRed], ['vpn', counts.vpn], ['wifi', counts.wifi]]), color: '#5d87ff' },
      { label: 'Infraestructura', value: this.sumAllowed([['impresoras', counts.impresoras], ['equipos', counts.equipos]]), color: '#13deb9' },
      { label: 'Alertas', value: this.sumAllowed([['usuarios-red', counts.usuariosRedInactivos]]) + (this.authService.canWrite('aprobar-vpn') ? counts.vpnPendientes : 0), color: '#ffae1f' },
    ].filter((item) => item.value > 0);

    const total = raw.reduce((sum, item) => sum + item.value, 0);
    return raw.map((item) => ({
      ...item,
      percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }

  private applyOverviewCharts(counts: DashboardCounts): void {
    const accesos = this.sumAllowed([['licencias', counts.licencias], ['correos', counts.correos], ['usuarios-red', counts.usuariosRed], ['vpn', counts.vpn], ['wifi', counts.wifi]]);
    const infraestructura = this.sumAllowed([['impresoras', counts.impresoras], ['equipos', counts.equipos]]);
    const alertas = this.sumAllowed([['usuarios-red', counts.usuariosRedInactivos]]) + (this.authService.canWrite('aprobar-vpn') ? counts.vpnPendientes : 0);

    this.composicionChartData = {
      labels: ['Accesos', 'Infraestructura', 'Alertas'],
      datasets: [{ data: [accesos, infraestructura, alertas], backgroundColor: ['#5d87ff', '#13deb9', '#ffae1f'] }],
    };

    const rows = this.cards.filter((card) => card.value > 0);
    this.volumenChartData = {
      labels: rows.map((card) => card.label),
      datasets: [{
        data: rows.map((card) => card.value),
        label: 'Registros',
        borderColor: '#5d87ff',
        backgroundColor: 'rgba(93,135,255,.16)',
        tension: .35,
        fill: true,
        pointBackgroundColor: '#5d87ff',
      }],
    };
  }

  private canOpen(path: string): boolean {
    if (this.authService.isAdmin()) return true;
    if (path.startsWith('/licencias')) return this.authService.canRead('licencias');
    if (path.startsWith('/correos')) return this.authService.canRead('correos');
    if (path.startsWith('/usuarios-red/dashboard')) return this.authService.canWrite('usuarios-red');
    if (path.startsWith('/usuarios-red')) return this.authService.canRead('usuarios-red');
    if (path.startsWith('/vpn')) {
      return this.authService.canRead('vpn')
        || this.authService.canWrite('solicitar-vpn')
        || this.authService.canWrite('aprobar-vpn');
    }
    if (path.startsWith('/wifi')) return this.authService.canRead('wifi');
    if (path.startsWith('/impresoras')) return this.authService.canRead('impresoras');
    if (path.startsWith('/equipos')) return this.authService.canRead('equipos');
    return true;
  }

  private sumAllowed(items: Array<[string, number]>): number {
    return items.reduce((total, [modulo, value]) => total + (this.canReadModulo(modulo) ? value : 0), 0);
  }

  private totalAllowedRecords(counts: DashboardCounts): number {
    return this.sumAllowed([
      ['licencias', counts.licencias],
      ['correos', counts.correos],
      ['usuarios-red', counts.usuariosRed],
      ['vpn', counts.vpn],
      ['wifi', counts.wifi],
      ['impresoras', counts.impresoras],
      ['equipos', counts.equipos],
    ]);
  }

  private canReadModulo(modulo: string): boolean {
    if (modulo === 'vpn') {
      return this.authService.canRead('vpn')
        || this.authService.canWrite('solicitar-vpn')
        || this.authService.canWrite('aprobar-vpn');
    }
    return this.authService.canRead(modulo);
  }
}
