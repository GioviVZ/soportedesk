import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Correo, CorreoFiltros, CorreoKpis } from './correo.model';

@Injectable({ providedIn: 'root' })
export class CorreoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/correos`;

  getAll(filtros: CorreoFiltros = {}): Observable<Correo[]> {
    let params = new HttpParams();
    if (filtros.search) params = params.set('search', filtros.search);
    if (filtros.sede) params = params.set('sede', filtros.sede);
    if (filtros.dependencia) params = params.set('dependencia', filtros.dependencia);
    if (filtros.subdependencia) params = params.set('subdependencia', filtros.subdependencia);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.modalidad) params = params.set('modalidad', filtros.modalidad);
    if (filtros.sinUso30Dias) params = params.set('sinUso30Dias', true);
    return this.http.get<Correo[]>(this.apiUrl, { params });
  }

  getKpis(): Observable<CorreoKpis> {
    return this.http.get<CorreoKpis>(`${this.apiUrl}/kpis`);
  }

  getSedes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/sedes`);
  }

  getDependencias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/dependencias`);
  }

  getSubdependencias(dependencia?: string): Observable<string[]> {
    let params = new HttpParams();
    if (dependencia) params = params.set('dependencia', dependencia);
    return this.http.get<string[]>(`${this.apiUrl}/subdependencias`, { params });
  }
}
