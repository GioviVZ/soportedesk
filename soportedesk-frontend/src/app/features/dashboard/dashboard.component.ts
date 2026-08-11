import { Component, HostListener, OnInit, inject, ChangeDetectionStrategy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from './dashboard.service';
import { DashboardCounts } from './dashboard-counts.model';
import { UsuariosRedPorUbicacionChartComponent } from './usuarios-red-por-ubicacion-chart.component';
import { LicenciasPorTipoChartComponent } from './licencias-por-tipo-chart.component';
import { OrdenServicio } from '../herramientas/herramientas.model';
import { ModuloBreakdownItem, ModuloKey } from './modulo-breakdown-item.model';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

interface DashboardCard {
  label: string;
  description: string;
  value: number;
  path: string;
  color: string;
  icon: string;
  category: string;
  metricLabel: string;
  metricValue: number;
  healthLabel: string;
  healthState: 'neutral' | 'success' | 'warning';
  actionLabel: string;
  queryParams?: Record<string, string>;
  modulo: ModuloKey;
}

interface ModuloPill {
  key: ModuloKey;
  label: string;
  color: string;
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
  key: 'ti-key',
  mail: 'ti-mail',
  users: 'ti-users-group',
  lock: 'ti-shield-lock',
  wifi: 'ti-wifi',
  printer: 'ti-printer',
  monitor: 'ti-device-desktop-analytics',
  userX: 'ti-user-exclamation',
};

@Component({
    selector: 'app-dashboard',
    imports: [
        CommonModule,
        RouterLink,
        BaseChartDirective,
        UsuariosRedPorUbicacionChartComponent,
        LicenciasPorTipoChartComponent,
        ClickOutsideDirective,
    ],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  cards: DashboardCard[] = [];
  moduloPills: ModuloPill[] = [];
  totalRegistros = 0;
  usuariosActivos = 0;
  usuariosRedInactivos = 0;
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

  @ViewChildren('pillBtn') pillButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  selectedModulo: ModuloKey | null = null;
  breakdownLoading = false;
  breakdownError = false;
  breakdownItems: ModuloBreakdownItem[] = [];
  breakdownChartData: ChartData<'doughnut', number[], string> | null = null;
  openCardMenu: string | null = null;

  composicionChartData: ChartData<'doughnut', number[], string> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#0b2f6b', '#1554ad', '#304b70'] }],
  };

  volumenChartData: ChartData<'line', number[], string> = {
    labels: [],
    datasets: [{ data: [], label: 'Registros', borderColor: '#1554ad', backgroundColor: 'rgba(21,84,173,.14)', tension: .35, fill: true, pointBackgroundColor: '#0b2f6b' }],
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } },
  };

  breakdownDoughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '58%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true },
      },
    },
  };

  lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true } } },
    scales: {
      x: { grid: { color: '#e1e5df' } },
      y: { beginAtZero: true, grid: { color: '#e1e5df' }, ticks: { precision: 0 } },
    },
  };

  ngOnInit(): void {
    this.load();
  }

  @HostListener('window:soportedesk:data-change', ['$event'])
  onRealtimeChange(_event: Event): void {
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
        this.usuariosRedInactivos = counts.usuariosRedInactivos;
        this.cards = this.toCards(counts);
        this.moduloPills = this.toModuloPills(this.cards);
        this.showUsuariosChart = this.authService.canRead('usuarios-red');
        this.showLicenciasChart = this.authService.canRead('licencias');
        this.showOrdenesServicio = this.authService.canRead('herramientas');
        if (this.showOrdenesServicio) {
          this.loadOrdenesServicio();
        }
        this.priorityItems = this.toPriorityItems(counts);
        this.mixItems = this.toMixItems(counts);
        this.applyOverviewCharts(counts);
        const selectedStillAvailable = this.moduloPills.some((pill) => pill.key === this.selectedModulo);
        const defaultModulo = this.moduloPills.find((pill) => pill.key === 'equipos')?.key
          ?? this.moduloPills[0]?.key
          ?? null;
        this.selectModulo(selectedStillAvailable ? this.selectedModulo : defaultModulo);
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

  private svg(key: string): string {
    return ICONS[key];
  }

  private toModuloPills(cards: DashboardCard[]): ModuloPill[] {
    const seen = new Set<ModuloKey>();
    const pills: ModuloPill[] = [];
    for (const card of cards) {
      if (seen.has(card.modulo)) continue;
      seen.add(card.modulo);
      pills.push({ key: card.modulo, label: card.label, color: card.color });
    }
    return pills;
  }

  toggleCardMenu(cardLabel: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.openCardMenu = this.openCardMenu === cardLabel ? null : cardLabel;
  }

  closeCardMenu(): void {
    this.openCardMenu = null;
  }

  onModuloKeydown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const count = this.moduloPills.length;
    if (!count) return;
    const nextIndex = event.key === 'ArrowRight' ? (index + 1) % count : (index - 1 + count) % count;
    this.selectModulo(this.moduloPills[nextIndex].key);
    queueMicrotask(() => this.pillButtons.get(nextIndex)?.nativeElement.focus());
  }

  selectModulo(modulo: ModuloKey | null): void {
    this.selectedModulo = modulo;
    this.openCardMenu = null;
    if (!modulo) {
      this.breakdownItems = [];
      this.breakdownChartData = null;
      return;
    }

    if (modulo === 'usuarios-red') {
      this.breakdownLoading = false;
      this.breakdownError = false;
      this.applyBreakdown([
        { label: 'Activos', count: this.usuariosActivos },
        { label: 'Inactivos', count: this.usuariosRedInactivos },
      ]);
      return;
    }

    this.breakdownLoading = true;
    this.breakdownError = false;
    this.dashboardService.getModuloBreakdown(modulo).subscribe({
      next: (items) => {
        this.breakdownLoading = false;
        this.applyBreakdown(items);
      },
      error: () => {
        this.breakdownLoading = false;
        this.breakdownError = true;
        this.breakdownItems = [];
        this.breakdownChartData = null;
      },
    });
  }

  private applyBreakdown(items: ModuloBreakdownItem[]): void {
    this.breakdownItems = items;
    const pill = this.moduloPills.find((p) => p.key === this.selectedModulo);
    const color = pill?.color ?? '#0b2f6b';
    const colors = this.selectedModulo === 'equipos'
      ? ['#0b2f6b', '#1554ad', '#6e94c9']
      : this.buildTonalPalette(color, items.length);
    this.breakdownChartData = items.length ? {
      labels: items.map((item) => item.label),
      datasets: [{
        data: items.map((item) => item.count),
        backgroundColor: colors,
        borderColor: 'rgba(255,255,255,.58)',
        borderWidth: 2,
      }],
    } : null;
  }

  get selectedModuloLabel(): string {
    return this.moduloPills.find((pill) => pill.key === this.selectedModulo)?.label ?? 'Desglose';
  }

  get breakdownTotal(): number {
    return this.breakdownItems.reduce((total, item) => total + item.count, 0);
  }

  private buildTonalPalette(base: string, count: number): string[] {
    return Array.from({ length: count }, (_, index) => {
      if (index === 0) return base;
      const step = Math.ceil(index / 2);
      const towardLight = index % 2 === 1;
      const amount = towardLight
        ? Math.min(.2 + step * .12, .78)
        : Math.min(.1 + step * .11, .6);
      return this.mixHex(base, towardLight ? '#ffffff' : '#07172d', amount);
    });
  }

  private mixHex(source: string, target: string, amount: number): string {
    const parse = (value: string): [number, number, number] => [
      Number.parseInt(value.slice(1, 3), 16),
      Number.parseInt(value.slice(3, 5), 16),
      Number.parseInt(value.slice(5, 7), 16),
    ];
    const [sr, sg, sb] = parse(source);
    const [tr, tg, tb] = parse(target);
    return `#${[sr, sg, sb].map((channel, index) => {
      const destination = [tr, tg, tb][index];
      return Math.round(channel + (destination - channel) * amount).toString(16).padStart(2, '0');
    }).join('')}`;
  }

  private toCards(counts: DashboardCounts): DashboardCard[] {
    const cards: DashboardCard[] = [
      {
        label: 'Licencias',
        description: 'Claves y software registrado',
        value: counts.licencias,
        path: '/licencias',
        color: '#173f73',
        icon: this.svg('key'),
        category: 'Software',
        metricLabel: 'Licencias activas',
        metricValue: counts.licencias,
        healthLabel: 'Inventario visible',
        healthState: 'neutral',
        actionLabel: 'Abrir licencias',
        modulo: 'licencias',
      },
      {
        label: 'Correos Institucionales',
        description: 'Cuentas y accesos de correo',
        value: counts.correos,
        path: '/correos',
        color: '#234f8b',
        icon: this.svg('mail'),
        category: 'Comunicaciones',
        metricLabel: 'Cuentas registradas',
        metricValue: counts.correos,
        healthLabel: 'Directorio de correos',
        healthState: 'neutral',
        actionLabel: 'Abrir correos',
        modulo: 'correos',
      },
      {
        label: 'Usuarios de Red/AD',
        description: 'Cuentas activas e historicas',
        value: counts.usuariosRed,
        path: '/usuarios-red/consultas',
        color: '#0b5aa7',
        icon: this.svg('users'),
        category: 'Active Directory',
        metricLabel: 'Usuarios activos',
        metricValue: this.usuariosActivos,
        healthLabel: counts.usuariosRedPorVencer > 0
          ? `${counts.usuariosRedPorVencer} contratos por vencer`
          : counts.usuariosRedInactivos > 0
            ? `${counts.usuariosRedInactivos} inactivos`
            : 'Sin alertas',
        healthState: counts.usuariosRedPorVencer > 0 || counts.usuariosRedInactivos > 0 ? 'warning' : 'success',
        actionLabel: 'Buscar usuarios',
        modulo: 'usuarios-red',
      },
      {
        label: 'VPN',
        description: 'Credenciales de acceso remoto',
        value: counts.vpn,
        path: '/vpn',
        color: '#102f63',
        icon: this.svg('lock'),
        category: 'Acceso remoto',
        metricLabel: 'Solicitudes pendientes',
        metricValue: counts.vpnPendientes,
        healthLabel: counts.vpnPendientes > 0 ? 'Requiere atencion' : 'Sin pendientes',
        healthState: counts.vpnPendientes > 0 ? 'warning' : 'success',
        actionLabel: 'Gestionar VPN',
        modulo: 'vpn',
      },
      {
        label: 'Claves WiFi',
        description: 'Redes y claves administradas',
        value: counts.wifi,
        path: '/wifi',
        color: '#15618f',
        icon: this.svg('wifi'),
        category: 'Conectividad',
        metricLabel: 'Redes registradas',
        metricValue: counts.wifi,
        healthLabel: 'Claves administradas',
        healthState: 'neutral',
        actionLabel: 'Abrir WiFi',
        modulo: 'wifi',
      },
      {
        label: 'Impresoras',
        description: 'Equipos de impresion registrados',
        value: counts.impresoras,
        path: '/impresoras',
        color: '#304b70',
        icon: this.svg('printer'),
        category: 'Perifericos',
        metricLabel: 'Impresoras registradas',
        metricValue: counts.impresoras,
        healthLabel: 'Inventario de impresion',
        healthState: 'neutral',
        actionLabel: 'Abrir impresoras',
        modulo: 'impresoras',
      },
      {
        label: 'Inventario de Equipos',
        description: 'Inventario operativo asignado',
        value: counts.equipos,
        path: '/equipos',
        color: '#0b2f6b',
        icon: this.svg('monitor'),
        category: 'Infraestructura',
        metricLabel: 'Equipos asignados',
        metricValue: counts.equipos,
        healthLabel: 'Inventario operativo',
        healthState: 'success',
        actionLabel: 'Abrir equipos',
        modulo: 'equipos',
      },
    ];

    if (this.authService.canWrite('usuarios-red')) {
      cards.push({
        label: 'Usuarios Desactivados',
        description: 'Cuentas marcadas como inactivas',
        value: counts.usuariosRedInactivos,
        path: '/usuarios-red/dashboard',
        color: '#0b5aa7',
        icon: this.svg('userX'),
        category: 'Alertas AD',
        metricLabel: 'Cuentas por revisar',
        metricValue: counts.usuariosRedInactivos,
        healthLabel: counts.usuariosRedInactivos > 0 ? 'Revisar estado' : 'Sin alertas',
        healthState: counts.usuariosRedInactivos > 0 ? 'warning' : 'success',
        actionLabel: 'Ver desactivados',
        modulo: 'usuarios-red',
      });
    }

    return cards.filter((card) => this.canOpen(card.path));
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
        label: 'Contratos de usuarios por vencer',
        value: counts.usuariosRedPorVencer,
        detail: vencimiento
          ? `${counts.usuariosRedPorVencer} en los próximos 30 días · ${this.vencimientoDetail(vencimiento, diasRestantes)}`
          : 'Sin contratos por vencer en los próximos 30 días',
        path: '/usuarios-red/consultas',
        state: counts.usuariosRedPorVencer > 0 ? 'warning' : 'success',
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

  private vencimientoDetail(value: string, diasRestantes: number | null): string {
    const [year, month, day] = value.split('-');
    const fecha = year && month && day ? `${day}/${month}/${year}` : value;
    if (diasRestantes === 0) return `Vence hoy · ${fecha}`;
    if (diasRestantes === 1) return `Vence mañana · ${fecha}`;
    return diasRestantes !== null ? `Faltan ${diasRestantes} días · ${fecha}` : `Vence ${fecha}`;
  }

  private toMixItems(counts: DashboardCounts): MixItem[] {
    const raw = [
      { label: 'Accesos', value: this.sumAllowed([['licencias', counts.licencias], ['correos', counts.correos], ['usuarios-red', counts.usuariosRed], ['vpn', counts.vpn], ['wifi', counts.wifi]]), color: '#0b2f6b' },
      { label: 'Infraestructura', value: this.sumAllowed([['impresoras', counts.impresoras], ['equipos', counts.equipos]]), color: '#1554ad' },
      { label: 'Alertas', value: this.sumAllowed([['usuarios-red', counts.usuariosRedInactivos + counts.usuariosRedPorVencer]]) + (this.authService.canWrite('aprobar-vpn') ? counts.vpnPendientes : 0), color: '#304b70' },
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
    const alertas = this.sumAllowed([['usuarios-red', counts.usuariosRedInactivos + counts.usuariosRedPorVencer]]) + (this.authService.canWrite('aprobar-vpn') ? counts.vpnPendientes : 0);

    this.composicionChartData = {
      labels: ['Accesos', 'Infraestructura', 'Alertas'],
      datasets: [{
        data: [accesos, infraestructura, alertas],
        backgroundColor: ['#0b2f6b', '#1554ad', '#304b70'],
        borderColor: 'rgba(255,255,255,.58)',
        borderWidth: 2,
        hoverOffset: 7,
      }],
    };

    const rows = this.cards.filter((card) => card.value > 0);
    this.volumenChartData = {
      labels: rows.map((card) => card.label),
      datasets: [{
        data: rows.map((card) => card.value),
        label: 'Registros',
        borderColor: '#1554ad',
        backgroundColor: 'rgba(21,84,173,.14)',
        tension: .35,
        fill: true,
        pointBackgroundColor: '#0b2f6b',
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

  administrationPath(card: DashboardCard): string | null {
    const paths: Partial<Record<ModuloKey, string>> = {
      licencias: '/licencias/administracion',
      'usuarios-red': '/usuarios-red/administracion',
      vpn: '/vpn/administracion',
      wifi: '/wifi/administracion',
      impresoras: '/impresoras/administracion',
      equipos: '/equipos/mantenimiento',
    };

    const hasAccess = card.modulo === 'vpn'
      ? this.authService.isAdmin()
        || this.authService.canWrite('solicitar-vpn')
        || this.authService.canWrite('aprobar-vpn')
      : this.authService.canWrite(card.modulo);

    return hasAccess ? paths[card.modulo] ?? null : null;
  }

  moduleDashboardPath(card: DashboardCard): string | null {
    const paths: Partial<Record<ModuloKey, string>> = {
      licencias: '/licencias/dashboard',
      correos: '/correos/dashboard',
      'usuarios-red': '/usuarios-red/dashboard',
      vpn: '/vpn/dashboard',
      wifi: '/wifi/dashboard',
      impresoras: '/impresoras/dashboard',
      equipos: '/equipos/dashboard',
    };

    const hasAccess = card.modulo === 'correos'
      ? this.authService.canRead('correos')
      : card.modulo === 'vpn'
        ? this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn')
        : this.authService.canWrite(card.modulo);

    return hasAccess ? paths[card.modulo] ?? null : null;
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
