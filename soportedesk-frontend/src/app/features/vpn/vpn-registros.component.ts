import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { VpnFormComponent } from './vpn-form.component';
import { VpnDetailComponent } from './vpn-detail.component';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

const EDITABLE_STATES = new Set(['PENDIENTE', 'OBSERVADO']);

@Component({
  selector: 'app-vpn-registros',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalComponent, StatusBadgeComponent, VencimientoBadgeComponent, VpnFormComponent, VpnDetailComponent],
  template: `
    <app-generic-table
      [columns]="columns"
      [data]="items"
      [canAdd]="canWriteSolicitar"
      [canEdit]="false"
      extraColumnLabel="Vence VPN"
      (searchChange)="onSearch($event)"
      (add)="onAdd()"
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
        [canWriteSolicitar]="canWriteSolicitar"
        [canEditCredenciales]="false"
        [showDecisionPanel]="false"
        (editRequested)="editFromDetail($event)"
        (deleteRequested)="deleteFromDetail($event)"
      />
    </app-modal>

    <app-modal
      [title]="editing ? 'Editar solicitud VPN' : 'Nueva solicitud VPN'"
      [open]="formOpen"
      (closed)="closeForm()"
    >
      <app-vpn-form [vpn]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
    </app-modal>
  `,
  styleUrl: './vpn.shared.scss',
})
export class VpnRegistrosComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  viewing: Vpn | null = null;
  editing: Vpn | null = null;
  formOpen = false;

  columns: TableColumn[] = [
    { key: 'titularNombreCompleto', label: 'Nombre' },
    { key: 'titularOrigenLabel', label: 'Origen' },
    { key: 'estadoSolicitud', label: 'Estado solicitud' },
    { key: 'estado', label: 'Estado' },
  ];

  get canWriteSolicitar(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn');
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
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
  }

  estadoTone(estado: string): 'success' | 'warning' | 'danger' | 'neutral' {
    if (estado === 'APROBADO') return 'success';
    if (estado === 'RECHAZADO') return 'danger';
    if (estado === 'OBSERVADO') return 'warning';
    return 'neutral';
  }
}
