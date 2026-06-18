import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioSistema, UsuarioSistemaRequest } from './usuario-sistema.model';

@Injectable({ providedIn: 'root' })
export class UsuarioSistemaService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios-sistema`;

  getAll(): Observable<UsuarioSistema[]> {
    return this.http.get<UsuarioSistema[]>(this.apiUrl);
  }

  getById(id: number): Observable<UsuarioSistema> {
    return this.http.get<UsuarioSistema>(`${this.apiUrl}/${id}`);
  }

  create(request: UsuarioSistemaRequest): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(this.apiUrl, request);
  }

  update(id: number, request: UsuarioSistemaRequest): Observable<UsuarioSistema> {
    return this.http.put<UsuarioSistema>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
