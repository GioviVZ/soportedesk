
import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ModalComponent } from '../../shared/modal/modal.component';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { EquipoService } from './equipo.service';
import { EquipoDetalle, EquipoEnrichmentDto, EquipoTeclado } from './equipo.model';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { EquipoEvidenciasComponent } from './equipo-evidencias.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';

@Component({
    selector: 'app-equipo-enrichment-modal',
    imports: [DatePipe, ModalComponent, UbicacionSelectComponent, EquipoEvidenciasComponent, SectionCardComponent],
    templateUrl: './equipo-enrichment-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './equipo-enrichment-modal.component.scss'
})
export class EquipoEnrichmentModalComponent implements OnChanges {
  private service = inject(EquipoService);
  private catalogos = inject(CatalogoService);
  private originalFabricanteOverride: string | null = null;
  private originalModeloOverride: string | null = null;
  @Input({ required: true }) open = false;
  @Input({ required: true }) computerId!: number;
  @Input({ required: true }) nombreEquipo!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  saving = signal(false);
  error = signal('');
  tiposEquipo = signal<string[]>([]);
  detail = signal<EquipoDetalle | null>(null);
  effectiveType = signal<string | null>(null);
  editingBrandModel = signal(false);
  mostrarMonitor2 = signal(false);
  confirmingBaja = signal(false);
  bajaEnCurso = signal(false);
  bajaError = signal('');
  motivoBaja = '';
  motivoBajaDetalle = '';
  teclado = signal<EquipoTeclado | null>(null);
  creandoTeclado = signal(false);
  tecladoGuardando = signal(false);
  tecladoError = signal('');
  tecladoMarca = '';
  tecladoModelo = '';
  tecladoNumeroSerie = '';
  tecladoCodigoInventario = '';
  tecladoCodigoPatrimonial = '';
  form: EquipoEnrichmentDto = this.emptyForm();

