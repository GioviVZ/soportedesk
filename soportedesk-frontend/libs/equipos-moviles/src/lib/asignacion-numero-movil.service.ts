import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AsignacionNumeroMovil,
  AsignacionNumeroMovilRequest,
  AsignacionNumeroMovilResumen,
  EstadoAsignacionMovil,
  OperadorMovil,
} from './asignacion-numero-movil.model';

@Injectable({ providedIn: 'root' })
export class AsignacionNumeroMovilService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/equipos-moviles/asignaciones';

  getAll(filters: {
    search?: string;
    operador?: OperadorMovil;
    estado?: EstadoAsignacionMovil;
  } = {}): Observable<AsignacionNumeroMovil[]> {
    let params = new HttpParams();
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.operador) params = params.set('operador', filters.operador);
    if (filters.estado) params = params.set('estado', filters.estado);
    return this.http.get<AsignacionNumeroMovil[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<AsignacionNumeroMovil> {
    return this.http.get<AsignacionNumeroMovil>(`${this.apiUrl}/${id}`);
  }

  getResumen(): Observable<AsignacionNumeroMovilResumen> {
    return this.http.get<AsignacionNumeroMovilResumen>(`${this.apiUrl}/resumen`);
  }

  create(request: AsignacionNumeroMovilRequest): Observable<AsignacionNumeroMovil> {
    return this.http.post<AsignacionNumeroMovil>(this.apiUrl, request);
  }

  update(id: number, request: AsignacionNumeroMovilRequest): Observable<AsignacionNumeroMovil> {
    return this.http.put<AsignacionNumeroMovil>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
