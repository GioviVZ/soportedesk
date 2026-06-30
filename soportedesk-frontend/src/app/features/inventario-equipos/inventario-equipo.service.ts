import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InventarioEquipo, InventarioMatchManualRequest } from './inventario-equipo.model';

@Injectable({ providedIn: 'root' })
export class InventarioEquipoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventario-equipos`;

  getAll(search?: string): Observable<InventarioEquipo[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<InventarioEquipo[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<InventarioEquipo> {
    return this.http.get<InventarioEquipo>(`${this.apiUrl}/${id}`);
  }

  rematch(id: number): Observable<InventarioEquipo> {
    return this.http.post<InventarioEquipo>(`${this.apiUrl}/${id}/match`, {});
  }

  rematchAll(search?: string): Observable<InventarioEquipo[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.post<InventarioEquipo[]>(`${this.apiUrl}/match`, {}, { params });
  }

  manualMatch(id: number, request: InventarioMatchManualRequest): Observable<InventarioEquipo> {
    return this.http.post<InventarioEquipo>(`${this.apiUrl}/${id}/match/manual`, request);
  }
}
