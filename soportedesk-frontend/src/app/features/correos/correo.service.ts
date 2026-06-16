import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Correo, CorreoRequest } from './correo.model';

@Injectable({ providedIn: 'root' })
export class CorreoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/correos`;

  getAll(search?: string): Observable<Correo[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Correo[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Correo> {
    return this.http.get<Correo>(`${this.apiUrl}/${id}`);
  }

  create(request: CorreoRequest): Observable<Correo> {
    return this.http.post<Correo>(this.apiUrl, request);
  }

  update(id: number, request: CorreoRequest): Observable<Correo> {
    return this.http.put<Correo>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
