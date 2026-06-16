import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { Impresora } from './impresora.model';
import { ImpresoraService } from './impresora.service';

type FichaTab = 'instalacion' | 'consumibles' | 'driver';

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impresora-ficha.component.html',
  styleUrl: './impresora-ficha.component.scss',
})
export class ImpresoraFichaComponent {
  private service = inject(ImpresoraService);
  private authService = inject(AuthService);

  @Input({ required: true }) impresora!: Impresora;
  @Output() driverUpdated = new EventEmitter<Impresora>();

  activeTab: FichaTab = 'instalacion';

  get isAdmin(): boolean {
    return this.authService.isAdmin();
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
    this.service.uploadDriver(this.impresora.id, file).subscribe((updated) => {
      this.driverUpdated.emit(updated);
    });
  }
}
