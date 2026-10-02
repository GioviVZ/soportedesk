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
import { CatalogoService, Dependencia } from '@soportedesk/core';
import { SectionCardComponent } from '@soportedesk/ui';
import { ActaMovil, ActaMovilRequest, TipoActaMovil } from './acta-movil.model';
import { ActaMovilService } from './acta-movil.service';
import { EquipoMovil } from './equipo-movil.model';
import { DNI_PATTERN, equipoIdentifier, normalizeText, todayIso } from './moviles-shared';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

@Component({
  selector: 'app-acta-movil-form',
  imports: [ReactiveFormsModule, SectionCardComponent],
  templateUrl: './acta-movil-form.component.html',
  styleUrl: './acta-movil-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ActaMovilFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ActaMovilService);
  private readonly catalogoService = inject(CatalogoService);

  @Input() acta: ActaMovil | null = null;
  @Input() equipos: EquipoMovil[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly tipos: TipoActaMovil[] = ['Entrega', 'Devolución', 'Transferencia'];
  dependencias: Dependencia[] = [];
  equipoSearch = '';
  selectedFile: File | null = null;
  removeExistingFile = false;
  fileError = '';
  errorMessage = '';
  saving = false;
  private persistedActa: ActaMovil | null = null;

  readonly form = this.fb.nonNullable.group({
    numeroActa: ['', Validators.required],
    tipo: ['Entrega' as TipoActaMovil, Validators.required],
    fecha: [todayIso(), Validators.required],
    personaNombre: ['', Validators.required],
    personaDni: ['', Validators.pattern(DNI_PATTERN)],
    dependenciaId: [null as number | null],
    equipoMovilIds: [[] as number[], Validators.required],
    observaciones: [''],
  });

  get filteredEquipos(): EquipoMovil[] {
    const search = normalizeText(this.equipoSearch);
    if (!search) return this.equipos;
    return this.equipos.filter((equipo) => normalizeText([
      equipoIdentifier(equipo),
      equipo.marca,
      equipo.modelo,
      equipo.imei1,
      equipo.imei2,
    ].filter(Boolean).join(' ')).includes(search));
  }

  get selectedCount(): number {
    return this.form.controls.equipoMovilIds.value.length;
  }

  ngOnInit(): void {
    this.catalogoService.getDependencias().subscribe((items) => (this.dependencias = items));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['acta']) this.resetForm();
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

  isSelected(id: number): boolean {
    return this.form.controls.equipoMovilIds.value.includes(id);
  }

  toggleEquipo(id: number, checked: boolean): void {
    const current = this.form.controls.equipoMovilIds.value;
    const next = checked
      ? Array.from(new Set([...current, id]))
      : current.filter((equipoId) => equipoId !== id);
    this.form.controls.equipoMovilIds.setValue(next);
    this.form.controls.equipoMovilIds.markAsTouched();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileError = '';
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const allowedExtension = ALLOWED_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
    if (!ALLOWED_FILE_TYPES.has(file.type) || !allowedExtension) {
      this.selectedFile = null;
      input.value = '';
      this.fileError = 'Selecciona un archivo PDF, JPG o PNG.';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      this.selectedFile = null;
      input.value = '';
      this.fileError = 'El archivo no debe superar los 10 MB.';
      return;
    }
    this.selectedFile = file;
    this.removeExistingFile = false;
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.fileError = '';
  }

  removeCurrentFile(): void {
    this.selectedFile = null;
    this.removeExistingFile = true;
    this.fileError = '';
  }

  undoRemoveCurrentFile(): void {
    this.removeExistingFile = false;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submit();
  }

  submit(): void {
    if (this.form.invalid || this.saving || this.fileError) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    if (this.persistedActa) {
      this.persistFile(this.persistedActa);
      return;
    }
    const values = this.form.getRawValue();
    const request: ActaMovilRequest = values;
    const operation = this.acta
      ? this.service.update(this.acta.id, request)
      : this.service.create(request);
    operation.subscribe({
      next: (savedActa) => {
        this.persistedActa = savedActa;
        this.persistFile(savedActa);
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'No se pudo guardar el acta.';
      },
    });
  }

  private persistFile(savedActa: ActaMovil): void {
    if (this.selectedFile) {
      this.service.uploadArchivo(savedActa.id, this.selectedFile).subscribe({
        next: () => this.completeSave(),
        error: (error) => {
          this.saving = false;
          const message = error?.error?.message || error?.message || 'Error desconocido.';
          this.errorMessage = `El acta se guardó, pero el archivo no se pudo subir: ${message}`;
        },
      });
      return;
    }
    if (this.acta?.tieneArchivo && this.removeExistingFile) {
      this.service.deleteArchivo(savedActa.id).subscribe({
        next: () => this.completeSave(),
        error: (error) => {
          this.saving = false;
          this.errorMessage = error?.error?.message || 'El acta se guardó, pero el archivo no se pudo quitar.';
        },
      });
      return;
    }
    this.completeSave();
  }

  private completeSave(): void {
    this.saving = false;
    this.persistedActa = null;
    this.saved.emit();
  }

  private resetForm(): void {
    this.saving = false;
    this.errorMessage = '';
    this.fileError = '';
    this.equipoSearch = '';
    this.selectedFile = null;
    this.removeExistingFile = false;
    this.persistedActa = null;
    this.form.reset({
      numeroActa: this.acta?.numeroActa ?? '',
      tipo: this.acta?.tipo ?? 'Entrega',
      fecha: this.acta?.fecha ?? todayIso(),
      personaNombre: this.acta?.personaNombre ?? '',
      personaDni: this.acta?.personaDni ?? '',
      dependenciaId: this.acta?.dependencia?.id ?? null,
      equipoMovilIds: this.acta?.equipos.map((equipo) => equipo.id) ?? [],
      observaciones: this.acta?.observaciones ?? '',
    });
  }
}
