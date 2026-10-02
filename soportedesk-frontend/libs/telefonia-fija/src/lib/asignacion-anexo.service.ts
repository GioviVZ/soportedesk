import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AsignacionAnexo,
  AsignacionAnexoRequest,
  AsignacionAnexoResumen,
  EstadoAsignacionAnexo,
} from './asignacion-anexo.model';

@Injectable({ providedIn: 'root' })
export class AsignacionAnexoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/telefonia-fija/asignaciones';

  getAll(filters: {
    search?: string;
    sedeId?: number;
    estado?: EstadoAsignacionAnexo;
  } = {}): Observable<AsignacionAnexo[]> {
    let params = new HttpParams();
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.sedeId) params = params.set('sedeId', filters.sedeId);
    if (filters.estado) params = params.set('estado', filters.estado);
    return this.http.get<AsignacionAnexo[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<AsignacionAnexo> {
    return this.http.get<AsignacionAnexo>(`${this.apiUrl}/${id}`);
  }

  getResumen(): Observable<AsignacionAnexoResumen> {
    return this.http.get<AsignacionAnexoResumen>(`${this.apiUrl}/resumen`);
  }

  create(request: AsignacionAnexoRequest): Observable<AsignacionAnexo> {
    return this.http.post<AsignacionAnexo>(this.apiUrl, request);
  }

  update(id: number, request: AsignacionAnexoRequest): Observable<AsignacionAnexo> {
    return this.http.put<AsignacionAnexo>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
