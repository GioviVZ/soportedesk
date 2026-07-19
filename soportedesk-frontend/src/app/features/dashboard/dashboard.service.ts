import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardCounts } from './dashboard-counts.model';
import { UbicacionUsuariosCount } from './ubicacion-usuarios-count.model';
import { LicenciaTipoCount } from './licencia-tipo-count.model';
import { OrdenServicio } from '../herramientas/herramientas.model';

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
}
