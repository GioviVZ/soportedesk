
import { Component, EventEmitter, Input, OnChanges, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoService } from '../../core/catalogos/catalogo.service';
import {
  MarcaImpresora,
  ModeloImpresora,
  ModeloImpresoraRequest,
  ModeloImpresoraToner,
} from '../../core/models/catalogo.model';

const TONER_COLORES = ['Negro', 'Cyan', 'Magenta', 'Amarillo'];

@Component({
    selector: 'app-modelo-impresora-form',
    imports: [FormsModule, ReactiveFormsModule],
    templateUrl: './modelo-impresora-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './modelo-impresora-form.component.scss'
})
export class ModeloImpresoraFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(CatalogoService);

  @Input() modelo: ModeloImpresora | null = null;
  @Input() marcas: MarcaImpresora[] = [];
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() driverUploaded = new EventEmitter<ModeloImpresora>();

  readonly tonerColores = TONER_COLORES;
  marcaId: number | null = null;
  driverVersionInput = '';
  driverSoInput = '';
  saving = false;
  errorMessage = '';

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    toners: this.fb.array([this.createTonerGroup()]),
  });

  get tonersArray() {
    return this.form.controls.toners;
  }

  ngOnChanges(): void {
    if (this.modelo) {
      this.marcaId = this.modelo.marca?.id ?? null;
      this.form.patchValue({ nombre: this.modelo.nombre });
      this.setToners(this.modelo.toners?.length ? this.modelo.toners : [this.emptyToner()]);
    } else {
      this.marcaId = null;
      this.form.reset({ nombre: '' });
      this.setToners([this.emptyToner()]);
    }
  }

  onMarcaChange(value: string): void {
    this.marcaId = value ? Number(value) : null;
  }

  addToner(): void {
    this.tonersArray.push(this.createTonerGroup());
  }

  removeToner(index: number): void {
    this.tonersArray.removeAt(index);
    if (this.tonersArray.length === 0) {
      this.addToner();
    }
  }

  submit(): void {
    this.errorMessage = '';
    if (this.form.invalid || !this.marcaId) {
      return;
    }
    const toners = this.normalizedToners();
    if (toners === null) {
      alert('Cada tóner debe tener color, variante y código.');
      return;
    }
    const raw = this.form.getRawValue();
    const request: ModeloImpresoraRequest = {
      marcaId: this.marcaId,
      nombre: raw.nombre,
      toners,
    };
    const obs = this.modelo
      ? this.service.updateModeloImpresora(this.modelo.id, request)
      : this.service.createModeloImpresora(request);
    this.saving = true;
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.form.reset({ nombre: '' });
        this.marcaId = null;
        this.setToners([this.emptyToner()]);
        this.saved.emit();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'No se pudo guardar el modelo de impresora.';
      },
    });
  }

  downloadDriver(): void {
    if (!this.modelo) return;
    this.service.downloadModeloImpresoraDriver(this.modelo.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.modelo!.driverNombre ?? 'driver';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.modelo) return;
    this.service.uploadModeloImpresoraDriver(this.modelo.id, file, this.driverVersionInput, this.driverSoInput).subscribe((updated) => {
      this.driverVersionInput = '';
      this.driverSoInput = '';
      this.driverUploaded.emit(updated);
    });
  }

  private setToners(items: ModeloImpresoraToner[]): void {
    this.tonersArray.clear();
    for (const item of items.length ? items : [this.emptyToner()]) {
      this.tonersArray.push(this.createTonerGroup(item));
    }
  }

  private createTonerGroup(value?: Partial<ModeloImpresoraToner>) {
    return this.fb.nonNullable.group({
      color: [value?.color ?? ''],
      variante: [value?.variante ?? ''],
      codigo: [value?.codigo ?? ''],
    });
  }

  private normalizedToners(): ModeloImpresoraToner[] | null {
    const result: ModeloImpresoraToner[] = [];
    for (const group of this.tonersArray.controls) {
      const color = group.controls.color.value.trim();
      const variante = group.controls.variante.value.trim();
      const codigo = group.controls.codigo.value.trim();
      if (!color && !variante && !codigo) {
        continue;
      }
      if (!color || !variante || !codigo) {
        return null;
      }
      result.push({ color, variante, codigo });
    }
    return result;
  }

  private emptyToner(): ModeloImpresoraToner {
    return { color: '', variante: '', codigo: '' };
  }
}
