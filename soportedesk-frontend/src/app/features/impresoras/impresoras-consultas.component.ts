import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { ModalComponent } from '../../shared/modal/modal.component';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { ImpresorasListViewComponent } from './impresoras-list-view.component';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

@Component({
    selector: 'app-impresoras-consultas',
    imports: [ModalComponent, ImpresoraFichaComponent, ImpresorasListViewComponent],
    template: `
    <app-impresoras-list-view [items]="items" [canManage]="false" (view)="onView($event)" />
    
    <app-modal title="Ficha tecnica" [open]="viewing !== null" (closed)="closeView()">
      @if (viewing) {
        <app-impresora-ficha [impresora]="viewing" [allowActions]="false" />
      }
    </app-modal>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './impresoras.shared.scss'
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
