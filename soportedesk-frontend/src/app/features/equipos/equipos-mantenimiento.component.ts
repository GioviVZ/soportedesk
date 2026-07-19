import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EquipoSaludItem } from './equipo.model';
import { EquipoService } from './equipo.service';
import { EquipoEnrichmentModalComponent } from './equipo-enrichment-modal.component';

@Component({
  selector: 'app-equipos-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, EquipoEnrichmentModalComponent],
  templateUrl: './equipos-mantenimiento.component.html',
  styleUrl: './equipos.shared.scss',
})
export class EquiposMantenimientoComponent implements OnInit {
  private service = inject(EquipoService);
  items = signal<EquipoSaludItem[]>([]);
  query = signal('');
  onlyRecent = signal(false);
  selected = signal<EquipoSaludItem | null>(null);

  recientes = computed(() => this.items().filter((item) => this.isRecent(item)));
  filtered = computed(() => {
    const term = this.normalize(this.query());
    return this.items().filter((item) => {
      if (this.onlyRecent() && !this.isRecent(item)) return false;
      if (!term) return true;
      return this.normalize([item.nombreEquipo, item.usuarioContacto, item.sedeNombre, item.tipoEquipo].filter(Boolean).join(' ')).includes(term);
    });
  });

  ngOnInit(): void { this.load(); }
  load(): void { this.service.getSalud().subscribe((data) => this.items.set(data)); }
  edit(item: EquipoSaludItem): void { this.selected.set(item); }
  close(): void { this.selected.set(null); }
  saved(): void { this.close(); this.load(); }

  private isRecent(item: EquipoSaludItem): boolean {
    if (!item.fechaCreacion) return false;
    const age = Date.now() - new Date(item.fechaCreacion).getTime();
    return age >= 0 && age <= 30 * 86400000;
  }
  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
