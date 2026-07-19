import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { ImpresoraFormComponent } from './impresora-form.component';
import { ImpresorasListViewComponent } from './impresoras-list-view.component';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
  selector: 'app-impresoras-administracion',
  standalone: true,
  imports: [CommonModule, ModalComponent, ImpresoraFichaComponent, ImpresoraFormComponent, ImpresorasListViewComponent],
  template: `
    <section class="module-stats">
      <div class="stat-pill"><strong>{{ items.length }}</strong><span>Total</span></div>
      <div class="stat-pill"><strong>{{ activas }}</strong><span>Activas</span></div>
      <div class="stat-pill"><strong>{{ enMantenimiento }}</strong><span>Mant.</span></div>
    </section>

    <app-impresoras-list-view
      [items]="items"
      [canManage]="true"
      (view)="onView($event)"
      (add)="onAdd()"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
    />

    <app-modal title="Ficha técnica" [open]="viewing !== null" size="wide" (closed)="closeView()">
      <app-impresora-ficha *ngIf="viewing" [impresora]="viewing" (editRequested)="onEdit($event)" />
    </app-modal>

    <app-modal
      [title]="editing ? 'Editar impresora' : 'Agregar impresora'"
      [open]="formOpen"
      size="wide"
      [hideDefaultFooter]="true"
      (closed)="closeForm()"
    >
      <app-impresora-form *ngIf="formOpen" [impresora]="editing" (saved)="onSaved()" (cancelled)="closeForm()" />
    </app-modal>

    <app-modal title="Confirmar eliminación" [open]="deleting !== null" (closed)="closeDelete()">
      <div class="delete-confirm" *ngIf="deleting as item">
        <div>
          <strong>{{ item.modeloImpresora.marca.nombre }} {{ item.modeloImpresora.nombre }}</strong>
          <span>{{ item.serie || item.codigoInventario || item.codigoPatrimonial || 'Sin identificador' }}</span>
        </div>
        <p>Esta acción eliminará el registro de la impresora. Confirma solo si estás seguro.</p>
        <div class="delete-actions">
          <button type="button" class="secondary" (click)="closeDelete()">Cancelar</button>
          <button type="button" class="danger" (click)="confirmDelete()">Sí, eliminar</button>
        </div>
      </div>
    </app-modal>
  `,
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasAdministracionComponent implements OnInit {
  private service = inject(ImpresoraService);

  items: Impresora[] = [];
  viewing: Impresora | null = null;
  editing: Impresora | null = null;
  deleting: Impresora | null = null;
  formOpen = false;

  get activas(): number {
    return this.items.filter((item) => item.estado?.toLowerCase() === 'activa').length;
  }

  get enMantenimiento(): number {
    return this.items.filter((item) => item.estado?.toLowerCase().includes('mantenimiento')).length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe((data) => (this.items = data));
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
    this.viewing = null;
    this.editing = item;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onDelete(item: Impresora): void {
    this.deleting = item;
  }

  closeDelete(): void {
    this.deleting = null;
  }

  confirmDelete(): void {
    if (!this.deleting) return;
    this.service.delete(this.deleting.id).subscribe(() => {
      this.deleting = null;
      this.load();
    });
  }

  onSaved(): void {
    this.formOpen = false;
    this.load();
  }
}
