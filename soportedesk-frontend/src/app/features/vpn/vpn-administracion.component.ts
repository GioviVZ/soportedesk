import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import {
  VpnListFilters,
  cargoOptions,
  defaultVpnFilters,
  dependenciaOptions,
  filterAndSortVpns,
  hasActiveVpnFilters,
  subdependenciaOptions,
} from './vpn-list-filters';

type EstadoSolicitud = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';

@Component({
  selector: 'app-vpn-administracion',
  standalone: true,
  imports: [
    CommonModule, FormsModule, GenericTableComponent, ModalComponent, StatusBadgeComponent, VencimientoBadgeComponent,
    VpnAntivirusFormComponent, VpnAprobarFormComponent, VpnResolucionFormComponent, VpnDetailComponent,
  ],
  template: `
    <section class="module-stats">
      <div class="stat-pill" *ngFor="let card of kpiCards" [class.tone-danger]="card.estado === 'PENDIENTE' && card.value > 0">
        <strong>{{ card.value }}</strong>
        <span>{{ card.label }}</span>
      </div>
    </section>

    <section class="vpn-filter-panel">
      <label class="vpn-search-field">
        <span>Buscar solicitud</span>
        <input
          type="search"
          [(ngModel)]="filters.query"
          placeholder="Nombre, usuario, equipo, correo, dependencia..."
          autocomplete="off"
        />
      </label>

      <div class="vpn-filter-grid">
        <label class="field">
          <span>Dependencia</span>
          <select [(ngModel)]="filters.dependencia">
            <option value="">Todas</option>
            <option *ngFor="let option of dependencias" [value]="option">{{ option }}</option>
          </select>
        </label>

        <label class="field">
          <span>Subdependencia / oficina</span>
          <select [(ngModel)]="filters.subdependencia">
            <option value="">Todas</option>
            <option *ngFor="let option of subdependencias" [value]="option">{{ option }}</option>
          </select>
        </label>

        <label class="field">
          <span>Cargo</span>
          <select [(ngModel)]="filters.cargo">
            <option value="">Todos</option>
            <option *ngFor="let option of cargos" [value]="option">{{ option }}</option>
          </select>
        </label>

        <label class="field">
          <span>Orden</span>
          <select [(ngModel)]="filters.orden">
            <option value="nuevas">Nuevas pendientes arriba</option>
            <option value="recientes">Más recientes</option>
            <option value="rechazados">Rechazadas arriba</option>
            <option value="observados">Observadas arriba</option>
          </select>
        </label>
      </div>

      <div class="vpn-filter-actions">
        <div class="segmented-control" role="group" aria-label="Estado de solicitud VPN">
          <button type="button" [class.active]="filters.estado === 'TODOS'" (click)="filters.estado = 'TODOS'">Todas</button>
          <button type="button" [class.active]="filters.estado === 'PENDIENTE'" (click)="filters.estado = 'PENDIENTE'">Pendientes</button>
          <button type="button" [class.active]="filters.estado === 'OBSERVADO'" (click)="filters.estado = 'OBSERVADO'">Observadas</button>
          <button type="button" [class.active]="filters.estado === 'RECHAZADO'" (click)="filters.estado = 'RECHAZADO'">Rechazadas</button>
          <button type="button" [class.active]="filters.estado === 'APROBADO'" (click)="filters.estado = 'APROBADO'">Aprobadas</button>
        </div>

        <button type="button" class="btn btn-ghost" *ngIf="hasFilters" (click)="clearFilters()">Limpiar filtros</button>
      </div>
    </section>

    <div class="desktop-vpn-table">
      <app-generic-table
        [columns]="columns"
        [data]="filteredItems"
        [canAdd]="false"
        [canEdit]="false"
        [showSearch]="false"
        emptyMessage="Sin solicitudes con los filtros aplicados"
        extraColumnLabel="Vence VPN"
        (view)="onView($event)"
      >
        <ng-template #extraCell let-row>
          <app-status-badge [label]="row.estadoSolicitud" [tone]="estadoTone(row.estadoSolicitud)" />
          <app-vencimiento-badge [fecha]="row.vence" />
        </ng-template>
      </app-generic-table>
    </div>

    <section class="mobile-vpn-workspace" aria-label="Administración VPN">
      <div class="mobile-vpn-toolbar">
        <div>
          <span>{{ filteredItems.length }} de {{ items.length }}</span>
          <strong>{{ hasFilters ? 'Solicitudes filtradas' : 'Administración VPN' }}</strong>
        </div>
      </div>

      <article class="vpn-mobile-card admin" *ngFor="let item of filteredItems">
        <header>
          <div>
            <span>{{ item.titularOrigenLabel || item.titularTipo }}</span>
            <strong>{{ item.titularNombreCompleto }}</strong>
            <small>{{ item.adSamAccountName || item.titularCorreo || item.adMail || 'Sin usuario' }}</small>
          </div>
          <app-status-badge [label]="item.estadoSolicitud" [tone]="estadoTone(item.estadoSolicitud)" />
        </header>

        <dl>
          <div>
            <dt>Dependencia</dt>
            <dd>{{ item.adOrganizationalUnit || 'Sin dependencia' }}</dd>
          </div>
          <div>
            <dt>Oficina</dt>
            <dd>{{ item.adOffice || 'Sin oficina' }}</dd>
          </div>
          <div>
            <dt>Cargo</dt>
            <dd>{{ item.titularCargo || 'Sin cargo' }}</dd>
          </div>
          <div>
            <dt>Equipo</dt>
            <dd>{{ item.glpiNombreEquipo || item.equipo?.host || item.tipoEquipo || 'Sin equipo' }}</dd>
          </div>
          <div>
            <dt>Solicitado</dt>
            <dd>{{ item.fechaSolicitud | date:'dd/MM/yyyy' }}</dd>
          </div>
          <div>
            <dt>Vence VPN</dt>
            <dd><app-vencimiento-badge [fecha]="item.vence" /></dd>
          </div>
        </dl>

        <footer>
          <button type="button" class="view" (click)="onView(item)">Ver</button>
        </footer>
      </article>

      <p class="mobile-empty" *ngIf="filteredItems.length === 0">Sin solicitudes con los filtros aplicados.</p>
    </section>

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

    <app-modal title="Antivirus" [open]="antivirusOpen" [hideDefaultFooter]="true" (closed)="closeAntivirus()">
      <app-vpn-antivirus-form [vpn]="antivirusEditing" (saved)="onAntivirusSaved()" (cancelled)="closeAntivirus()" />
    </app-modal>

    <app-modal title="Aprobar solicitud VPN" [open]="aprobarOpen" [hideDefaultFooter]="true" (closed)="closeAprobar()">
      <app-vpn-aprobar-form [vpn]="aprobarEditing" (saved)="onAprobarSaved()" (cancelled)="closeAprobar()" />
    </app-modal>

    <app-modal [title]="resolucionModo === 'RECHAZAR' ? 'Rechazar solicitud VPN' : 'Observar solicitud VPN'" [open]="resolucionOpen" [hideDefaultFooter]="true" (closed)="closeResolucion()">
      <app-vpn-resolucion-form [vpn]="resolucionEditing" [modo]="resolucionModo" (saved)="onResolucionSaved()" (cancelled)="closeResolucion()" />
    </app-modal>
  `,
  styleUrl: './vpn.shared.scss',
})
export class VpnAdministracionComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  filters: VpnListFilters = defaultVpnFilters();
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
    { key: 'adOrganizationalUnit', label: 'Dependencia' },
    { key: 'adOffice', label: 'Subdependencia' },
    { key: 'titularCargo', label: 'Cargo' },
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

  get filteredItems(): Vpn[] {
    return filterAndSortVpns(this.items, this.filters);
  }

  get dependencias(): string[] {
    return dependenciaOptions(this.items);
  }

  get subdependencias(): string[] {
    return subdependenciaOptions(this.items);
  }

  get cargos(): string[] {
    return cargoOptions(this.items);
  }

  get hasFilters(): boolean {
    return hasActiveVpnFilters(this.filters);
  }

  ngOnInit(): void {
    this.load();
    this.loadKpis();
  }

  load(): void {
    this.service.getAll().subscribe((data) => (this.items = data));
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

  clearFilters(): void {
    this.filters = defaultVpnFilters();
  }

  estadoTone(estado: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (estado === 'APROBADO') return 'success';
    if (estado === 'RECHAZADO') return 'danger';
    if (estado === 'OBSERVADO') return 'warning';
    return 'neutral';
  }
}
