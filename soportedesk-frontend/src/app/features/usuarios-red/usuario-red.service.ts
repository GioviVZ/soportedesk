import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioRed, UsuarioRedRequest } from './usuario-red.model';

@Injectable({ providedIn: 'root' })
export class UsuarioRedService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios-red`;

  getAll(search?: string): Observable<UsuarioRed[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<UsuarioRed[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<UsuarioRed> {
    return this.http.get<UsuarioRed>(`${this.apiUrl}/${id}`);
  }

  create(request: UsuarioRedRequest): Observable<UsuarioRed> {
    return this.http.post<UsuarioRed>(this.apiUrl, request);
  }

  update(id: number, request: UsuarioRedRequest): Observable<UsuarioRed> {
    return this.http.put<UsuarioRed>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
