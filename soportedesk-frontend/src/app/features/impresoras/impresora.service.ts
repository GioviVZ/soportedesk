import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Impresora, ImpresoraDashboardCompleto, ImpresoraIntervencion, ImpresoraIntervencionAdjunto, ImpresoraIntervencionRequest, ImpresoraRequest } from './impresora.model';

@Injectable({ providedIn: 'root' })
export class ImpresoraService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/impresoras`;

  getAll(search?: string): Observable<Impresora[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Impresora[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Impresora> {
    return this.http.get<Impresora>(`${this.apiUrl}/${id}`);
  }

  getDashboardCompleto(): Observable<ImpresoraDashboardCompleto> {
    return this.http.get<ImpresoraDashboardCompleto>(`${this.apiUrl}/dashboard/completo`);
  }

  create(request: ImpresoraRequest): Observable<Impresora> {
    return this.http.post<Impresora>(this.apiUrl, request);
  }

  update(id: number, request: ImpresoraRequest): Observable<Impresora> {
    return this.http.put<Impresora>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getIntervenciones(impresoraId: number): Observable<ImpresoraIntervencion[]> {
    return this.http.get<ImpresoraIntervencion[]>(`${this.apiUrl}/${impresoraId}/intervenciones`);
  }

  crearIntervencion(impresoraId: number, request: ImpresoraIntervencionRequest): Observable<ImpresoraIntervencion> {
    return this.http.post<ImpresoraIntervencion>(`${this.apiUrl}/${impresoraId}/intervenciones`, request);
  }

  actualizarIntervencion(impresoraId: number, intervencionId: number, request: ImpresoraIntervencionRequest): Observable<ImpresoraIntervencion> {
    return this.http.put<ImpresoraIntervencion>(`${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}`, request);
  }

  eliminarIntervencion(impresoraId: number, intervencionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}`);
  }

  subirAdjuntos(impresoraId: number, intervencionId: number, files: File[]): Observable<ImpresoraIntervencionAdjunto[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.http.post<ImpresoraIntervencionAdjunto[]>(
      `${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}/adjuntos`, formData);
  }

  descargarAdjunto(impresoraId: number, intervencionId: number, adjuntoId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}/adjuntos/${adjuntoId}/archivo`, { responseType: 'blob' });
  }

  eliminarAdjunto(impresoraId: number, intervencionId: number, adjuntoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${impresoraId}/intervenciones/${intervencionId}/adjuntos/${adjuntoId}`);
  }
}
