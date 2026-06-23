import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { GenericTableComponent, TableColumn } from '../../shared/generic-table/generic-table.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { ImpresoraFormComponent } from './impresora-form.component';
import { ImpresoraResumenComponent } from './impresora-resumen.component';
import { Impresora, impresoraEstadoTone } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-impresoras-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericTableComponent,
    ModalComponent,
    ImpresoraFichaComponent,
    ImpresoraFormComponent,
    ImpresoraResumenComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './impresoras-list.component.html',
  styleUrl: './impresoras-list.component.scss',
})
export class ImpresorasListComponent implements OnInit {
  private service = inject(ImpresoraService);
  private authService = inject(AuthService);

  items: Impresora[] = [];
  columns: TableColumn[] = [
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'tipoImpresora.nombre', label: 'Tipo' },
    { key: 'serie', label: 'Serie' },
    { key: 'ip', label: 'IP' },
    { key: 'sede.nombre', label: 'Sede' },
    { key: 'dependencia.nombre', label: 'Dependencia' },
    { key: 'subdependencia.nombre', label: 'Subdependencia' },
  ];
  readonly impresoraEstadoTone = impresoraEstadoTone;

  viewing: Impresora | null = null;
  editing: Impresora | null = null;
  formOpen = false;

  get canWrite(): boolean {
    return this.authService.canWrite('impresoras');
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

  onView(item: Impresora): void {
    this.viewing = item;
  }

  closeView(): void {
    this.viewing = null;
  }

  onAdd(): void {
    this.editing = null;
    this.formOpen = true;
  }

  onEdit(item: Impresora): void {
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Impresora): void {
    if (!confirm(`¿Eliminar la impresora "${item.marca} ${item.modelo}"?`)) return;
    this.service.delete(item.id).subscribe(() => this.load());
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }

  onDriverUpdated(updated: Impresora): void {
    const index = this.items.findIndex((i) => i.id === updated.id);
    if (index !== -1) {
      this.items = [...this.items.slice(0, index), updated, ...this.items.slice(index + 1)];
    }
    if (this.viewing?.id === updated.id) {
      this.viewing = updated;
    }
  }
}