  ngOnChanges(changes: SimpleChanges): void { if ((changes['open'] || changes['computerId']) && this.open) this.load(); }
  update(field: keyof EquipoEnrichmentDto, value: string): void { this.form = { ...this.form, [field]: value.trim() || null }; }
  onSedeChange(id: number | null): void { this.form = { ...this.form, sedeId: id, dependenciaId: null, subdependenciaId: null }; }
  onDependenciaChange(id: number | null): void { this.form = { ...this.form, dependenciaId: id, subdependenciaId: null }; }
  onSubdependenciaChange(id: number | null): void { this.form = { ...this.form, subdependenciaId: id }; }
  onBrandModelEditingChange(enabled: boolean): void {
    this.editingBrandModel.set(enabled);
    if (enabled) {
      const detail = this.detail();
      this.form = {
        ...this.form,
        fabricanteOverride: this.form.fabricanteOverride || detail?.fabricanteEquipo || null,
        modeloOverride: this.form.modeloOverride || detail?.modeloEquipo || null,
      };
      return;
    }
    this.form = {
      ...this.form,
      fabricanteOverride: this.originalFabricanteOverride,
      modeloOverride: this.originalModeloOverride,
    };
  }
  close(): void { this.closed.emit(); }
  save(): void {
    this.saving.set(true); this.error.set('');
    this.service.saveEnrichment(this.computerId, this.form).subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: (err) => { this.saving.set(false); this.error.set(err?.error?.message || 'No se pudieron guardar los cambios.'); },
    });
  }
  motivoBajaValido(): boolean {
    if (!this.motivoBaja) return false;
    return this.motivoBaja !== 'Otro' || this.motivoBajaDetalle.trim().length > 0;
  }
  cancelarBaja(): void {
    this.confirmingBaja.set(false);
    this.motivoBaja = '';
    this.motivoBajaDetalle = '';
    this.bajaError.set('');
  }
  confirmarBaja(): void {
    if (!this.motivoBajaValido() || this.bajaEnCurso()) return;
    const motivo = this.motivoBaja === 'Otro' ? this.motivoBajaDetalle.trim() : this.motivoBaja;
    this.bajaEnCurso.set(true);
    this.bajaError.set('');
    this.service.darDeBaja(this.computerId, motivo).subscribe({
      next: () => { this.bajaEnCurso.set(false); this.saved.emit(); },
      error: (err) => { this.bajaEnCurso.set(false); this.bajaError.set(err?.error?.message || 'No se pudo dar de baja el equipo.'); },
    });
  }
  cancelarTeclado(): void {
    this.creandoTeclado.set(false);
    this.tecladoMarca = '';
    this.tecladoModelo = '';
    this.tecladoNumeroSerie = '';
    this.tecladoCodigoInventario = '';
    this.tecladoCodigoPatrimonial = '';
    this.tecladoError.set('');
  }
  tecladoValido(): boolean {
    return this.tecladoMarca.trim().length > 0 && this.tecladoModelo.trim().length > 0 && this.tecladoNumeroSerie.trim().length > 0;
  }
  crearTeclado(): void {
    if (!this.tecladoValido() || this.tecladoGuardando()) return;
    this.tecladoGuardando.set(true);
    this.tecladoError.set('');
    this.service.crearTeclado(this.computerId, {
      marca: this.tecladoMarca.trim(),
      modelo: this.tecladoModelo.trim(),
      numeroSerie: this.tecladoNumeroSerie.trim(),
      codigoInventario: this.tecladoCodigoInventario.trim() || null,
      codigoPatrimonial: this.tecladoCodigoPatrimonial.trim() || null,
    }).subscribe({
      next: () => {
        this.tecladoGuardando.set(false);
        this.cancelarTeclado();
        this.reloadTeclado();
      },
      error: (err) => { this.tecladoGuardando.set(false); this.tecladoError.set(err?.error?.message || 'No se pudo registrar el teclado.'); },
    });
  }
  private reloadTeclado(): void {
    this.service.getDetalle(this.computerId).subscribe((detail) => this.teclado.set(detail.teclado));
  }
  private load(): void {
    this.form = this.emptyForm();
    this.detail.set(null);
    this.teclado.set(null);
    this.effectiveType.set(null);
    this.editingBrandModel.set(false);
    this.mostrarMonitor2.set(false);
    this.error.set('');
    this.cancelarBaja();
    this.cancelarTeclado();
    forkJoin({ enrichment: this.service.getEnrichment(this.computerId), detail: this.service.getDetalle(this.computerId) }).subscribe(({ enrichment, detail }) => {
      if (enrichment) this.form = enrichment;
      this.originalFabricanteOverride = this.form.fabricanteOverride;
      this.originalModeloOverride = this.form.modeloOverride;
      this.detail.set(detail.equipo);
      this.teclado.set(detail.teclado);
      this.effectiveType.set(detail.tipoEfectivo || detail.equipo.tipoEquipo);
      this.mostrarMonitor2.set(Boolean(
        detail.equipo.monitor2Nombre || this.form.monitor2FabricanteOverride ||
        this.form.monitor2ModeloOverride || this.form.monitor2NumeroSerieOverride ||
        this.form.monitor2CodigoPatrimonial || this.form.monitor2CodigoInternoOverride
      ));
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
      monitorFabricanteOverride: null,
      monitorModeloOverride: null,
      monitorNumeroSerieOverride: null,
      monitorCodigoPatrimonial: null,
      monitorCodigoInternoOverride: null,
      monitor2FabricanteOverride: null,
      monitor2ModeloOverride: null,
      monitor2NumeroSerieOverride: null,
      monitor2CodigoPatrimonial: null,
      monitor2CodigoInternoOverride: null,
      estadoDepuracion: null,
      observaciones: null,
      revisadoPor: null,
      fechaRevision: null,
    };
  }
}
