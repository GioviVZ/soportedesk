import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { MODULOS, NivelPermiso, UsuarioSistema, UsuarioSistemaRequest } from './usuario-sistema.model';
import { UsuarioSistemaService } from './usuario-sistema.service';

@Component({
  selector: 'app-usuarios-sistema',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './usuarios-sistema.component.html',
  styleUrl: './usuarios-sistema.component.scss',
})
export class UsuariosSistemaComponent implements OnInit {
  private service = inject(UsuarioSistemaService);

  readonly modulosEdicion = MODULOS.filter((m) => m.kind === 'write');
  readonly modulosVista = MODULOS.filter((m) => m.kind === 'view');
  readonly modulos = MODULOS;

  usuarios: UsuarioSistema[] = [];
  formOpen = false;
  editingId: number | null = null;

  form: UsuarioSistemaRequest = this.emptyForm();

  get activos(): number {
    return this.usuarios.filter((u) => u.activo).length;
  }

  get inactivos(): number {
    return this.usuarios.length - this.activos;
  }

  get permisosAsignados(): number {
    return this.usuarios.reduce((total, u) => total + this.permisoKeys(u.permisos).length, 0);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe((data) => (this.usuarios = data));
  }

  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.formOpen = true;
  }

  openEdit(u: UsuarioSistema): void {
    this.editingId = u.id;
    this.form = {
      username: u.username,
      nombre: u.nombre,
      password: '',
      activo: u.activo,
      permisos: { ...u.permisos },
    };
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  nivelDe(key: string): NivelPermiso | null {
    return this.form.permisos[key] ?? null;
  }

  setNivel(key: string, nivel: NivelPermiso | null): void {
    if (nivel === null) {
      delete this.form.permisos[key];
    } else {
      this.form.permisos[key] = nivel;
    }
  }

  hasVista(key: string): boolean {
    return key in this.form.permisos;
  }

  toggleVista(key: string): void {
    if (this.hasVista(key)) {
      delete this.form.permisos[key];
    } else {
      this.form.permisos[key] = 'VIEW';
    }
  }

  permisoKeys(permisos: Record<string, NivelPermiso>): string[] {
    return Object.keys(permisos);
  }

  moduloLabel(key: string): string {
    return this.modulos.find((m) => m.key === key)?.label ?? key;
  }

  submit(): void {
    const obs = this.editingId
      ? this.service.update(this.editingId, this.form)
      : this.service.create(this.form);
    obs.subscribe({
      next: () => {
        this.formOpen = false;
        this.load();
      },
      error: (err) => alert(err?.error?.message ?? 'Error al guardar'),
    });
  }

  delete(u: UsuarioSistema): void {
    if (!confirm(`¿Eliminar el usuario "${u.nombre}"?`)) return;
    this.service.delete(u.id).subscribe(() => this.load());
  }

  private emptyForm(): UsuarioSistemaRequest {
    return { username: '', nombre: '', password: '', activo: true, permisos: {} };
  }
}
