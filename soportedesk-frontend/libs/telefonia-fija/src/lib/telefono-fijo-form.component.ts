import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SectionCardComponent, UbicacionSelectComponent } from '@soportedesk/ui';
import { MapPickerComponent } from '@soportedesk/ui/map';
import { TelefonoFijo, TelefonoFijoRequest, EstadoTelefonoFijo, TipoTelefonoFijo } from './telefono-fijo.model';
import { TelefonoFijoService } from './telefono-fijo.service';
import { IPV4_PATTERN, MAC_PATTERN, TELEFONO_FIJO_ESTADOS } from './telefonia-fija-shared';

@Component({
  selector: 'app-telefono-fijo-form',
  imports: [ReactiveFormsModule, UbicacionSelectComponent, SectionCardComponent, MapPickerComponent],
  templateUrl: './telefono-fijo-form.component.html',
  styleUrl: './telefono-fijo-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TelefonoFijoFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(TelefonoFijoService);

  @Input() telefono: TelefonoFijo | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly estados = TELEFONO_FIJO_ESTADOS;
  readonly tipos: { value: TipoTelefonoFijo; label: string }[] = [
    { value: 'IP', label: 'Teléfono IP' },
    { value: 'ANALOGICO', label: 'Analógico' },
    { value: 'INALAMBRICO', label: 'Inalámbrico' },
  ];
  readonly marcas = [
    'Yealink',
    'Grandstream',
    'Cisco',
    'Panasonic',
    'Alcatel-Lucent',
    'Avaya',
    'Polycom',
    'Fanvil',
    'Siemens',
  ];

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  saving = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    tipo: ['IP' as TipoTelefonoFijo, Validators.required],
    referencia: [''],
    latitud: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    longitud: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    edificio: [''],
    piso: [''],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    serie: [''],
    codigoPatrimonial: [''],
    codigoInventario: [''],
    estado: ['Operativo' as EstadoTelefonoFijo, Validators.required],
    mac: ['', Validators.pattern(MAC_PATTERN)],
    ip: ['', Validators.pattern(IPV4_PATTERN)],
    host: [''],
    observaciones: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['telefono']) this.resetForm();
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control?.invalid && (control.dirty || control.touched));
  }

  onCoordenadas(coordinates: { latitud: number; longitud: number }): void {
    this.form.patchValue(coordinates);
    this.form.controls.latitud.markAsDirty();
    this.form.controls.longitud.markAsDirty();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submit();
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    const values = this.form.getRawValue();
    const request: TelefonoFijoRequest = {
      ...values,
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
    };
    const operation = this.telefono
      ? this.service.update(this.telefono.id, request)
      : this.service.create(request);
    operation.subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'No se pudo guardar el teléfono fijo.';
      },
    });
  }

  private resetForm(): void {
    this.saving = false;
    this.errorMessage = '';
    this.sedeId = this.telefono?.sede?.id ?? null;
    this.dependenciaId = this.telefono?.dependencia?.id ?? null;
    this.subdependenciaId = this.telefono?.subdependencia?.id ?? null;
    this.form.reset({
      tipo: this.telefono?.tipo ?? 'IP',
      referencia: this.telefono?.referencia ?? '',
      latitud: this.telefono?.latitud ?? null,
      longitud: this.telefono?.longitud ?? null,
      edificio: this.telefono?.edificio ?? '',
      piso: this.telefono?.piso ?? '',
      marca: this.telefono?.marca ?? '',
      modelo: this.telefono?.modelo ?? '',
      serie: this.telefono?.serie ?? '',
      codigoPatrimonial: this.telefono?.codigoPatrimonial ?? '',
      codigoInventario: this.telefono?.codigoInventario ?? '',
      estado: this.telefono?.estado ?? 'Operativo',
      mac: this.telefono?.mac ?? '',
      ip: this.telefono?.ip ?? '',
      host: this.telefono?.host ?? '',
      observaciones: this.telefono?.observaciones ?? '',
    });
  }
}
