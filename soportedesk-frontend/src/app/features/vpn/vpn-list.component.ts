import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { VpnFormComponent } from './vpn-form.component';
import { VpnAntivirusFormComponent } from './vpn-antivirus-form.component';
import { Vpn } from './vpn.model';
import { VpnService } from './vpn.service';

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
  ],
  templateUrl: './vpn-list.component.html',
  styleUrl: './vpn-list.component.scss',
})
export class VpnListComponent implements OnInit {
  private service = inject(VpnService);
  private authService = inject(AuthService);

  items: Vpn[] = [];
  columns: TableColumn[] = [
    { key: 'usuarioRed.nombre', label: 'Nombre' },
    { key: 'usuarioRed.usuario', label: 'Usuario red' },
    { key: 'equipo.marca', label: 'Equipo' },
    { key: 'ipAsignada', label: 'IP VPN' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Vpn | null = null;
  editing: Vpn | null = null;
  formOpen = false;

  antivirusEditing: Vpn | null = null;
  antivirusOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get canWriteVpn(): boolean {
    return this.authService.canWrite('vpn');
  }

  get canEditCredenciales(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('credenciales-vpn');
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

  antivirusLabel(vpn: Vpn | null): string {
    if (!vpn || vpn.tieneAntivirus === null || vpn.tieneAntivirus === undefined) return '—';
    return vpn.tieneAntivirus ? 'Sí' : 'No';
  }
}
