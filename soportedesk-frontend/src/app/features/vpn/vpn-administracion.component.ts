import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { VpnAntivirusFormComponent } from './vpn-antivirus-form.component';
import { VpnAprobarFormComponent } from './vpn-aprobar-form.component';
import { VpnResolucionFormComponent } from './vpn-resolucion-form.component';
import { VpnDetailComponent } from './vpn-detail.component';
import { Vpn, VpnKpis } from './vpn.model';
import { VpnService } from './vpn.service';

type EstadoSolicitud = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';

@Component({
  selector: 'app-vpn-administracion',
  standalone: true,
  imports: [
    CommonModule, GenericTableComponent, ModalComponent, StatusBadgeComponent, VencimientoBadgeComponent,
    VpnAntivirusFormComponent, VpnAprobarFormComponent, VpnResolucionFormComponent, VpnDetailComponent,
  ],
  template: `
    <section class="module-stats">
      <div class="stat-pill" *ngFor="let card of kpiCards" [class.tone-danger]="card.estado === 'PENDIENTE' && card.value > 0">
        <strong>{{ card.value }}</strong>
        <span>{{ card.label }}</span>
      </div>
    </section>

    <app-generic-table
      [columns]="columns"
      [data]="items"
      [canAdd]="false"
      [canEdit]="false"
      extraColumnLabel="Vence VPN"
      (searchChange)="onSearch($event)"
      (view)="onView($event)"
    >
      <ng-template #extraCell let-row>
        <app-status-badge [label]="row.estadoSolicitud" [tone]="estadoTone(row.estadoSolicitud)" />
        <app-vencimiento-badge [fecha]="row.vence" />
      </ng-template>
    </app-generic-table>

    <app-modal title="Detalle VPN" size="wide" [open]="viewing !== null" (closed)="closeView()">
      <app-vpn-detail
        *ngIf="viewing as v"
        [vpn]="v"
        [canEditSolicitud]="canWriteSolicitar"
        [canDeleteSolicitud]="canDelete"
        [canViewCredenciales]="canViewCredenciales"
        [showDecisionPanel]="canWriteAprobar"
        (aprobarRequested)="openAprobar($event)"
        (resolucionRequested)="openResolucion($event.vpn, $event.modo)"
        (deleteRequested)="deleteFromDetail($event)"
        (closeRequested)="closeView()"
      />
    </app-modal>

    <app-modal title="Antivirus" [open]="antivirusOpen" (closed)="closeAntivirus()">
      <app-vpn-antivirus-form [vpn]="antivirusEditing" (saved)="onAntivirusSaved()" (cancelled)="closeAntivirus()" />
    </app-modal>

    <app-modal title="Aprobar solicitud VPN" [open]="aprobarOpen" (closed)="closeAprobar()">
      <app-vpn-aprobar-form [vpn]="aprobarEditing" (saved)="onAprobarSaved()" (cancelled)="closeAprobar()" />
    </app-modal>

    <app-modal [title]="resolucionModo === 'RECHAZAR' ? 'Rechazar solicitud VPN' : 'Observar solicitud VPN'" [open]="resolucionOpen" (closed)="closeResolucion()">
      <app-vpn-resolucion-form [vpn]="resolucionEditing" [modo]="resolucionModo" (saved)="onResolucionSaved()" (cancelled)="closeResolucion()" />
    </app-modal>
  `,
  styleUrl: './vpn.shared.scss',
})
export class VpnAdministracionComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  kpis: VpnKpis | null = null;
  viewing: Vpn | null = null;

  antivirusEditing: Vpn | null = null;
  antivirusOpen = false;
  aprobarEditing: Vpn | null = null;
  aprobarOpen = false;
  resolucionEditing: Vpn | null = null;
  resolucionModo: 'RECHAZAR' | 'OBSERVAR' = 'RECHAZAR';
  resolucionOpen = false;

  columns: TableColumn[] = [
    { key: 'titularNombreCompleto', label: 'Nombre' },
    { key: 'titularOrigenLabel', label: 'Origen' },
    { key: 'estadoSolicitud', label: 'Estado solicitud' },
    { key: 'estado', label: 'Estado' },
  ];

  get canWriteSolicitar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn');
  }

  get canWriteAprobar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn');
  }

  get canDelete(): boolean {
    return this.authService.isAdmin();
  }

  get canViewCredenciales(): boolean {
    if (this.authService.isAdmin() || this.authService.canRead('credenciales-vpn')) return true;
    if (this.authService.canRead('solicitar-vpn')) return true;
    return this.viewing?.solicitadoPor === this.authService.getUsername();
  }

  get kpiCards(): { label: string; value: number; estado: EstadoSolicitud }[] {
    const k = this.kpis;
    return [
      { label: 'Pendientes', value: k?.pendientes ?? 0, estado: 'PENDIENTE' },
      { label: 'Aprobadas', value: k?.aprobadas ?? 0, estado: 'APROBADO' },
      { label: 'Rechazadas', value: k?.rechazadas ?? 0, estado: 'RECHAZADO' },
      { label: 'Observadas', value: k?.observadas ?? 0, estado: 'OBSERVADO' },
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

  loadKpis(): void {
    this.service.getKpis().subscribe((data) => (this.kpis = data));
  }

  onView(item: Vpn): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
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

  onDelete(item: Vpn): void {
    const nombre = item.titularNombreCompleto ?? item.id;
    if (!confirm(`¿Eliminar el registro VPN de "${nombre}"?`)) return;
    this.service.delete(item.id).subscribe(() => {
      this.load();
      this.loadKpis();
    });
  }

  deleteFromDetail(item: Vpn): void {
    this.viewing = null;
    this.onDelete(item);
  }

  estadoTone(estado: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (estado === 'APROBADO') return 'success';
    if (estado === 'RECHAZADO') return 'danger';
    if (estado === 'OBSERVADO') return 'warning';
    return 'neutral';
  }
}
