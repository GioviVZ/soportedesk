import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { ImpresorasListViewComponent } from './impresoras-list-view.component';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
  selector: 'app-impresoras-consultas',
  standalone: true,
  imports: [CommonModule, ModalComponent, ImpresoraFichaComponent, ImpresorasListViewComponent],
  template: `
    <app-impresoras-list-view [items]="items" [canManage]="false" (view)="onView($event)" />

    <app-modal title="Ficha tecnica" [open]="viewing !== null" (closed)="closeView()">
      <app-impresora-ficha *ngIf="viewing" [impresora]="viewing" [allowActions]="false" />
    </app-modal>
  `,
  styleUrl: './impresoras.shared.scss',
})
export class ImpresorasConsultasComponent implements OnInit {
  private service = inject(ImpresoraService);

  items: Impresora[] = [];
  viewing: Impresora | null = null;

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
}
