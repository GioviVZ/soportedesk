import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ModalComponent } from '../../shared/modal/modal.component';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { EquipoService } from './equipo.service';
import { EquipoEnrichmentDto } from './equipo.model';
import { CatalogoService } from '../../core/catalogos/catalogo.service';

@Component({
  selector: 'app-equipo-enrichment-modal', standalone: true,
  imports: [CommonModule, ModalComponent, UbicacionSelectComponent],
  templateUrl: './equipo-enrichment-modal.component.html',
  styleUrl: './equipo-enrichment-modal.component.scss',
})
export class EquipoEnrichmentModalComponent implements OnChanges {
  private service = inject(EquipoService);
  private catalogos = inject(CatalogoService);
  @Input({ required: true }) open = false;
  @Input({ required: true }) computerId!: number;
  @Input({ required: true }) nombreEquipo!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  saving = signal(false);
  error = signal('');
  tiposEquipo = signal<string[]>([]);
  form: EquipoEnrichmentDto = this.emptyForm();

  ngOnChanges(changes: SimpleChanges): void { if ((changes['open'] || changes['computerId']) && this.open) this.load(); }
  update(field: keyof EquipoEnrichmentDto, value: string): void { this.form = { ...this.form, [field]: value.trim() || null }; }
  onSedeChange(id: number | null): void { this.form = { ...this.form, sedeId: id, dependenciaId: null, subdependenciaId: null }; }
  onDependenciaChange(id: number | null): void { this.form = { ...this.form, dependenciaId: id, subdependenciaId: null }; }
  onSubdependenciaChange(id: number | null): void { this.form = { ...this.form, subdependenciaId: id }; }
  close(): void { this.closed.emit(); }
  save(): void {
    this.saving.set(true); this.error.set('');
    this.service.saveEnrichment(this.computerId, this.form).subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: (err) => { this.saving.set(false); this.error.set(err?.error?.message || 'No se pudieron guardar los cambios.'); },
    });
  }
  private load(): void {
    this.form = this.emptyForm(); this.error.set('');
    forkJoin({ enrichment: this.service.getEnrichment(this.computerId), detail: this.service.getDetalle(this.computerId) }).subscribe(({ enrichment, detail }) => {
      if (enrichment) this.form = enrichment;
      this.form = { ...this.form,
        nombreAsignadoOverride: this.form.nombreAsignadoOverride || detail.equipo.usuarioTelefono,
        usuarioAsignadoOverride: this.form.usuarioAsignadoOverride || detail.equipo.usuarioContacto,
        codigoInternoOverride: this.form.codigoInternoOverride || detail.equipo.codigoInterno,
        numeroSerieOverride: this.form.numeroSerieOverride || detail.equipo.numeroserie,
      };
    });
    this.catalogos.getTiposEquipo().subscribe((items) => this.tiposEquipo.set(
      [...new Set(items.filter((item) => item.activo).map((item) => item.tipoNormalizado))]
    ));
  }

  private emptyForm(): EquipoEnrichmentDto {
    return {
      tipoOverride: null,
      fabricanteOverride: null,
      modeloOverride: null,
      codigoPatrimonial: null,
      codigoInternoOverride: null,
      nombreAsignadoOverride: null,
      usuarioAsignadoOverride: null,
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
