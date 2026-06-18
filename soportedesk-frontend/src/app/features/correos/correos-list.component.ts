import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { CorreoFormComponent } from './correo-form.component';
import { Correo } from './correo.model';
import { CorreoService } from './correo.service';

@Component({
  selector: 'app-correos-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    ModalComponent,
    FieldComponent,
    VencimientoBadgeComponent,
    CorreoFormComponent,
  ],
  templateUrl: './correos-list.component.html',
  styleUrl: './correos-list.component.scss',
})
export class CorreosListComponent implements OnInit {
  private service = inject(CorreoService);
  private authService = inject(AuthService);

  items: Correo[] = [];
  columns: TableColumn[] = [
    { key: 'usuario', label: 'Usuario' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellidos', label: 'Apellidos' },
    { key: 'correo', label: 'Correo' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'subdependencia.nombre', label: 'Subdependencia' },
    { key: 'tipoContrato.nombre', label: 'Tipo Contrato' },
    { key: 'fechaFinContrato', label: 'Fin Contrato' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: Correo | null = null;
  editing: Correo | null = null;
  formOpen = false;

  get canWrite(): boolean {
    return this.authService.canWrite('correos');
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

  onView(item: Correo): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Correo): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Correo): void {
    if (!confirm(`¿Eliminar el correo "${item.correo}"?`)) return;
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
