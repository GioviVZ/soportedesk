import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoService, Sede } from '@soportedesk/core';
import { SectionCardComponent, UbicacionSelectComponent } from '@soportedesk/ui';
import { MapPickerComponent } from '@soportedesk/ui/map';
import {
  EQUIPO_RED_ESTADOS,
  EquipoRed,
  EquipoRedRequest,
  EstadoEquipoRed,
  TIPO_EQUIPO_RED_META,
  TipoEquipoRed,
} from './equipo-red.model';
import { EquipoRedService } from './equipo-red.service';

const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const MAC_PATTERN = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;

@Component({
  selector: 'app-equipo-red-form',
  imports: [ReactiveFormsModule, UbicacionSelectComponent, SectionCardComponent, MapPickerComponent],
  templateUrl: './equipo-red-form.component.html',
  styleUrl: './equipo-red-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class EquipoRedFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EquipoRedService);
  private readonly catalogoService = inject(CatalogoService);

  @Input() tipo: TipoEquipoRed = 'SWITCH';
  @Input() equipo: EquipoRed | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly estadoOptions = EQUIPO_RED_ESTADOS;
  readonly marcas = ['Cisco', 'Aruba', 'HPE', 'Ubiquiti', 'Huawei', 'MikroTik', 'TP-Link', 'Fortinet', 'Ruckus', 'Cambium'];

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  remotoSedes: Sede[] = [];
  saving = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    referencia: [''],
    latitud: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    longitud: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    edificio: [''],
    piso: [''],
    gabinete: [''],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    serie: [''],
    codigoPatrimonial: [''],
    codigoInventario: [''],
    etiqueta: [''],
    mac: ['', Validators.pattern(MAC_PATTERN)],
    ip: ['', Validators.pattern(IPV4_PATTERN)],
    ipPorDefecto: ['', Validators.pattern(IPV4_PATTERN)],
    host: [''],
    estado: ['Operativo' as EstadoEquipoRed, Validators.required],
    remotoSedeId: [null as number | null],
    remotoReferencia: [''],
    frecuenciaGhz: [null as number | null],
    anchoCanalMhz: [null as number | null, Validators.pattern(/^\d+$/)],
    ssidEnlace: [''],
    observaciones: [''],
  });

  get meta() {
    return TIPO_EQUIPO_RED_META[this.tipo];
  }

  get etiquetaPrefix(): string {
    return ({ SWITCH: 'SW', ROUTER: 'RT', ACCESS_POINT: 'AP', RADIOENLACE: 'RE' } as const)[this.tipo];
  }

  ngOnInit(): void {
    this.catalogoService.getSedes().subscribe((sedes) => (this.remotoSedes = sedes));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equipo'] || changes['tipo']) {
      this.resetForm();
    }
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
    const isRadioenlace = this.tipo === 'RADIOENLACE';
    const request: EquipoRedRequest = {
      ...values,
      tipo: this.tipo,
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
      remotoSedeId: isRadioenlace ? values.remotoSedeId : null,
      remotoReferencia: isRadioenlace ? values.remotoReferencia : '',
      frecuenciaGhz: isRadioenlace ? values.frecuenciaGhz : null,
      anchoCanalMhz: isRadioenlace ? values.anchoCanalMhz : null,
      ssidEnlace: isRadioenlace ? values.ssidEnlace : '',
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
        this.errorMessage = error?.error?.message || 'No se pudo guardar el equipo de red.';
      },
    });
  }

  private resetForm(): void {
    this.saving = false;
    this.errorMessage = '';
    this.sedeId = this.equipo?.sede?.id ?? null;
    this.dependenciaId = this.equipo?.dependencia?.id ?? null;
    this.subdependenciaId = this.equipo?.subdependencia?.id ?? null;
    this.form.reset({
      referencia: this.equipo?.referencia ?? '',
      latitud: this.equipo?.latitud ?? null,
      longitud: this.equipo?.longitud ?? null,
      edificio: this.equipo?.edificio ?? '',
      piso: this.equipo?.piso ?? '',
      gabinete: this.equipo?.gabinete ?? '',
      marca: this.equipo?.marca ?? '',
      modelo: this.equipo?.modelo ?? '',
      serie: this.equipo?.serie ?? '',
      codigoPatrimonial: this.equipo?.codigoPatrimonial ?? '',
      codigoInventario: this.equipo?.codigoInventario ?? '',
      etiqueta: this.equipo?.etiqueta ?? '',
      mac: this.equipo?.mac ?? '',
      ip: this.equipo?.ip ?? '',
      ipPorDefecto: this.equipo?.ipPorDefecto ?? '',
      host: this.equipo?.host ?? '',
      estado: this.equipo?.estado ?? 'Operativo',
      remotoSedeId: this.equipo?.remotoSede?.id ?? null,
      remotoReferencia: this.equipo?.remotoReferencia ?? '',
      frecuenciaGhz: this.equipo?.frecuenciaGhz ?? null,
      anchoCanalMhz: this.equipo?.anchoCanalMhz ?? null,
      ssidEnlace: this.equipo?.ssidEnlace ?? '',
      observaciones: this.equipo?.observaciones ?? '',
    });
  }
}
