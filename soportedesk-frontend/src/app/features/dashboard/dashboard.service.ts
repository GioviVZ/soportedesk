import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardCounts } from './dashboard-counts.model';
import { UbicacionUsuariosCount } from './ubicacion-usuarios-count.model';
import { LicenciaTipoCount } from './licencia-tipo-count.model';
import { ModuloBreakdownItem, ModuloKey } from './modulo-breakdown-item.model';
import { OrdenServicio } from '../herramientas/herramientas.model';

const BREAKDOWN_PATH: Partial<Record<ModuloKey, string>> = {
  impresoras: 'impresoras-por-estado',
  vpn: 'vpn-por-estado-solicitud',
  wifi: 'wifi-por-estado',
  correos: 'correos-por-estado',
  equipos: 'equipos-por-tipo',
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getCounts(): Observable<DashboardCounts> {
    return this.http.get<DashboardCounts>(`${this.apiUrl}/counts`);
  }

  getUsuariosRedPorUbicacion(nivel: 'sede' | 'dependencia'): Observable<UbicacionUsuariosCount[]> {
    return this.http.get<UbicacionUsuariosCount[]>(`${this.apiUrl}/usuarios-red-por-ubicacion`, {
      params: { nivel },
    });
  }

  getLicenciasPorTipo(): Observable<LicenciaTipoCount[]> {
    return this.http.get<LicenciaTipoCount[]>(`${this.apiUrl}/licencias-por-tipo`);
  }

  getOrdenesServicio(): Observable<OrdenServicio[]> {
    return this.http.get<OrdenServicio[]>(`${this.apiUrl}/ordenes-servicio`);
  }

  /** 'usuarios-red' no tiene endpoint propio: el componente lo deriva de /counts (activos/inactivos). */
  getModuloBreakdown(modulo: ModuloKey): Observable<ModuloBreakdownItem[]> {
    if (modulo === 'licencias') {
      return this.getLicenciasPorTipo().pipe(
        map((rows) => rows.map((row) => ({ label: row.nombre, count: row.totalClaves }))),
      );
    }
    const path = BREAKDOWN_PATH[modulo];
    if (!path) {
      throw new Error(`No hay endpoint de desglose para el módulo "${modulo}"`);
    }
    return this.http.get<ModuloBreakdownItem[]>(`${this.apiUrl}/${path}`);
  }
}
