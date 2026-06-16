import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { Correo } from './correo.model';
import { CorreoService } from './correo.service';

@Component({
  selector: 'app-correo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UbicacionSelectComponent],
  templateUrl: './correo-form.component.html',
  styleUrl: './correo-form.component.scss',
})
export class CorreoFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(CorreoService);

  @Input() correo: Correo | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  tipoContratoId: number | null = null;

  form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    estado: ['Activo', Validators.required],
    fechaFinContrato: [''],
  });

  ngOnChanges(): void {
    if (this.correo) {
      this.form.patchValue({
        usuario: this.correo.usuario,
        nombre: this.correo.nombre,
        correo: this.correo.correo,
        estado: this.correo.estado,
        fechaFinContrato: this.correo.fechaFinContrato ?? '',
      });
      this.sedeId = this.correo.sede?.id ?? null;
      this.dependenciaId = this.correo.dependencia?.id ?? null;
      this.subdependenciaId = this.correo.subdependencia?.id ?? null;
      this.tipoContratoId = this.correo.tipoContrato?.id ?? null;
    } else {
      this.form.reset({ usuario: '', nombre: '', correo: '', estado: 'Activo', fechaFinContrato: '' });
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.tipoContratoId = null;
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    if (!this.sedeId || !this.dependenciaId || !this.subdependenciaId || !this.tipoContratoId) {
      alert('Complete todos los campos de ubicación y tipo de contrato.');
      return;
    }
    const raw = this.form.getRawValue();
    const request = {
      usuario: raw.usuario,
      nombre: raw.nombre,
      correo: raw.correo,
      estado: raw.estado,
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
      tipoContratoId: this.tipoContratoId,
      fechaFinContrato: raw.fechaFinContrato || null,
    };
    const obs = this.correo
      ? this.service.update(this.correo.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
