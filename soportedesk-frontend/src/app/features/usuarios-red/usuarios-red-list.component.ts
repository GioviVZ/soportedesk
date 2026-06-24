import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { UsuarioRedFormComponent } from './usuario-red-form.component';
import { UsuarioRed, usuarioRedEstadoTone } from './usuario-red.model';
import { UsuarioRedService } from './usuario-red.service';

@Component({
  selector: 'app-usuarios-red-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    ModalComponent,
    FieldComponent,
    SectionCardComponent,
    StatusBadgeComponent,
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
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'tipoContrato.nombre', label: 'Tipo Contrato' },
    { key: 'fechaFinContrato', label: 'Fin Contrato' },
    { key: 'estado', label: 'Estado' },
  ];
  readonly usuarioRedEstadoTone = usuarioRedEstadoTone;

  viewing: UsuarioRed | null = null;
  editing: UsuarioRed | null = null;
  formOpen = false;
  initialSearch = '';

  get canWrite(): boolean {
    return this.authService.canWrite('usuarios-red');
  }

  get totalActivos(): number {
    return this.items.filter((item) => this.isActivo(item)).length;
  }

  get totalInactivos(): number {
    return this.items.filter((item) => !this.isActivo(item)).length;
  }

  get totalPorVencer(): number {
    return this.items.filter((item) => {
      const days = this.diasHastaFinContrato(item);
      return days !== null && days >= 0 && days <= 30;
    }).length;
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
    if (!confirm(`Eliminar el usuario "${item.usuario}"?`)) return;
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }

  fullName(item: UsuarioRed): string {
    return `${item.nombre} ${item.apellidos}`.trim();
  }

  isActivo(item: UsuarioRed): boolean {
    return item.estado?.toLowerCase() === 'activo';
  }

  diasHastaFinContrato(item: UsuarioRed): number | null {
    if (!item.fechaFinContrato) {
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(`${item.fechaFinContrato}T00:00:00`);
    return Math.ceil((end.getTime() - today.getTime()) / 86400000);
  }
}
