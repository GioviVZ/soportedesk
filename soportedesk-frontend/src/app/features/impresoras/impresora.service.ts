import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Impresora, ImpresoraDashboardCompleto, ImpresoraRequest } from './impresora.model';

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
}
