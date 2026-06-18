import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Equipo, EquipoRequest } from './equipo.model';
import { EquipoService } from './equipo.service';
import { UbicacionSelectComponent } from '../../shared/ubicacion-select/ubicacion-select.component';
import { UsuarioRedService } from '../usuarios-red/usuario-red.service';
import { UsuarioRed } from '../usuarios-red/usuario-red.model';
import { FormsModule } from '@angular/forms';

const TIPOS_CON_RED = ['Laptop', 'Computadora'];

@Component({
  selector: 'app-equipo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, UbicacionSelectComponent],
  templateUrl: './equipo-form.component.html',
  styleUrl: './equipo-form.component.scss',
})
export class EquipoFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private service = inject(EquipoService);
  private usuarioRedService = inject(UsuarioRedService);

  @Input() equipo: Equipo | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  usuariosRed: UsuarioRed[] = [];
  usuarioRedId: number | null = null;
  sedeId: number | null = null;
  dependenciaId: number | null = null;
  subdependenciaId: number | null = null;

  readonly tiposEquipo = ['Laptop', 'Computadora', 'Monitor', 'Teclado', 'Mouse', 'Impresora', 'UPS', 'Otro'];

  form = this.fb.nonNullable.group({
    numeroSerie:        [''],
    codigoPatrimonial:  [''],
    codigoInventario:   [''],
    tipo:               ['', Validators.required],
    marca:              ['', Validators.required],
    modelo:             ['', Validators.required],
    host:               [''],
    ip:                 [''],
    asignado:           [''],
    estado:             ['Activo', Validators.required],
  });

  get tieneRed(): boolean {
    return TIPOS_CON_RED.includes(this.form.getRawValue().tipo);
  }

  ngOnInit(): void {
    this.usuarioRedService.getAll().subscribe(u => this.usuariosRed = u);
  }

  ngOnChanges(): void {
    if (this.equipo) {
      this.usuarioRedId    = this.equipo.usuarioRed?.id ?? null;
      this.sedeId          = this.equipo.sede?.id ?? null;
      this.dependenciaId   = this.equipo.dependencia?.id ?? null;
      this.subdependenciaId = this.equipo.subdependencia?.id ?? null;
      this.form.patchValue({
        numeroSerie:       this.equipo.numeroSerie       ?? '',
        codigoPatrimonial: this.equipo.codigoPatrimonial ?? '',
        codigoInventario:  this.equipo.codigoInventario  ?? '',
        tipo:              this.equipo.tipo,
        marca:             this.equipo.marca,
        modelo:            this.equipo.modelo,
        host:              this.equipo.host ?? '',
        ip:                this.equipo.ip   ?? '',
        asignado:          this.equipo.asignado ?? '',
        estado:            this.equipo.estado,
      });
    } else {
      this.usuarioRedId = null;
      this.sedeId = null;
      this.dependenciaId = null;
      this.subdependenciaId = null;
      this.form.reset({ tipo: '', marca: '', modelo: '', estado: 'Activo',
        numeroSerie: '', codigoPatrimonial: '', codigoInventario: '',
        host: '', ip: '', asignado: '' });
    }
  }

  onUsuarioChange(value: string): void {
    this.usuarioRedId = value ? Number(value) : null;
  }

  submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const request: EquipoRequest = {
      ...raw,
      usuarioRedId:    this.usuarioRedId,
      sedeId:          this.sedeId,
      dependenciaId:   this.dependenciaId,
      subdependenciaId: this.subdependenciaId,
    };
    const obs = this.equipo
      ? this.service.update(this.equipo.id, request)
      : this.service.create(request);
    obs.subscribe(() => this.saved.emit());
  }
}
