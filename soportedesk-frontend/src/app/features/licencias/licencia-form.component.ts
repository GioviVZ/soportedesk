import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoBien, TipoLicencia } from '../../core/models/catalogo.model';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import { Licencia, LicenciaActivacion, LicenciaRequest } from './licencia.model';
import { LicenciaService } from './licencia.service';

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
    serialActivacion: [''],
    ordenCompra: ['', Validators.required],
    anio: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    activaciones: this.fb.array([this.createActivacionGroup()]),
  });

  get activacionesArray() {
    return this.form.controls.activaciones;
  }

  ngOnInit(): void {
    this.catalogoService.getTiposLicencia().subscribe((data) => (this.tiposLicencia = data));
    this.catalogoService.getTiposBien().subscribe((data) => (this.tiposBien = data));
  }

  ngOnChanges(): void {
    if (this.licencia) {
      this.tipoLicenciaId = this.licencia.tipoLicencia?.id ?? null;
      this.tipoBienId = this.licencia.tipoBien?.id ?? null;
      this.form.patchValue({
        descripcion: this.licencia.descripcion,
        serialActivacion: this.licencia.serialActivacion ?? '',
        ordenCompra: this.licencia.ordenCompra,
        anio: this.licencia.anio,
        cantidad: this.licencia.cantidad,
      });
      this.setActivaciones(this.initialActivaciones(this.licencia));
    } else {
      this.tipoLicenciaId = null;
      this.tipoBienId = null;
      this.form.reset({
        descripcion: '',
        serialActivacion: '',
        ordenCompra: '',
        anio: '',
        cantidad: 1,
      });
      this.setActivaciones([this.emptyActivacion()]);
    }
  }

  onTipoLicenciaChange(value: string): void {
    this.tipoLicenciaId = value ? Number(value) : null;
  }

  onTipoBienChange(value: string): void {
    this.tipoBienId = value ? Number(value) : null;
  }

  addActivacion(): void {
    this.activacionesArray.push(this.createActivacionGroup());
  }

  removeActivacion(index: number): void {
    this.activacionesArray.removeAt(index);
    if (this.activacionesArray.length === 0) {
      this.addActivacion();
    }
  }

  submit(): void {
    if (this.form.invalid || !this.tipoLicenciaId || !this.tipoBienId) {
      return;
    }
    const activaciones = this.normalizedActivaciones();
    if (activaciones === null) {
      alert('Cada cuenta de activacion debe tener su clave, y cada clave debe tener una cuenta.');
      return;
    }
    const raw = this.form.getRawValue();
    const request: LicenciaRequest = {
      tipoLicenciaId: this.tipoLicenciaId,
      tipoBienId: this.tipoBienId,
      descripcion: raw.descripcion,
      activaciones,
      cuentaActivacion: activaciones[0]?.cuentaActivacion,
      claveActivacion: activaciones[0]?.claveActivacion,
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

  private setActivaciones(items: LicenciaActivacion[]): void {
    this.activacionesArray.clear();
    for (const item of items.length ? items : [this.emptyActivacion()]) {
      this.activacionesArray.push(this.createActivacionGroup(item));
    }
  }

  private createActivacionGroup(value?: Partial<LicenciaActivacion>) {
    return this.fb.nonNullable.group({
      cuentaActivacion: [value?.cuentaActivacion ?? ''],
      claveActivacion: [value?.claveActivacion ?? ''],
    });
  }

  private initialActivaciones(licencia: Licencia): LicenciaActivacion[] {
    if (licencia.activaciones?.length) {
      return licencia.activaciones.map((item) => ({
        id: item.id,
        cuentaActivacion: item.cuentaActivacion ?? '',
        claveActivacion: item.claveActivacion ?? '',
      }));
    }
    if (licencia.cuentaActivacion || licencia.claveActivacion) {
      return [{
        cuentaActivacion: licencia.cuentaActivacion ?? '',
        claveActivacion: licencia.claveActivacion ?? '',
      }];
    }
    return [this.emptyActivacion()];
  }

  private normalizedActivaciones(): LicenciaActivacion[] | null {
    const result: LicenciaActivacion[] = [];
    for (const group of this.activacionesArray.controls) {
      const cuentaActivacion = group.controls.cuentaActivacion.value.trim();
      const claveActivacion = group.controls.claveActivacion.value.trim();
      if (!cuentaActivacion && !claveActivacion) {
        continue;
      }
      if (!cuentaActivacion || !claveActivacion) {
        return null;
      }
      result.push({ cuentaActivacion, claveActivacion });
    }
    return result;
  }

  private emptyActivacion(): LicenciaActivacion {
    return { cuentaActivacion: '', claveActivacion: '' };
  }
}
