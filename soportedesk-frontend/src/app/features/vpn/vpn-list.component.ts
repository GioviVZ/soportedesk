import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { VpnFormComponent } from './vpn-form.component';
import { VpnAntivirusFormComponent } from './vpn-antivirus-form.component';
import { VpnAprobarFormComponent } from './vpn-aprobar-form.component';
import { VpnResolucionFormComponent } from './vpn-resolucion-form.component';
import { Vpn, VpnKpis } from './vpn.model';
import { VpnService } from './vpn.service';

const EDITABLE_STATES = new Set(['PENDIENTE', 'OBSERVADO']);

type VpnTab = 'todas' | 'solicitudes';
type EstadoSolicitud = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';
type VencimientoFiltro = 'vencidos' | 'porVencer';

@Component({
  selector: 'app-vpn-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    ModalComponent,
    FieldComponent,
    VencimientoBadgeComponent,
    VpnFormComponent,
    VpnAntivirusFormComponent,
    VpnAprobarFormComponent,
    VpnResolucionFormComponent,
  ],
  templateUrl: './vpn-list.component.html',
  styleUrl: './vpn-list.component.scss',
})
export class VpnListComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  activeTab: VpnTab = 'todas';
  kpis: VpnKpis | null = null;
  solicitudFiltro: EstadoSolicitud | null = null;
  vencimientoFiltro: VencimientoFiltro | null = null;
  columns: TableColumn[] = [
    { key: 'titularNombreCompleto', label: 'Nombre' },
    { key: 'titularOrigenLabel', label: 'Origen' },
    { key: 'estadoSolicitud', label: 'Estado solicitud' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Vpn | null = null;
  editing: Vpn | null = null;
  formOpen = false;

  antivirusEditing: Vpn | null = null;
  antivirusOpen = false;

  aprobarEditing: Vpn | null = null;
  aprobarOpen = false;

  resolucionEditing: Vpn | null = null;
  resolucionModo: 'RECHAZAR' | 'OBSERVAR' = 'RECHAZAR';
  resolucionOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get canWriteSolicitar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn');
  }

  get canWriteAprobar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn');
  }

  get canEditCredenciales(): boolean {
    if (this.authService.isAdmin() || this.authService.canWrite('credenciales-vpn')) return true;
    return this.viewing?.solicitadoPor === this.authService.getUsername();
  }

  get displayedItems(): Vpn[] {
    let result = this.items;
    if (this.activeTab === 'solicitudes' && this.solicitudFiltro) {
      result = result.filter((v) => v.estadoSolicitud === this.solicitudFiltro);
    }
    if (this.vencimientoFiltro) {
      result = result.filter((v) => this.vencimientoStatus(v) === this.vencimientoFiltro);
    }
    return result;
  }

  get kpiCards(): { label: string; value: number; estado: EstadoSolicitud; tone: string }[] {
    const k = this.kpis;
    return [
      { label: 'Pendientes', value: k?.pendientes ?? 0, estado: 'PENDIENTE', tone: 'orange' },
      { label: 'Aprobadas', value: k?.aprobadas ?? 0, estado: 'APROBADO', tone: 'green' },
      { label: 'Rechazadas', value: k?.rechazadas ?? 0, estado: 'RECHAZADO', tone: 'red' },
      { label: 'Observadas', value: k?.observadas ?? 0, estado: 'OBSERVADO', tone: 'yellow' },
    ];
  }

  get vencimientoCards(): { label: string; value: number; filtro: VencimientoFiltro; tone: string; detail: string }[] {
    return [
      {
        label: 'Vencidos',
        value: this.items.filter((v) => this.vencimientoStatus(v) === 'vencidos').length,
        filtro: 'vencidos',
        tone: 'red',
        detail: 'Fecha vencida',
      },
      {
        label: 'Por vencer',
        value: this.items.filter((v) => this.vencimientoStatus(v) === 'porVencer').length,
        filtro: 'porVencer',
        tone: 'yellow',
        detail: 'Dentro de 30 dias',
      },
    ];
  }

  get totalSolicitudes(): number {
    return this.items.length;
  }

  ngOnInit(): void {
    this.load();
    this.loadKpis();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  setTab(tab: VpnTab): void {
    this.activeTab = tab;
  }

  setFiltro(estado: EstadoSolicitud): void {
    this.solicitudFiltro = this.solicitudFiltro === estado ? null : estado;
  }

  setVencimientoFiltro(filtro: VencimientoFiltro): void {
    this.vencimientoFiltro = this.vencimientoFiltro === filtro ? null : filtro;
  }

  loadKpis(): void {
    this.service.getKpis().subscribe((data) => (this.kpis = data));
  }

  onView(item: Vpn): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Vpn): void {
    if (!EDITABLE_STATES.has(item.estadoSolicitud)) {
      alert('Esta solicitud ya fue resuelta y no se puede editar.');
      return;
    }
    this.editing = item;
    this.formOpen = true;
  }

  editFromDetail(item: Vpn): void {
    this.viewing = null;
    this.onEdit(item);
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Vpn): void {
    const nombre = item.usuarioRed?.nombre ?? item.id;
    if (!confirm(`¿Eliminar el registro VPN de "${nombre}"?`)) return;
    this.service.delete(item.id).subscribe(() => this.load());
  }

  deleteFromDetail(item: Vpn): void {
    this.viewing = null;
    this.onDelete(item);
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
    this.loadKpis();
  }

  openAntivirus(item: Vpn): void {
    this.viewing = null;
    this.antivirusEditing = item;
    this.antivirusOpen = true;
  }

  closeAntivirus(): void {
    this.antivirusOpen = false;
  }

  onAntivirusSaved(): void {
    this.antivirusOpen = false;
    this.load();
  }

  openAprobar(item: Vpn): void {
    this.viewing = null;
    this.aprobarEditing = item;
    this.aprobarOpen = true;
  }

  closeAprobar(): void {
    this.aprobarOpen = false;
  }

  onAprobarSaved(): void {
    this.aprobarOpen = false;
    this.load();
    this.loadKpis();
  }

  openResolucion(item: Vpn, modo: 'RECHAZAR' | 'OBSERVAR'): void {
    this.viewing = null;
    this.resolucionEditing = item;
    this.resolucionModo = modo;
    this.resolucionOpen = true;
  }

  closeResolucion(): void {
    this.resolucionOpen = false;
  }

  onResolucionSaved(): void {
    this.resolucionOpen = false;
    this.load();
    this.loadKpis();
  }

  antivirusLabel(vpn: Vpn | null): string {
    if (!vpn || vpn.tieneAntivirus === null || vpn.tieneAntivirus === undefined) return '—';
    return vpn.tieneAntivirus ? 'Sí' : 'No';
  }

  boolLabel(value: boolean | null | undefined): string {
    if (value === null || value === undefined) return 'No registrado';
    return value ? 'Si' : 'No';
  }

  estadoTone(estado: EstadoSolicitud | string | null | undefined): string {
    return (estado ?? 'PENDIENTE').toString().toLowerCase();
  }

  vencimientoFuente(vpn: Vpn): string {
    return vpn.tipoEquipo === 'INIA' ? 'Antivirus institucional' : 'Antivirus del equipo personal';
  }

  antivirusOrigenLabel(vpn: Vpn): string {
    return vpn.tipoEquipo === 'INIA' ? 'Antivirus institucional' : 'Antivirus personal';
  }

  antivirusOrigenValor(vpn: Vpn): string {
    if (vpn.tipoEquipo === 'INIA') return 'Configuracion institucional';
    return vpn.vencimientoAntivirus ? 'Registrado en la solicitud' : 'Sin fecha registrada';
  }

  fechaBaseAntivirus(vpn: Vpn): string {
    if (vpn.tipoEquipo === 'INIA') return vpn.vence || 'Sin fecha institucional';
    return vpn.vencimientoAntivirus || 'Sin fecha registrada';
  }

  private vencimientoStatus(vpn: Vpn): VencimientoFiltro | null {
    if (!vpn.vence) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(vpn.vence);
    fecha.setHours(0, 0, 0, 0);
    const diffDias = (fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDias < 0) return 'vencidos';
    if (diffDias <= 30) return 'porVencer';
    return null;
  }
}
