import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { EquipoFormComponent } from './equipo-form.component';
import { Equipo } from './equipo.model';
import { EquipoService } from './equipo.service';

@Component({
  selector: 'app-equipos-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalComponent, FieldComponent, EquipoFormComponent],
  templateUrl: './equipos-list.component.html',
  styleUrl: './equipos-list.component.scss',
})
export class EquiposListComponent implements OnInit {
  private service = inject(EquipoService);
  private authService = inject(AuthService);

  items: Equipo[] = [];
  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'area', label: 'Área' },
    { key: 'asignado', label: 'Asignado' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Equipo | null = null;
  editing: Equipo | null = null;
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

  onView(item: Equipo): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Equipo): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Equipo): void {
    if (!confirm(`¿Eliminar el equipo "${item.codigo}"?`)) {
      return;
    }
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
