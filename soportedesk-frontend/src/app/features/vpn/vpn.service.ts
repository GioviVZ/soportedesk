import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vpn, VpnAntivirusRequest, VpnRequest } from './vpn.model';

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

  create(request: VpnRequest): Observable<Vpn> {
    return this.http.post<Vpn>(this.apiUrl, request);
  }

  update(id: number, request: VpnRequest): Observable<Vpn> {
    return this.http.put<Vpn>(`${this.apiUrl}/${id}`, request);
  }

  patchAntivirus(id: number, request: VpnAntivirusRequest): Observable<Vpn> {
    return this.http.patch<Vpn>(`${this.apiUrl}/${id}/antivirus`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
