import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { FieldComponent } from '../../shared/field/field.component';
import { LicenciaFormComponent } from './licencia-form.component';
import { Licencia } from './licencia.model';
import { LicenciaService } from './licencia.service';

@Component({
  selector: 'app-licencias-list',
  standalone: true,
  imports: [CommonModule, GenericTableComponent, ModalComponent, FieldComponent, LicenciaFormComponent],
  templateUrl: './licencias-list.component.html',
  styleUrl: './licencias-list.component.scss',
})
export class LicenciasListComponent implements OnInit {
  private service = inject(LicenciaService);
  private authService = inject(AuthService);

  licencias: Licencia[] = [];
  columns: TableColumn[] = [
    { key: 'tipoLicencia.nombre', label: 'Tipo' },
    { key: 'descripcion', label: 'Licencia' },
    { key: 'ordenCompra', label: 'Orden de Compra' },
    { key: 'anio', label: 'Año' },
  ];

  viewing: Licencia | null = null;
  editing: Licencia | null = null;
  formOpen = false;

  get canWrite(): boolean {
    return this.authService.canWrite('licencias');
  }

  ngOnInit(): void {
    this.load();
  }

  load(search?: string): void {
    this.service.getAll(search).subscribe((data) => (this.licencias = data));
  }

  onSearch(term: string): void {
    this.load(term);
  }

  onView(licencia: Licencia): void {
    this.viewing = licencia;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(licencia: Licencia): void {
    this.editing = licencia;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(licencia: Licencia): void {
    if (!confirm(`¿Eliminar la licencia "${licencia.descripcion}"?`)) {
      return;
    }
    this.service.delete(licencia.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
