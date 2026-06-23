import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovimientoAuditoria, MovimientoAuditoriaFilters } from './movimiento-auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auditoria/movimientos`;

  getMovimientos(filters: MovimientoAuditoriaFilters): Observable<MovimientoAuditoria[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        params = params.set(key, `${value}`);
      }
    });
    return this.http.get<MovimientoAuditoria[]>(this.apiUrl, { params });
  }
}
