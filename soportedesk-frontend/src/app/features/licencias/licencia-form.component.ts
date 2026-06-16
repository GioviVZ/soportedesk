import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Licencia } from './licencia.model';
import { LicenciaService } from './licencia.service';

@Component({
  selector: 'app-licencia-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './licencia-form.component.html',
  styleUrl: './licencia-form.component.scss',
})
export class LicenciaFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(LicenciaService);

  @Input() licencia: Licencia | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
    licencia: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', Validators.required],
    ordenCompra: ['', Validators.required],
    anio: ['', Validators.required],
  });

  ngOnChanges(): void {
    if (this.licencia) {
      this.form.patchValue(this.licencia);
    } else {
      this.form.reset({ cantidad: 1, licencia: '', correo: '', clave: '', ordenCompra: '', anio: '' });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const request = this.form.getRawValue();
    const obs = this.licencia
      ? this.service.update(this.licencia.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
