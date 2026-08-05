import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdAuditoria, AdAuditoriaFilters } from './ad-auditoria.model';

@Injectable({ providedIn: 'root' })
export class AdAuditoriaService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auditoria/ad`;

  getMovimientos(filters: AdAuditoriaFilters): Observable<AdAuditoria[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        params = params.set(key, `${value}`);
      }
    });
    return this.http.get<AdAuditoria[]>(this.apiUrl, { params });
  }
}
