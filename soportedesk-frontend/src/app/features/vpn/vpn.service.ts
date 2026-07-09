import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Vpn,
  VpnAntivirusRequest,
  VpnAprobarRequest,
  VpnConfigInstitucional,
  VpnConfigInstitucionalRequest,
  VpnDashboardCompleto,
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

  getDashboardCompleto(): Observable<VpnDashboardCompleto> {
    return this.http.get<VpnDashboardCompleto>(`${this.apiUrl}/dashboard/completo`);
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

  getConfigInstitucional(): Observable<VpnConfigInstitucional> {
    return this.http.get<VpnConfigInstitucional>(`${this.apiUrl}/config-institucional`);
  }

  actualizarConfigInstitucional(request: VpnConfigInstitucionalRequest): Observable<VpnConfigInstitucional> {
    return this.http.put<VpnConfigInstitucional>(`${this.apiUrl}/config-institucional`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
