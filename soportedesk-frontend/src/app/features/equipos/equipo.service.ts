import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Equipo, EquipoDetalleResponse, EquipoKpis, EquipoResumen } from './equipo.model';

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/equipos`;

  getConRed(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.apiUrl}/con-red`);
  }

  getAll(filters: { search?: string; sede?: string; tipo?: string } = {}): Observable<EquipoResumen[]> {
    let params = new HttpParams();
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.sede) {
      params = params.set('sede', filters.sede);
    }
    if (filters.tipo) {
      params = params.set('tipo', filters.tipo);
    }
    return this.http.get<EquipoResumen[]>(this.apiUrl, { params });
  }

  getKpis(): Observable<EquipoKpis> {
    return this.http.get<EquipoKpis>(`${this.apiUrl}/kpis`);
  }

  getSedes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/sedes`);
  }

  getTipos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tipos`);
  }

  getDetalle(id: number): Observable<EquipoDetalleResponse> {
    return this.http.get<EquipoDetalleResponse>(`${this.apiUrl}/${id}`);
  }
}
