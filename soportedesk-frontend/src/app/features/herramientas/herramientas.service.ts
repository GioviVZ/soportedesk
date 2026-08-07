import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipoDatosResult, OrdenServicio, OrdenServicioRequest, PingResult } from './herramientas.model';

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

  getOrdenesServicio(): Observable<OrdenServicio[]> {
    return this.http.get<OrdenServicio[]>(`${this.apiUrl}/ordenes-servicio`);
  }

  createOrdenServicio(request: OrdenServicioRequest): Observable<OrdenServicio> {
    return this.http.post<OrdenServicio>(`${this.apiUrl}/ordenes-servicio`, request);
  }

  setOrdenFinalizada(id: number, finalizada: boolean): Observable<OrdenServicio> {
    const action = finalizada ? 'finalizar' : 'reactivar';
    return this.http.patch<OrdenServicio>(`${this.apiUrl}/ordenes-servicio/${id}/${action}`, {});
  }

  deleteOrdenServicio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ordenes-servicio/${id}`);
  }

  speedTestPing(): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/speed-test/ping`);
  }

  speedTestDownload(bytes: number): Observable<ArrayBuffer> {
    return this.http.get(`${this.apiUrl}/speed-test/download`, {
      params: { bytes },
      responseType: 'arraybuffer',
    });
  }

  speedTestUpload(payload: ArrayBuffer): Observable<{ bytesReceived: number }> {
    return this.http.post<{ bytesReceived: number }>(
      `${this.apiUrl}/speed-test/upload`,
      payload,
      { headers: { 'Content-Type': 'application/octet-stream' } },
    );
  }
}
