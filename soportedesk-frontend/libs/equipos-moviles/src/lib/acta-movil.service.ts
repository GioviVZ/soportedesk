import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ActaMovil, ActaMovilRequest, ActaMovilResumen, TipoActaMovil } from './acta-movil.model';

@Injectable({ providedIn: 'root' })
export class ActaMovilService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/equipos-moviles/actas';

  getAll(filters: { search?: string; tipo?: TipoActaMovil; desde?: string; hasta?: string } = {}): Observable<ActaMovil[]> {
    let params = new HttpParams();
    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.tipo) params = params.set('tipo', filters.tipo);
    if (filters.desde) params = params.set('desde', filters.desde);
    if (filters.hasta) params = params.set('hasta', filters.hasta);
    return this.http.get<ActaMovil[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ActaMovil> {
    return this.http.get<ActaMovil>(`${this.apiUrl}/${id}`);
  }

  getResumen(): Observable<ActaMovilResumen> {
    return this.http.get<ActaMovilResumen>(`${this.apiUrl}/resumen`);
  }

  create(request: ActaMovilRequest): Observable<ActaMovil> {
    return this.http.post<ActaMovil>(this.apiUrl, request);
  }

  update(id: number, request: ActaMovilRequest): Observable<ActaMovil> {
    return this.http.put<ActaMovil>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadArchivo(id: number, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<void>(`${this.apiUrl}/${id}/archivo`, formData);
  }

  downloadArchivo(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/archivo`, { responseType: 'blob' });
  }

  deleteArchivo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/archivo`);
  }
}
