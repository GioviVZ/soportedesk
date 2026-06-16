import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { WifiFormComponent } from './wifi-form.component';
import { Wifi } from './wifi.model';
import { WifiService } from './wifi.service';

@Component({
  selector: 'app-wifi-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalComponent, FieldComponent, WifiFormComponent],
  templateUrl: './wifi-list.component.html',
  styleUrl: './wifi-list.component.scss',
})
export class WifiListComponent implements OnInit {
  private service = inject(WifiService);
  private authService = inject(AuthService);

  items: Wifi[] = [];
  columns: TableColumn[] = [
    { key: 'ssid', label: 'SSID' },
    { key: 'clave', label: 'Clave' },
    { key: 'ubicacion', label: 'Ubicación' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Wifi | null = null;
  editing: Wifi | null = null;
  formOpen = false;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
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

  onView(item: Wifi): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Wifi): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Wifi): void {
    if (!confirm(`¿Eliminar la red "${item.ssid}"?`)) {
      return;
    }
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
