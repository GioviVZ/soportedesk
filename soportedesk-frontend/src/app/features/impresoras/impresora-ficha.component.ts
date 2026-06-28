import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { Impresora, impresoraEstadoTone } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { ModeloImpresoraToner } from '../../core/models/catalogo.model';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type FichaTab = 'instalacion' | 'consumibles' | 'driver';

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionCardComponent, StatusBadgeComponent],
  templateUrl: './impresora-ficha.component.html',
  styleUrl: './impresora-ficha.component.scss',
})
export class ImpresoraFichaComponent {
  private service = inject(ImpresoraService);
  private authService = inject(AuthService);

  @Input({ required: true }) impresora!: Impresora;
  @Output() driverUpdated = new EventEmitter<Impresora>();

  activeTab: FichaTab = 'instalacion';
  driverVersionInput = '';
  driverSoInput = '';
  readonly impresoraEstadoTone = impresoraEstadoTone;

  get isAdmin(): boolean {
    return this.authService.canWrite('impresoras');
  }

  get tonersPorColor(): { color: string; variantes: ModeloImpresoraToner[] }[] {
    const grupos = new Map<string, ModeloImpresoraToner[]>();
    for (const toner of this.impresora.modeloImpresora?.toners ?? []) {
      const lista = grupos.get(toner.color) ?? [];
      lista.push(toner);
      grupos.set(toner.color, lista);
    }
    return Array.from(grupos.entries()).map(([color, variantes]) => ({ color, variantes }));
  }

  setTab(tab: FichaTab): void {
    this.activeTab = tab;
  }

  downloadDriver(): void {
    this.service.downloadDriver(this.impresora.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.impresora.driverNombre ?? 'driver';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.service.uploadDriver(this.impresora.id, file, this.driverVersionInput, this.driverSoInput).subscribe((updated) => {
      this.driverVersionInput = '';
      this.driverSoInput = '';
      this.driverUpdated.emit(updated);
    });
  }
}
