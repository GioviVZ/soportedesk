import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Licencia, LicenciaRequest } from './licencia.model';

@Injectable({ providedIn: 'root' })
export class LicenciaService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/licencias`;

  getAll(search?: string): Observable<Licencia[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Licencia[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Licencia> {
    return this.http.get<Licencia>(`${this.apiUrl}/${id}`);
  }

  create(request: LicenciaRequest): Observable<Licencia> {
    return this.http.post<Licencia>(this.apiUrl, request);
  }

  update(id: number, request: LicenciaRequest): Observable<Licencia> {
    return this.http.put<Licencia>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
