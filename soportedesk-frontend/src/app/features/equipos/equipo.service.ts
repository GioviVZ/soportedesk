import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Equipo, EquipoRequest } from './equipo.model';

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/equipos`;

  getConRed(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.apiUrl}/con-red`);
  }

  getAll(search?: string): Observable<Equipo[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Equipo[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.apiUrl}/${id}`);
  }

  create(request: EquipoRequest): Observable<Equipo> {
    return this.http.post<Equipo>(this.apiUrl, request);
  }

  update(id: number, request: EquipoRequest): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
