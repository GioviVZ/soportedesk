import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { UsuarioRedFormComponent } from './usuario-red-form.component';
import { UsuarioRed } from './usuario-red.model';
import { UsuarioRedService } from './usuario-red.service';

@Component({
  selector: 'app-usuarios-red-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    ModalComponent,
    FieldComponent,
    VencimientoBadgeComponent,
    UsuarioRedFormComponent,
  ],
  templateUrl: './usuarios-red-list.component.html',
  styleUrl: './usuarios-red-list.component.scss',
})
export class UsuariosRedListComponent implements OnInit {
  private service = inject(UsuarioRedService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  items: UsuarioRed[] = [];
  columns: TableColumn[] = [
    { key: 'usuario', label: 'Usuario' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellidos', label: 'Apellidos' },
    { key: 'grupo', label: 'Grupo' },
    { key: 'unidadOrganizativa', label: 'Unidad Organizativa' },
    { key: 'ultimoLogin', label: 'Último Login' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'subdependencia.nombre', label: 'Subdependencia' },
    { key: 'tipoContrato.nombre', label: 'Tipo Contrato' },
    { key: 'numeroContrato', label: 'N° Contrato' },
    { key: 'fechaCreacion', label: 'Fecha Creación' },
    { key: 'fechaFinContrato', label: 'Fin Contrato' },
    { key: 'estado', label: 'Estado' },
  ];

  viewing: UsuarioRed | null = null;
  editing: UsuarioRed | null = null;
  formOpen = false;
  initialSearch = '';

  get canWrite(): boolean {
    return this.authService.canWrite('usuarios-red');
  }

  ngOnInit(): void {
    const search = this.route.snapshot.queryParamMap.get('search');
    if (search) {
      this.initialSearch = search;
      this.load(search);
    } else {
      this.load();
    }
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.items = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(item: UsuarioRed): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: UsuarioRed): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: UsuarioRed): void {
    if (!confirm(`¿Eliminar el usuario "${item.usuario}"?`)) return;
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
