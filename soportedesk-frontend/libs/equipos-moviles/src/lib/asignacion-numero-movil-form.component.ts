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
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CatalogoService, Dependencia } from '@soportedesk/core';
import { SectionCardComponent } from '@soportedesk/ui';
import {
  AsignacionNumeroMovil,
  AsignacionNumeroMovilRequest,
  EstadoAsignacionMovil,
  OperadorMovil,
} from './asignacion-numero-movil.model';
import { AsignacionNumeroMovilService } from './asignacion-numero-movil.service';
import { EquipoMovil } from './equipo-movil.model';
import { DNI_PATTERN, ICCID_PATTERN, NUMERO_MOVIL_PATTERN, equipoIdentifier, todayIso } from './moviles-shared';

export const asignacionFechasValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const estado = control.get('estado')?.value as EstadoAsignacionMovil | undefined;
  const fechaInicio = String(control.get('fechaInicio')?.value ?? '');
  const fechaFin = String(control.get('fechaFin')?.value ?? '');
  if (estado === 'Finalizada' && !fechaFin) return { fechaFinRequerida: true };
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) return { fechaFinAnterior: true };
  return null;
};

@Component({
  selector: 'app-asignacion-numero-movil-form',
  imports: [ReactiveFormsModule, SectionCardComponent],
  templateUrl: './asignacion-numero-movil-form.component.html',
  styleUrl: './asignacion-numero-movil-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AsignacionNumeroMovilFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AsignacionNumeroMovilService);
  private readonly catalogoService = inject(CatalogoService);

  @Input() asignacion: AsignacionNumeroMovil | null = null;
  @Input() equipos: EquipoMovil[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly operadores: OperadorMovil[] = ['Claro', 'Movistar', 'Entel', 'Bitel', 'Otro'];
  readonly estados: EstadoAsignacionMovil[] = ['Activa', 'Finalizada'];
  dependencias: Dependencia[] = [];
  saving = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    equipoMovilId: [null as number | null, Validators.required],
    numero: ['', [Validators.required, Validators.pattern(NUMERO_MOVIL_PATTERN)]],
    operador: ['Claro' as OperadorMovil, Validators.required],
    plan: [''],
    simIccid: ['', Validators.pattern(ICCID_PATTERN)],
    personaNombre: ['', Validators.required],
    personaDni: ['', Validators.pattern(DNI_PATTERN)],
    dependenciaId: [null as number | null],
    fechaInicio: [todayIso(), Validators.required],
    fechaFin: [''],
    estado: ['Activa' as EstadoAsignacionMovil, Validators.required],
    observaciones: [''],
  }, { validators: asignacionFechasValidator });

  ngOnInit(): void {
    this.catalogoService.getDependencias().subscribe((items) => (this.dependencias = items));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['asignacion']) this.resetForm();
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control?.invalid && (control.dirty || control.touched));
  }

  equipoOption(equipo: EquipoMovil): string {
    return [
      equipoIdentifier(equipo),
      `${equipo.marca} ${equipo.modelo}`.trim(),
      equipo.imei1 || 'Sin IMEI',
    ].join(' · ');
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
    const values = this.form.getRawValue();
    if (values.equipoMovilId === null) return;
    const request: AsignacionNumeroMovilRequest = {
      ...values,
      equipoMovilId: values.equipoMovilId,
      fechaFin: values.fechaFin || null,
    };
    this.saving = true;
    this.errorMessage = '';
    const operation = this.asignacion
      ? this.service.update(this.asignacion.id, request)
      : this.service.create(request);
    operation.subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'No se pudo guardar la asignación.';
      },
    });
  }

  private resetForm(): void {
    this.saving = false;
    this.errorMessage = '';
    this.form.reset({
      equipoMovilId: this.asignacion?.equipoMovil.id ?? null,
      numero: this.asignacion?.numero ?? '',
      operador: this.asignacion?.operador ?? 'Claro',
      plan: this.asignacion?.plan ?? '',
      simIccid: this.asignacion?.simIccid ?? '',
      personaNombre: this.asignacion?.personaNombre ?? '',
      personaDni: this.asignacion?.personaDni ?? '',
      dependenciaId: this.asignacion?.dependencia?.id ?? null,
      fechaInicio: this.asignacion?.fechaInicio ?? todayIso(),
      fechaFin: this.asignacion?.fechaFin ?? '',
      estado: this.asignacion?.estado ?? 'Activa',
      observaciones: this.asignacion?.observaciones ?? '',
    });
  }
}
