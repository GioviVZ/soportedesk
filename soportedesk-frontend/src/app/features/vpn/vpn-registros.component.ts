import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { VpnFormComponent } from './vpn-form.component';
import { VpnDetailComponent } from './vpn-detail.component';
import { Vpn } from './vpn.model';
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

const EDITABLE_STATES = new Set(['PENDIENTE', 'OBSERVADO']);

@Component({
    selector: 'app-vpn-registros',
    imports: [CommonModule, FormsModule, ModalComponent, StatusBadgeComponent, VencimientoBadgeComponent, VpnFormComponent, VpnDetailComponent],
    template: `
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
              @for (option of dependencias; track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          </label>
    
          <label class="field">
            <span>Subdependencia / oficina</span>
            <select [(ngModel)]="filters.subdependencia">
              <option value="">Todas</option>
              @for (option of subdependencias; track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          </label>
    
          <label class="field">
            <span>Cargo</span>
            <select [(ngModel)]="filters.cargo">
              <option value="">Todos</option>
              @for (option of cargos; track option) {
                <option [value]="option">{{ option }}</option>
              }
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
    
          @if (hasFilters) {
            <button type="button" class="btn btn-ghost" (click)="clearFilters()">Limpiar filtros</button>
          }
        </div>
      </section>
    
      <div class="desktop-vpn-table">
        <div class="vpn-list-heading">
          <div><strong>Solicitudes VPN</strong><span>{{ filteredItems.length }} de {{ items.length }} registros</span></div>
          @if (canWriteSolicitar) {
            <button type="button" class="btn btn-primary" (click)="onAdd()">Nueva solicitud</button>
          }
        </div>
        @if (filteredItems.length) {
          <div class="vpn-table-scroll">
            <table class="vpn-essential-table">
              <thead><tr><th>Solicitante</th><th>Ubicación</th><th>Equipo</th><th>Solicitud</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                @for (item of filteredItems; track item) {
                  <tr>
                    <td>
                      <button type="button" class="vpn-person-link" (click)="onView(item)">
                        <strong>{{ item.titularNombreCompleto || 'Sin nombre registrado' }}</strong>
                        <span>{{ item.adSamAccountName || item.titularCorreo || item.adMail || 'Sin usuario de red' }}</span>
                      </button>
                    </td>
                    <td><strong>{{ item.adOffice || item.adOrganizationalUnit || 'Sin ubicación' }}</strong>@if (item.adOffice && item.adOrganizationalUnit) {
                    <span>{{ item.adOrganizationalUnit }}</span>
                  }</td>
                  <td><strong>{{ item.glpiNombreEquipo || item.equipo?.host || item.tipoEquipo || 'Sin equipo' }}</strong><span>{{ item.tipoEquipo }}</span></td>
                  <td><strong>{{ item.fechaSolicitud | date:'dd/MM/yyyy' }}</strong><app-vencimiento-badge [fecha]="item.vence" /></td>
                  <td><app-status-badge [label]="item.estadoSolicitud" [tone]="estadoTone(item.estadoSolicitud)" /></td>
                  <td class="vpn-row-actions"><button type="button" (click)="onView(item)">Ver</button>@if (canEditSolicitud(item)) {
                  <button type="button" (click)="onEdit(item)">Editar</button>
                }</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="vpn-list-empty">Sin solicitudes con los filtros aplicados.</p>
    }
    </div>
    
    <section class="mobile-vpn-workspace" aria-label="Solicitudes VPN">
      <div class="mobile-vpn-toolbar">
        <div>
          <span>{{ filteredItems.length }} de {{ items.length }}</span>
          <strong>{{ hasFilters ? 'Solicitudes filtradas' : 'Solicitudes VPN' }}</strong>
        </div>
        @if (canWriteSolicitar) {
          <button type="button" (click)="onAdd()">Nueva</button>
        }
      </div>
    
      @for (item of filteredItems; track item) {
        <article class="vpn-mobile-card">
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
              <dt>Ubicación</dt>
              <dd>{{ item.adOffice || item.adOrganizationalUnit || 'Sin ubicación' }}</dd>
            </div>
            <div>
              <dt>Equipo</dt>
              <dd>{{ item.glpiNombreEquipo || item.equipo?.host || item.tipoEquipo || 'Sin equipo' }}</dd>
            </div>
            <div>
              <dt>Solicitud</dt>
              <dd>{{ item.fechaSolicitud | date:'dd/MM/yyyy' }}</dd>
            </div>
          </dl>
          <footer>
            <app-vencimiento-badge [fecha]="item.vence" />
            <button type="button" class="view" (click)="onView(item)">Ver</button>
            @if (canEditSolicitud(item)) {
              <button type="button" class="edit" (click)="onEdit(item)">Editar</button>
            }
          </footer>
        </article>
      }
    
      @if (filteredItems.length === 0) {
        <p class="mobile-empty">Sin solicitudes con los filtros aplicados.</p>
      }
    </section>
    
    <app-modal title="Detalle VPN" size="wide" [open]="viewing !== null" (closed)="closeView()">
      @if (viewing; as v) {
        <app-vpn-detail
          [vpn]="v"
          [canEditSolicitud]="canWriteSolicitar"
          [canDeleteSolicitud]="false"
          [canViewCredenciales]="true"
          [showDecisionPanel]="false"
          (editRequested)="editFromDetail($event)"
          (closeRequested)="closeView()"
          />
      }
    </app-modal>
    
    <app-modal
      [title]="editing ? 'Editar solicitud VPN' : 'Nueva solicitud VPN'"
      [open]="formOpen"
      [hideDefaultFooter]="true"
      (closed)="closeForm()"
      >
      <app-vpn-form [vpn]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
    </app-modal>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vpn.shared.scss'
})
export class VpnRegistrosComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  filters: VpnListFilters = defaultVpnFilters();
  viewing: Vpn | null = null;
  editing: Vpn | null = null;
  formOpen = false;

  get canWriteSolicitar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn');
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
  }

  load(): void {
    this.service.getAll().subscribe((data) => (this.items = data));
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

  canEditSolicitud(item: Vpn): boolean {
    return this.canWriteSolicitar && EDITABLE_STATES.has(item.estadoSolicitud);
  }

  editFromDetail(item: Vpn): void {
    this.viewing = null;
    this.onEdit(item);
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
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
