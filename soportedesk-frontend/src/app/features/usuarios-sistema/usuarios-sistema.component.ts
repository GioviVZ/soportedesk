import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/modal/modal.component';
import { MODULOS, ModuloPermiso, NivelPermiso, UsuarioSistema, UsuarioSistemaRequest } from './usuario-sistema.model';
import { UsuarioSistemaService } from './usuario-sistema.service';

@Component({
    selector: 'app-usuarios-sistema',
    imports: [FormsModule, ModalComponent],
    templateUrl: './usuarios-sistema.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './usuarios-sistema.component.scss'
})
export class UsuariosSistemaComponent implements OnInit {
  private service = inject(UsuarioSistemaService);

  readonly modulos = MODULOS;
  readonly moduleGroups = this.buildGroups(MODULOS);

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

  get usuariosConEdicion(): number {
    return this.usuarios.filter((u) => this.countByNivel(u.permisos, 'EDIT') > 0).length;
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

  permisosOrdenados(permisos: Record<string, NivelPermiso>): string[] {
    const ordered = this.modulos.map((m) => m.key).filter((key) => key in permisos);
    const unknown = Object.keys(permisos).filter((key) => !this.modulos.some((m) => m.key === key));
    return [...ordered, ...unknown];
  }

  moduloLabel(key: string): string {
    return this.modulos.find((m) => m.key === key)?.label ?? key;
  }

  countByNivel(permisos: Record<string, NivelPermiso>, nivel: NivelPermiso): number {
    return Object.values(permisos).filter((value) => value === nivel).length;
  }

  accesoResumen(permisos: Record<string, NivelPermiso>): string {
    const vista = this.countByNivel(permisos, 'VIEW');
    const edicion = this.countByNivel(permisos, 'EDIT');
    if (vista === 0 && edicion === 0) return 'Sin accesos asignados';
    return `${edicion} edicion / ${vista} vista`;
  }

  trackGroup(_: number, group: { name: string }): string {
    return group.name;
  }

  trackModule(_: number, modulo: ModuloPermiso): string {
    return modulo.key;
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

  private buildGroups(modulos: ModuloPermiso[]): Array<{ name: string; modules: ModuloPermiso[] }> {
    const groups = new Map<string, ModuloPermiso[]>();
    modulos.forEach((modulo) => {
      groups.set(modulo.group, [...(groups.get(modulo.group) ?? []), modulo]);
    });
    return Array.from(groups.entries()).map(([name, modules]) => ({ name, modules }));
  }
}
