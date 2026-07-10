import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Equipo, EquipoDashboardCompleto, EquipoDetalleResponse, EquipoEnrichmentDto, EquipoKpis, EquipoResumen, EquipoSaludItem, HistorialItem } from './equipo.model';

@Injectable({ providedIn: 'root' })
export class EquipoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/equipos`;

  getConRed(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(`${this.apiUrl}/con-red`);
  }

  getAll(filters: {
    search?: string;
    sede?: string;
    tipo?: string;
    dependencia?: string;
    subdependencia?: string;
    fabricante?: string;
  } = {}): Observable<EquipoResumen[]> {
    let params = new HttpParams();
    if (filters.search)       params = params.set('search', filters.search);
    if (filters.sede)         params = params.set('sede', filters.sede);
    if (filters.tipo)         params = params.set('tipo', filters.tipo);
    if (filters.dependencia)  params = params.set('dependencia', filters.dependencia);
    if (filters.subdependencia) params = params.set('subdependencia', filters.subdependencia);
    if (filters.fabricante)   params = params.set('fabricante', filters.fabricante);
    return this.http.get<EquipoResumen[]>(this.apiUrl, { params });
  }

  getKpis(): Observable<EquipoKpis> {
    return this.http.get<EquipoKpis>(`${this.apiUrl}/kpis`);
  }

  getSedes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/sedes`);
  }

  getTipos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tipos`);
  }

  getDependencias(sede?: string): Observable<string[]> {
    let params = new HttpParams();
    if (sede) params = params.set('sede', sede);
    return this.http.get<string[]>(`${this.apiUrl}/dependencias`, { params });
  }

  getSubdependencias(sede?: string, dependencia?: string): Observable<string[]> {
    let params = new HttpParams();
    if (sede)         params = params.set('sede', sede);
    if (dependencia)  params = params.set('dependencia', dependencia);
    return this.http.get<string[]>(`${this.apiUrl}/subdependencias`, { params });
  }

  getFabricantes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/fabricantes`);
  }

  getDetalle(id: number): Observable<EquipoDetalleResponse> {
    return this.http.get<EquipoDetalleResponse>(`${this.apiUrl}/${id}`);
  }

  getEnrichment(id: number): Observable<EquipoEnrichmentDto | null> {
    return this.http.get<EquipoEnrichmentDto>(`${this.apiUrl}/${id}/enrichment`);
  }

  saveEnrichment(id: number, dto: EquipoEnrichmentDto): Observable<EquipoEnrichmentDto> {
    return this.http.put<EquipoEnrichmentDto>(`${this.apiUrl}/${id}/enrichment`, dto);
  }

  getHistorial(id: number): Observable<HistorialItem[]> {
    return this.http.get<HistorialItem[]>(`${this.apiUrl}/${id}/historial`);
  }

  getSalud(): Observable<EquipoSaludItem[]> {
    return this.http.get<EquipoSaludItem[]>(`${this.apiUrl}/salud`);
  }

  getDashboardCompleto(): Observable<EquipoDashboardCompleto> {
    return this.http.get<EquipoDashboardCompleto>(`${this.apiUrl}/dashboard/completo`);
  }
}
