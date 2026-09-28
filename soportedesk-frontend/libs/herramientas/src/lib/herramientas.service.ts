import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EquipoDatosResult,
  MonitorPing,
  MonitorPingHistorial,
  MonitorPingRequest,
  OrdenServicio,
  OrdenServicioRequest,
  PingResult,
} from './herramientas.model';

@Injectable({ providedIn: 'root' })
export class HerramientasService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/herramientas';

  ping(host: string): Observable<PingResult> {
    return this.http.post<PingResult>(`${this.apiUrl}/ping`, { host });
  }

  pingSample(host: string): Observable<PingResult> {
    return this.http.post<PingResult>(`${this.apiUrl}/ping/sample`, { host });
  }

  getMonitoresPing(): Observable<MonitorPing[]> {
    return this.http.get<MonitorPing[]>(`${this.apiUrl}/monitores-ping`);
  }

  getMonitorPing(id: number): Observable<MonitorPing> {
    return this.http.get<MonitorPing>(`${this.apiUrl}/monitores-ping/${id}`);
  }

  createMonitorPing(request: MonitorPingRequest): Observable<MonitorPing> {
    return this.http.post<MonitorPing>(`${this.apiUrl}/monitores-ping`, request);
  }

  updateMonitorPing(id: number, request: MonitorPingRequest): Observable<MonitorPing> {
    return this.http.put<MonitorPing>(`${this.apiUrl}/monitores-ping/${id}`, request);
  }

  setMonitorPingEstado(id: number, action: 'pausar' | 'reanudar' | 'archivar'): Observable<MonitorPing> {
    return this.http.patch<MonitorPing>(`${this.apiUrl}/monitores-ping/${id}/${action}`, {});
  }

  deleteMonitorPing(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/monitores-ping/${id}`);
  }

  getMonitorPingHistorial(id: number, desde: Date, hasta = new Date(), maxPuntos = 300): Observable<MonitorPingHistorial> {
    return this.http.get<MonitorPingHistorial>(`${this.apiUrl}/monitores-ping/${id}/historial`, {
      params: {
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
        maxPuntos,
      },
    });
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

  updateOrdenServicio(id: number, request: OrdenServicioRequest): Observable<OrdenServicio> {
    return this.http.put<OrdenServicio>(`${this.apiUrl}/ordenes-servicio/${id}`, request);
  }

  setOrdenFinalizada(id: number, finalizada: boolean): Observable<OrdenServicio> {
    const action = finalizada ? 'finalizar' : 'reactivar';
    return this.http.patch<OrdenServicio>(`${this.apiUrl}/ordenes-servicio/${id}/${action}`, {});
  }

  setOrdenHitoCompletado(ordenId: number, hitoId: number, completado: boolean): Observable<OrdenServicio> {
    const action = completado ? 'completar' : 'reabrir';
    return this.http.patch<OrdenServicio>(
      `${this.apiUrl}/ordenes-servicio/${ordenId}/hitos/${hitoId}/${action}`,
      {},
    );
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
