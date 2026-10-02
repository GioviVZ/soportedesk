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
  AsignacionAnexo,
  AsignacionAnexoRequest,
  EstadoAsignacionAnexo,
} from './asignacion-anexo.model';
import { AsignacionAnexoService } from './asignacion-anexo.service';
import { TelefonoFijo } from './telefono-fijo.model';
import {
  ANEXO_PATTERN,
  DNI_PATTERN,
  NUMERO_DIRECTO_PATTERN,
  telefonoIdentifier,
  todayIso,
} from './telefonia-fija-shared';

export const asignacionFechasValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const estado = control.get('estado')?.value as EstadoAsignacionAnexo | undefined;
  const fechaInicio = String(control.get('fechaInicio')?.value ?? '');
  const fechaFin = String(control.get('fechaFin')?.value ?? '');
  if (estado === 'Finalizada' && !fechaFin) return { fechaFinRequerida: true };
  if (fechaInicio && fechaFin && fechaFin < fechaInicio) return { fechaFinAnterior: true };
  return null;
};

@Component({
  selector: 'app-asignacion-anexo-form',
  imports: [ReactiveFormsModule, SectionCardComponent],
  templateUrl: './asignacion-anexo-form.component.html',
  styleUrl: './asignacion-anexo-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AsignacionAnexoFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AsignacionAnexoService);
  private readonly catalogoService = inject(CatalogoService);

  @Input() asignacion: AsignacionAnexo | null = null;
  @Input() telefonos: TelefonoFijo[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly estados: EstadoAsignacionAnexo[] = ['Activa', 'Finalizada'];
  dependencias: Dependencia[] = [];
  saving = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    telefonoFijoId: [null as number | null, Validators.required],
    anexo: ['', [Validators.required, Validators.pattern(ANEXO_PATTERN)]],
    numeroDirecto: ['', Validators.pattern(NUMERO_DIRECTO_PATTERN)],
    personaNombre: ['', Validators.required],
    personaDni: ['', Validators.pattern(DNI_PATTERN)],
    dependenciaId: [null as number | null],
    fechaInicio: [todayIso(), Validators.required],
    fechaFin: [''],
    estado: ['Activa' as EstadoAsignacionAnexo, Validators.required],
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

  telefonoOption(telefono: TelefonoFijo): string {
    return [
      telefonoIdentifier(telefono),
      `${telefono.marca} ${telefono.modelo}`.trim(),
      telefono.ip || 'Sin IP',
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
    if (values.telefonoFijoId === null) return;
    const request: AsignacionAnexoRequest = {
      ...values,
      telefonoFijoId: values.telefonoFijoId,
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
        this.errorMessage = error?.error?.message || 'No se pudo guardar la asignación de anexo.';
      },
    });
  }

  private resetForm(): void {
    this.saving = false;
    this.errorMessage = '';
    this.form.reset({
      telefonoFijoId: this.asignacion?.telefonoFijo.id ?? null,
      anexo: this.asignacion?.anexo ?? '',
      numeroDirecto: this.asignacion?.numeroDirecto ?? '',
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
