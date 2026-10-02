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
import { EquipoMovil, EquipoMovilRequest, EstadoEquipoMovil, TipoEquipoMovil } from './equipo-movil.model';
import { EquipoMovilService } from './equipo-movil.service';
import {
  EQUIPO_MOVIL_ESTADOS,
  MAC_PATTERN,
  imeiValidator,
  imeisDistintosValidator,
} from './moviles-shared';

@Component({
  selector: 'app-equipo-movil-form',
  imports: [ReactiveFormsModule, UbicacionSelectComponent, SectionCardComponent],
  templateUrl: './equipo-movil-form.component.html',
  styleUrl: './equipo-movil-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EquipoMovilFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EquipoMovilService);

  @Input() equipo: EquipoMovil | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly estados = EQUIPO_MOVIL_ESTADOS;
  readonly tipos: { value: TipoEquipoMovil; label: string }[] = [
    { value: 'SMARTPHONE', label: 'Smartphone' },
    { value: 'TABLET', label: 'Tablet' },
    { value: 'MODEM', label: 'Módem' },
  ];
  readonly marcas = ['Samsung', 'Apple', 'Xiaomi', 'Motorola', 'Huawei', 'Lenovo', 'ZTE', 'TP-Link'];

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  saving = false;
  errorMessage = '';
  geolocationStatus = '';

  readonly form = this.fb.nonNullable.group({
    tipo: ['SMARTPHONE' as TipoEquipoMovil, Validators.required],
    referencia: [''],
    latitud: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    longitud: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    edificio: [''],
    piso: [''],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    serie: [''],
    imei1: ['', imeiValidator],
    imei2: ['', imeiValidator],
    codigoPatrimonial: [''],
    codigoInventario: [''],
    estado: ['Operativo' as EstadoEquipoMovil, Validators.required],
    sistemaOperativo: [''],
    almacenamiento: [''],
    mac: ['', Validators.pattern(MAC_PATTERN)],
    observaciones: [''],
  }, { validators: imeisDistintosValidator });

  get hasCoordinates(): boolean {
    const { latitud, longitud } = this.form.getRawValue();
    return latitud !== null && longitud !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equipo']) this.resetForm();
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control?.invalid && (control.dirty || control.touched));
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.geolocationStatus = 'El GPS no está disponible en este dispositivo.';
      return;
    }
    this.geolocationStatus = 'Obteniendo ubicación...';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.patchValue({
          latitud: Number(position.coords.latitude.toFixed(6)),
          longitud: Number(position.coords.longitude.toFixed(6)),
        });
        this.geolocationStatus = 'Ubicación obtenida correctamente.';
      },
      () => {
        this.geolocationStatus = 'No fue posible acceder a tu ubicación.';
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  openMap(): void {
    if (!this.hasCoordinates) return;
    const { latitud, longitud } = this.form.getRawValue();
    window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, '_blank', 'noopener');
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
    const request: EquipoMovilRequest = {
      ...values,
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
    };
    const operation = this.equipo
      ? this.service.update(this.equipo.id, request)
      : this.service.create(request);
    operation.subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'No se pudo guardar el equipo móvil.';
      },
    });
  }

  private resetForm(): void {
    this.saving = false;
    this.errorMessage = '';
    this.geolocationStatus = '';
    this.sedeId = this.equipo?.sede?.id ?? null;
    this.dependenciaId = this.equipo?.dependencia?.id ?? null;
    this.subdependenciaId = this.equipo?.subdependencia?.id ?? null;
    this.form.reset({
      tipo: this.equipo?.tipo ?? 'SMARTPHONE',
      referencia: this.equipo?.referencia ?? '',
      latitud: this.equipo?.latitud ?? null,
      longitud: this.equipo?.longitud ?? null,
      edificio: this.equipo?.edificio ?? '',
      piso: this.equipo?.piso ?? '',
      marca: this.equipo?.marca ?? '',
      modelo: this.equipo?.modelo ?? '',
      serie: this.equipo?.serie ?? '',
      imei1: this.equipo?.imei1 ?? '',
      imei2: this.equipo?.imei2 ?? '',
      codigoPatrimonial: this.equipo?.codigoPatrimonial ?? '',
      codigoInventario: this.equipo?.codigoInventario ?? '',
      estado: this.equipo?.estado ?? 'Operativo',
      sistemaOperativo: this.equipo?.sistemaOperativo ?? '',
      almacenamiento: this.equipo?.almacenamiento ?? '',
      mac: this.equipo?.mac ?? '',
      observaciones: this.equipo?.observaciones ?? '',
    });
  }
}
