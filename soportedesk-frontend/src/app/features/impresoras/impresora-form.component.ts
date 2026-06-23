import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IMPRESORA_ESTADOS, Impresora, ImpresoraRequest } from './impresora.model';
import { ImpresoraService } from './impresora.service';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { TipoImpresora } from '../../core/models/catalogo.model';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-impresora-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UbicacionSelectComponent,
    SectionCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './impresora-form.component.html',
  styleUrl: './impresora-form.component.scss',
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
  readonly estadoOptions = IMPRESORA_ESTADOS;

  form = this.fb.nonNullable.group({
    marca:              ['', Validators.required],
    modelo:             ['', Validators.required],
    tipoImpresoraId:    [null as number | null],
    serie:              [''],
    codigoInventario:   [''],
    codigoPatrimonial:  [''],
    tipoConexion:       ['USB', Validators.required],
    ip:                 [''],
    estado:             ['Activa', Validators.required],
    modeloTonerNegro:   [''],
    modeloTonerC:       [''],
    modeloTonerM:       [''],
    modeloTonerY:       [''],
  });

  constructor() {
    this.form.get('tipoConexion')!.valueChanges.subscribe((value) => {
      if (value === 'USB') {
        this.form.patchValue({ ip: '' });
      }
    });
  }

  ngOnInit(): void {
    this.catalogoService.getTiposImpresora().subscribe((data) => (this.tiposImpresora = data));
  }

  ngOnChanges(): void {
    if (this.impresora) {
      this.sedeId           = this.impresora.sede?.id ?? null;
      this.dependenciaId    = this.impresora.dependencia?.id ?? null;
      this.subdependenciaId = this.impresora.subdependencia?.id ?? null;
      this.form.patchValue({
        marca:             this.impresora.marca,
        modelo:            this.impresora.modelo,
        tipoImpresoraId:   this.impresora.tipoImpresora?.id ?? null,
        serie:             this.impresora.serie ?? '',
        codigoInventario:  this.impresora.codigoInventario ?? '',
        codigoPatrimonial: this.impresora.codigoPatrimonial ?? '',
        tipoConexion:      this.impresora.tipoConexion,
        ip:                this.impresora.ip,
        estado:            this.impresora.estado,
        modeloTonerNegro:  this.impresora.modeloTonerNegro ?? '',
        modeloTonerC:      this.impresora.modeloTonerC     ?? '',
        modeloTonerM:      this.impresora.modeloTonerM     ?? '',
        modeloTonerY:      this.impresora.modeloTonerY     ?? '',
      });
    } else {
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.form.reset({
        marca: '', modelo: '',
        tipoImpresoraId: null, serie: '', codigoInventario: '', codigoPatrimonial: '',
        tipoConexion: 'USB', ip: '',
        estado: 'Activa',
        modeloTonerNegro: '', modeloTonerC: '', modeloTonerM: '', modeloTonerY: '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const request: ImpresoraRequest = {
      ...this.form.getRawValue(),
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
    };
    const obs = this.impresora
      ? this.service.update(this.impresora.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
