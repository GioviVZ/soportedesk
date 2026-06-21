import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Licencia, LicenciaRequest } from './licencia.model';
import { LicenciaService } from './licencia.service';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { TipoBien, TipoLicencia } from '../../core/models/catalogo.model';

@Component({
  selector: 'app-licencia-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './licencia-form.component.html',
  styleUrl: './licencia-form.component.scss',
})
export class LicenciaFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(LicenciaService);
  private catalogoService = inject(CatalogoService);

  @Input() licencia: Licencia | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  tiposLicencia: TipoLicencia[] = [];
  tiposBien: TipoBien[] = [];
  tipoLicenciaId: number | null = null;
  tipoBienId: number | null = null;

  form = this.fb.nonNullable.group({
    descripcion: ['', Validators.required],
    cuentaActivacion: [''],
    claveActivacion: [''],
    serialActivacion: [''],
    ordenCompra: ['', Validators.required],
    anio: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.catalogoService.getTiposLicencia().subscribe((data) => (this.tiposLicencia = data));
    this.catalogoService.getTiposBien().subscribe((data) => (this.tiposBien = data));
    this.form.controls.cuentaActivacion.valueChanges.subscribe(() => this.syncClaveActivacionState());
    this.syncClaveActivacionState();
  }

  ngOnChanges(): void {
    if (this.licencia) {
      this.tipoLicenciaId = this.licencia.tipoLicencia?.id ?? null;
      this.tipoBienId = this.licencia.tipoBien?.id ?? null;
      this.form.patchValue({
        descripcion: this.licencia.descripcion,
        cuentaActivacion: this.licencia.cuentaActivacion ?? '',
        claveActivacion: this.licencia.claveActivacion ?? '',
        serialActivacion: this.licencia.serialActivacion ?? '',
        ordenCompra: this.licencia.ordenCompra,
        anio: this.licencia.anio,
        cantidad: this.licencia.cantidad,
      });
    } else {
      this.tipoLicenciaId = null;
      this.tipoBienId = null;
      this.form.reset({
        descripcion: '',
        cuentaActivacion: '',
        claveActivacion: '',
        serialActivacion: '',
        ordenCompra: '',
        anio: '',
        cantidad: 1,
      });
    }
    this.syncClaveActivacionState();
  }

  onTipoLicenciaChange(value: string): void {
    this.tipoLicenciaId = value ? Number(value) : null;
  }

  onTipoBienChange(value: string): void {
    this.tipoBienId = value ? Number(value) : null;
  }

  private syncClaveActivacionState(): void {
    const cuenta = this.form.controls.cuentaActivacion.value;
    if (cuenta && cuenta.trim()) {
      this.form.controls.claveActivacion.enable({ emitEvent: false });
    } else {
      this.form.controls.claveActivacion.setValue('', { emitEvent: false });
      this.form.controls.claveActivacion.disable({ emitEvent: false });
    }
  }

  submit(): void {
    if (this.form.invalid || !this.tipoLicenciaId || !this.tipoBienId) {
      return;
    }
    const raw = this.form.getRawValue();
    const request: LicenciaRequest = {
      tipoLicenciaId: this.tipoLicenciaId,
      tipoBienId: this.tipoBienId,
      descripcion: raw.descripcion,
      cuentaActivacion: raw.cuentaActivacion || undefined,
      claveActivacion: raw.claveActivacion || undefined,
      serialActivacion: raw.serialActivacion || undefined,
      ordenCompra: raw.ordenCompra,
      anio: raw.anio,
      cantidad: raw.cantidad,
    };
    const obs = this.licencia
      ? this.service.update(this.licencia.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
