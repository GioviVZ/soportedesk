import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { Correo } from './correo.model';
import { CorreoService } from './correo.service';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';

@Component({
  selector: 'app-correo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UbicacionSelectComponent],
  templateUrl: './correo-form.component.html',
  styleUrl: './correo-form.component.scss',
})
export class CorreoFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(CorreoService);
  private usuarioRedService = inject(UsuarioRedService);

  @Input() correo: Correo | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  usuariosRed: UsuarioRed[] = [];
  selectedAdUserId: number | null = null;

  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;
  tipoContratoId: number | null = null;

  form = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    estado: ['Activo', Validators.required],
    fechaFinContrato: [''],
  });

  ngOnInit(): void {
    this.usuarioRedService.getAll().subscribe((users) => (this.usuariosRed = users));
  }

  ngOnChanges(): void {
    this.selectedAdUserId = null;
    if (this.correo) {
      this.form.patchValue({
        usuario: this.correo.usuario,
        nombre: this.correo.nombre,
        apellidos: this.correo.apellidos,
        correo: this.correo.correo,
        estado: this.correo.estado,
        fechaFinContrato: this.correo.fechaFinContrato ?? '',
      });
      this.sedeId = this.correo.sede?.id ?? null;
      this.dependenciaId = this.correo.dependencia?.id ?? null;
      this.subdependenciaId = this.correo.subdependencia?.id ?? null;
      this.tipoContratoId = this.correo.tipoContrato?.id ?? null;
    } else {
      this.form.reset({ usuario: '', nombre: '', apellidos: '', correo: '', estado: 'Activo', fechaFinContrato: '' });
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.tipoContratoId = null;
    }
  }

  onAdUserSelected(idStr: string): void {
    const id = idStr ? Number(idStr) : null;
    this.selectedAdUserId = id;
    if (!id) return;
    const user = this.usuariosRed.find((u) => u.id === id);
    if (!user) return;
    this.form.patchValue({
      usuario: user.usuario,
      nombre: user.nombre,
      apellidos: user.apellidos,
      fechaFinContrato: user.fechaFinContrato ?? '',
    });
    this.sedeId = user.sede?.id ?? null;
    this.dependenciaId = user.dependencia?.id ?? null;
    this.subdependenciaId = user.subdependencia?.id ?? null;
    this.tipoContratoId = user.tipoContrato?.id ?? null;
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
      apellidos: raw.apellidos,
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
