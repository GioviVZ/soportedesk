import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from './auditoria.service';
import { MovimientoAuditoria, MovimientoAuditoriaFilters } from './movimiento-auditoria.model';

const MODULOS: Record<string, string> = {
  auth: 'Autenticacion',
  'usuarios-red': 'Usuarios de Red/AD',
  correos: 'Correos',
  equipos: 'Equipos',
  vpn: 'VPN',
  impresoras: 'Impresoras',
  wifi: 'WiFi',
  licencias: 'Licencias',
  'usuarios-sistema': 'Usuarios del Sistema',
  catalogos: 'Catalogos',
};

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss',
})
export class AuditoriaComponent implements OnInit {
  private service = inject(AuditoriaService);

  readonly acciones = ['LOGIN', 'LOGIN_FALLIDO', 'CREAR', 'ACTUALIZAR', 'ELIMINAR'];
  readonly modulos = Object.entries(MODULOS).map(([key, label]) => ({ key, label }));

  movimientos: MovimientoAuditoria[] = [];
  loading = false;
  error = '';

  filters: MovimientoAuditoriaFilters = {
    search: '',
    modulo: '',
    accion: '',
    desde: '',
    hasta: '',
    limit: 100,
  };

  get errores(): number {
    return this.movimientos.filter((m) => (m.estadoHttp ?? 0) >= 400).length;
  }

  get usuariosUnicos(): number {
    return new Set(this.movimientos.map((m) => m.usuario).filter(Boolean)).size;
  }

  get ultimaActividad(): string {
    return this.movimientos.length ? this.formatFecha(this.movimientos[0].fecha) : '-';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.service.getMovimientos(this.filters).subscribe({
      next: (rows) => {
        this.movimientos = rows;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudieron cargar los movimientos';
        this.loading = false;
      },
    });
  }

  clearFilters(): void {
    this.filters = { search: '', modulo: '', accion: '', desde: '', hasta: '', limit: 100 };
    this.load();
  }

  moduloLabel(modulo: string): string {
    return MODULOS[modulo] ?? modulo;
  }

  accionClass(accion: string): string {
    return `accion-${accion.toLowerCase()}`;
  }

  formatFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(fecha));
  }
}
