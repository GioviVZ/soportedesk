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
  columns: TableColumn[] = [
    { key: 'titularNombreCompleto', label: 'Nombre' },
    { key: 'titularOrigenLabel', label: 'Origen' },
    { key: 'estadoSolicitud', label: 'Estado solicitud' },
    { key: 'ipAsignada', label: 'IP VPN' },
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
    if (this.activeTab !== 'solicitudes' || !this.solicitudFiltro) return this.items;
    return this.items.filter((v) => v.estadoSolicitud === this.solicitudFiltro);
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

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Vpn): void {
    const nombre = item.usuarioRed?.nombre ?? item.id;
    if (!confirm(`¿Eliminar el registro VPN de "${nombre}"?`)) return;
    this.service.delete(item.id).subscribe(() => this.load());
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
}
