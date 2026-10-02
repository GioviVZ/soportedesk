import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EquipoMovil, EquipoMovilRequest, EquipoMovilResumen, TipoEquipoMovil } from './equipo-movil.model';

@Injectable({ providedIn: 'root' })
export class EquipoMovilService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/equipos-moviles';

  getAll(filters: { search?: string; tipo?: TipoEquipoMovil } = {}): Observable<EquipoMovil[]> {
    let params = new HttpParams();
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.tipo) params = params.set('tipo', filters.tipo);
    return this.http.get<EquipoMovil[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<EquipoMovil> {
    return this.http.get<EquipoMovil>(`${this.apiUrl}/${id}`);
  }

  getResumen(): Observable<EquipoMovilResumen> {
    return this.http.get<EquipoMovilResumen>(`${this.apiUrl}/resumen`);
  }

  create(request: EquipoMovilRequest): Observable<EquipoMovil> {
    return this.http.post<EquipoMovil>(this.apiUrl, request);
  }

  update(id: number, request: EquipoMovilRequest): Observable<EquipoMovil> {
    return this.http.put<EquipoMovil>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
