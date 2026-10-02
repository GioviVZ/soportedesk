import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TelefonoFijo, TelefonoFijoRequest, TelefonoFijoResumen, TipoTelefonoFijo } from './telefono-fijo.model';

@Injectable({ providedIn: 'root' })
export class TelefonoFijoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/telefonia-fija/telefonos';

  getAll(filters: { search?: string; tipo?: TipoTelefonoFijo } = {}): Observable<TelefonoFijo[]> {
    let params = new HttpParams();
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.tipo) params = params.set('tipo', filters.tipo);
    return this.http.get<TelefonoFijo[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<TelefonoFijo> {
    return this.http.get<TelefonoFijo>(`${this.apiUrl}/${id}`);
  }

  getResumen(): Observable<TelefonoFijoResumen> {
    return this.http.get<TelefonoFijoResumen>(`${this.apiUrl}/resumen`);
  }

  create(request: TelefonoFijoRequest): Observable<TelefonoFijo> {
    return this.http.post<TelefonoFijo>(this.apiUrl, request);
  }

  update(id: number, request: TelefonoFijoRequest): Observable<TelefonoFijo> {
    return this.http.put<TelefonoFijo>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
