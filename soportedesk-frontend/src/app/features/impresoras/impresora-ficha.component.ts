import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Impresora, impresoraEstadoTone } from './impresora.model';
import { ModeloImpresoraToner } from '../../core/models/catalogo.model';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

type FichaTab = 'instalacion' | 'consumibles' | 'driver';

@Component({
  selector: 'app-impresora-ficha',
  standalone: true,
  imports: [CommonModule, SectionCardComponent, StatusBadgeComponent],
  templateUrl: './impresora-ficha.component.html',
  styleUrl: './impresora-ficha.component.scss',
})
export class ImpresoraFichaComponent {
  private authService = inject(AuthService);
  private catalogoService = inject(CatalogoService);

  @Input({ required: true }) impresora!: Impresora;

  activeTab: FichaTab = 'instalacion';
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
    const modeloId = this.impresora.modeloImpresora.id;
    this.catalogoService.downloadModeloImpresoraDriver(modeloId).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.impresora.modeloImpresora.driverNombre ?? 'driver';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
