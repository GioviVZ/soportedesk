import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipoDatosResult, PingResult } from './herramientas.model';

@Injectable({ providedIn: 'root' })
export class HerramientasService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/herramientas`;

  ping(host: string): Observable<PingResult> {
    return this.http.post<PingResult>(`${this.apiUrl}/ping`, { host });
  }

  datosEquipo(referencia?: string): Observable<EquipoDatosResult> {
    const params = referencia?.trim() ? { referencia: referencia.trim() } : undefined;
    return this.http.get<EquipoDatosResult>(`${this.apiUrl}/datos-equipo`, { params });
  }
}
