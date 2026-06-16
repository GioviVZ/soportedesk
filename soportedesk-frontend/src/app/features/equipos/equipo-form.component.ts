import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Equipo } from './equipo.model';
import { EquipoService } from './equipo.service';

@Component({
  selector: 'app-equipo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './equipo-form.component.html',
  styleUrl: './equipo-form.component.scss',
})
export class EquipoFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(EquipoService);

  @Input() equipo: Equipo | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    tipo: ['', Validators.required],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    usuario: ['', Validators.required],
    area: ['', Validators.required],
    asignado: ['', Validators.required],
    estado: ['Activo', Validators.required],
  });

  ngOnChanges(): void {
    if (this.equipo) {
      this.form.patchValue(this.equipo);
    } else {
      this.form.reset({
        codigo: '',
        tipo: '',
        marca: '',
        modelo: '',
        usuario: '',
        area: '',
        asignado: '',
        estado: 'Activo',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const request = this.form.getRawValue();
    const obs = this.equipo
      ? this.service.update(this.equipo.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
