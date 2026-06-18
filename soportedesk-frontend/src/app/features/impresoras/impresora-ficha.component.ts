import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

type FichaTab = 'instalacion' | 'consumibles' | 'driver';

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  get isAdmin(): boolean {
    return this.authService.canWrite('impresoras');
  }

  setTab(tab: FichaTab): void {
    this.activeTab = tab;
  }

  hasConsumibles(): boolean {
    return !!(
      this.impresora.modeloTonerNegro ||
      this.impresora.modeloTonerC     ||
      this.impresora.modeloTonerM     ||
      this.impresora.modeloTonerY     ||
      this.impresora.modeloCartucho   ||
      this.impresora.modeloDrum       ||
      this.impresora.modeloFusor
    );
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
