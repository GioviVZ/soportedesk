import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { VencimientoBadgeComponent } from '../../shared/vencimiento-badge/vencimiento-badge.component';
import { USUARIO_RED_ESTADOS, UsuarioRed } from './usuario-red.model';
import { UsuarioRedService } from './usuario-red.service';

@Component({
  selector: 'app-usuario-red-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UbicacionSelectComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    VencimientoBadgeComponent,
  ],
  templateUrl: './usuario-red-form.component.html',
  styleUrl: './usuario-red-form.component.scss',
})
export class UsuarioRedFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(UsuarioRedService);

  @Input() usuarioRed: UsuarioRed | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  tipoContratoId: number | null = null;
  readonly estadoOptions = USUARIO_RED_ESTADOS;

  form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    grupo: ['', Validators.required],
    unidadOrganizativa: [''],
    estado: ['Activo', Validators.required],
    fechaFinContrato: [''],
    fechaCreacion: [''],
    numeroContrato: [''],
  });

  get fechaFinContratoValue(): string | null {
    return this.form.controls.fechaFinContrato.value || null;
  }

  ngOnChanges(): void {
    if (this.usuarioRed) {
      this.form.patchValue({
        usuario: this.usuarioRed.usuario,
        nombre: this.usuarioRed.nombre,
        apellidos: this.usuarioRed.apellidos,
        grupo: this.usuarioRed.grupo,
        unidadOrganizativa: this.usuarioRed.unidadOrganizativa ?? '',
        estado: this.usuarioRed.estado,
        fechaFinContrato: this.usuarioRed.fechaFinContrato ?? '',
        fechaCreacion: this.usuarioRed.fechaCreacion ?? '',
        numeroContrato: this.usuarioRed.numeroContrato ?? '',
      });
      this.sedeId = this.usuarioRed.sede?.id ?? null;
      this.dependenciaId = this.usuarioRed.dependencia?.id ?? null;
      this.subdependenciaId = this.usuarioRed.subdependencia?.id ?? null;
      this.tipoContratoId = this.usuarioRed.tipoContrato?.id ?? null;
    } else {
      this.form.reset({ usuario: '', nombre: '', apellidos: '', grupo: '', unidadOrganizativa: '', estado: 'Activo', fechaFinContrato: '', fechaCreacion: '', numeroContrato: '' });
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.tipoContratoId = null;
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    if (!this.sedeId || !this.dependenciaId || !this.subdependenciaId || !this.tipoContratoId) {
      alert('Complete todos los campos de ubicacion y tipo de contrato.');
      return;
    }
    const raw = this.form.getRawValue();
    const request = {
      usuario: raw.usuario,
      nombre: raw.nombre,
      apellidos: raw.apellidos,
      grupo: raw.grupo,
      unidadOrganizativa: raw.unidadOrganizativa || null,
      estado: raw.estado,
      sedeId: this.sedeId,
      dependenciaId: this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
      tipoContratoId: this.tipoContratoId,
      fechaFinContrato: raw.fechaFinContrato || null,
      fechaCreacion: raw.fechaCreacion || null,
      numeroContrato: raw.numeroContrato || null,
    };
    const obs = this.usuarioRed
      ? this.service.update(this.usuarioRed.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
