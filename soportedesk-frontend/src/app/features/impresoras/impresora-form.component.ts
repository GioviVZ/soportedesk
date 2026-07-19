import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IMPRESORA_ESTADOS, Impresora, ImpresoraRequest } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { MarcaImpresora, ModeloImpresora, TipoImpresora } from '../../core/models/catalogo.model';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
    selector: 'app-impresora-form',
    imports: [
    ReactiveFormsModule,
    UbicacionSelectComponent,
    SectionCardComponent,
    StatusBadgeComponent
],
    templateUrl: './impresora-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './impresora-form.component.scss'
})
export class ImpresoraFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(ImpresoraService);
  private catalogoService = inject(CatalogoService);

  @Input() impresora: Impresora | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  tiposImpresora: TipoImpresora[] = [];
  marcas: MarcaImpresora[] = [];
  modelos: ModeloImpresora[] = [];
  marcaId: number | null = null;
  readonly estadoOptions = IMPRESORA_ESTADOS;
  saving = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    modeloImpresoraId: [null as number | null, Validators.required],
    tipoImpresoraId:   [null as number | null],
    serie:              [''],
    codigoInventario:   [''],
    codigoPatrimonial:  [''],
    referencia:         [''],
    tipoConexion:       ['USB', Validators.required],
    ip:                 [''],
    estado:             ['Activa', Validators.required],
  });

  get modeloSeleccionado(): ModeloImpresora | null {
    const id = this.form.value.modeloImpresoraId;
    return this.modelos.find((m) => m.id === id) ?? null;
  }

  constructor() {
    this.form.get('tipoConexion')!.valueChanges.subscribe((value) => {
      if (value === 'USB') {
        this.form.patchValue({ ip: '' });
      }
    });
  }

  ngOnInit(): void {
    this.catalogoService.getTiposImpresora().subscribe((data) => (this.tiposImpresora = data));
    this.catalogoService.getMarcasImpresora().subscribe((data) => (this.marcas = data));
  }

  ngOnChanges(): void {
    this.errorMessage = '';
    this.saving = false;
    if (this.impresora) {
      this.sedeId           = this.impresora.sede?.id ?? null;
      this.dependenciaId    = this.impresora.dependencia?.id ?? null;
      this.subdependenciaId = this.impresora.subdependencia?.id ?? null;
      this.marcaId           = this.impresora.modeloImpresora?.marca?.id ?? null;
      this.modelos = this.impresora.modeloImpresora ? [this.impresora.modeloImpresora] : [];
      if (this.marcaId) {
        this.catalogoService.getModelosImpresora(this.marcaId).subscribe((data) => (this.modelos = data));
      }
      this.form.patchValue({
        modeloImpresoraId: this.impresora.modeloImpresora?.id ?? null,
        tipoImpresoraId:   this.impresora.tipoImpresora?.id ?? null,
        serie:             this.impresora.serie ?? '',
        codigoInventario:  this.impresora.codigoInventario ?? '',
        codigoPatrimonial: this.impresora.codigoPatrimonial ?? '',
        referencia:        this.impresora.referencia ?? '',
        tipoConexion:      this.impresora.tipoConexion,
        ip:                this.impresora.ip,
        estado:            this.impresora.estado,
      });
    } else {
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.marcaId = null;
      this.modelos = [];
      this.form.reset({
        modeloImpresoraId: null,
        tipoImpresoraId: null, serie: '', codigoInventario: '', codigoPatrimonial: '',
        referencia: '',
        tipoConexion: 'USB', ip: '',
        estado: 'Activa',
      });
    }
  }

  onMarcaChange(value: string): void {
    this.marcaId = value ? Number(value) : null;
    this.modelos = [];
    this.form.patchValue({ modeloImpresoraId: null });
    if (this.marcaId) {
      this.catalogoService.getModelosImpresora(this.marcaId).subscribe((data) => (this.modelos = data));
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving) return;
    this.errorMessage = '';
    this.saving = true;
    const request: ImpresoraRequest = {
      ...this.form.getRawValue(),
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
    };
    const obs = this.impresora
      ? this.service.update(this.impresora.id, request)
      : this.service.create(request);
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'No se pudo guardar la impresora.';
      },
    });
  }
}
