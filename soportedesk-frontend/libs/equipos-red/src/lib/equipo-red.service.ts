import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EquipoRed, EquipoRedRequest, EquipoRedResumen, TipoEquipoRed } from './equipo-red.model';

@Injectable({ providedIn: 'root' })
export class EquipoRedService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/equipos-red';

  getAll(tipo: TipoEquipoRed, search?: string): Observable<EquipoRed[]> {
    let params = new HttpParams().set('tipo', tipo);
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<EquipoRed[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<EquipoRed> {
    return this.http.get<EquipoRed>(`${this.apiUrl}/${id}`);
  }

  getResumen(tipo: TipoEquipoRed): Observable<EquipoRedResumen> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<EquipoRedResumen>(`${this.apiUrl}/resumen`, { params });
  }

  create(request: EquipoRedRequest): Observable<EquipoRed> {
    return this.http.post<EquipoRed>(this.apiUrl, request);
  }

  update(id: number, request: EquipoRedRequest): Observable<EquipoRed> {
    return this.http.put<EquipoRed>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
