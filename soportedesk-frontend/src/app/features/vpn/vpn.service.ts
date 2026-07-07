import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Vpn,
  VpnAntivirusRequest,
  VpnAprobarRequest,
  VpnKpis,
  VpnResolucionRequest,
  VpnSolicitudRequest,
} from './vpn.model';

@Injectable({ providedIn: 'root' })
export class VpnService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/vpn`;

  getAll(search?: string): Observable<Vpn[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Vpn[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Vpn> {
    return this.http.get<Vpn>(`${this.apiUrl}/${id}`);
  }

  getKpis(): Observable<VpnKpis> {
    return this.http.get<VpnKpis>(`${this.apiUrl}/kpis`);
  }

  create(request: VpnSolicitudRequest): Observable<Vpn> {
    return this.http.post<Vpn>(this.apiUrl, request);
  }

  update(id: number, request: VpnSolicitudRequest): Observable<Vpn> {
    return this.http.put<Vpn>(`${this.apiUrl}/${id}`, request);
  }

  aprobar(id: number, request: VpnAprobarRequest): Observable<Vpn> {
    return this.http.patch<Vpn>(`${this.apiUrl}/${id}/aprobar`, request);
  }

  rechazar(id: number, request: VpnResolucionRequest): Observable<Vpn> {
    return this.http.patch<Vpn>(`${this.apiUrl}/${id}/rechazar`, request);
  }

  observar(id: number, request: VpnResolucionRequest): Observable<Vpn> {
    return this.http.patch<Vpn>(`${this.apiUrl}/${id}/observar`, request);
  }

  patchAntivirus(id: number, request: VpnAntivirusRequest): Observable<Vpn> {
    return this.http.patch<Vpn>(`${this.apiUrl}/${id}/antivirus`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
