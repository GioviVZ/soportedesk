import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ModalComponent } from '../../shared/modal/modal.component';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { EquipoService } from './equipo.service';
import { EquipoEnrichmentDto, HistorialItem } from './equipo.model';

@Component({
  selector: 'app-equipo-enrichment-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, UbicacionSelectComponent],
  templateUrl: './equipo-enrichment-modal.component.html',
  styleUrl: './equipo-enrichment-modal.component.scss',
})
export class EquipoEnrichmentModalComponent implements OnChanges {
  private service = inject(EquipoService);
  private catalogoService = inject(CatalogoService);
  private router = inject(Router);

  @Input({ required: true }) open = false;
  @Input({ required: true }) computerId!: number;
  @Input({ required: true }) nombreEquipo!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  tiposEquipo = signal<string[]>([]);
  historial = signal<HistorialItem[]>([]);
  saving = signal(false);
  saveSuccess = signal(false);

  form: EquipoEnrichmentDto = this.emptyForm();

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['computerId']) && this.open) {
      this.load();
    }
  }

  updateField(field: keyof EquipoEnrichmentDto, value: string): void {
    this.form = { ...this.form, [field]: value || null };
  }

  onSedeChange(sedeId: number | null): void {
    this.form = { ...this.form, sedeId };
  }

  onDependenciaChange(dependenciaId: number | null): void {
    this.form = { ...this.form, dependenciaId };
  }

  onSubdependenciaChange(subdependenciaId: number | null): void {
    this.form = { ...this.form, subdependenciaId };
  }

  save(): void {
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.service.saveEnrichment(this.computerId, this.form).subscribe({
      next: (saved) => {
        this.form = saved;
        this.service.getHistorial(this.computerId).subscribe((h) => this.historial.set(h));
        this.saving.set(false);
        this.saveSuccess.set(true);
        this.saved.emit();
      },
      error: () => this.saving.set(false),
    });
  }

  close(): void {
    this.closed.emit();
  }

  verFicha(): void {
    this.router.navigate(['/equipos', this.computerId]);
  }

  empty(value: unknown): string {
    return value == null || value === '' ? '-' : String(value);
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private load(): void {
    this.form = this.emptyForm();
    this.saveSuccess.set(false);
    this.service.getEnrichment(this.computerId).subscribe((dto) => {
      if (dto) this.form = dto;
    });
    this.service.getHistorial(this.computerId).subscribe((h) => this.historial.set(h));
    this.catalogoService.getTiposEquipo().subscribe({
      next: (tipos) => this.tiposEquipo.set(Array.from(new Set(tipos.map((t) => t.tipoNormalizado)))),
      error: () => this.tiposEquipo.set([]),
    });
  }

  private emptyForm(): EquipoEnrichmentDto {
    return {
      tipoOverride: null,
      fabricanteOverride: null,
      modeloOverride: null,
      codigoPatrimonial: null,
      sedeId: null,
      sedeNombre: null,
      dependenciaId: null,
      dependenciaNombre: null,
      subdependenciaId: null,
      subdependenciaNombre: null,
      numeroSerieOverride: null,
      estadoDepuracion: null,
      observaciones: null,
      revisadoPor: null,
      fechaRevision: null,
    };
  }
}
