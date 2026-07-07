import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CatalogoRequest,
  Dependencia,
  DependenciaRequest,
  MarcaImpresora,
  ModeloImpresora,
  ModeloImpresoraRequest,
  Sede,
  Subdependencia,
  SubdependenciaRequest,
  TipoBien,
  TipoContrato,
  TipoEquipoCatalogo,
  TipoEquipoCatalogoRequest,
  TipoLicencia,
  TipoImpresora,
} from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/catalogos`;

  getSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.apiUrl}/sedes`);
  }

  createSede(request: CatalogoRequest): Observable<Sede> {
    return this.http.post<Sede>(`${this.apiUrl}/sedes`, request);
  }

  updateSede(id: number, request: CatalogoRequest): Observable<Sede> {
    return this.http.put<Sede>(`${this.apiUrl}/sedes/${id}`, request);
  }

  deleteSede(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sedes/${id}`);
  }

  getDependencias(sedeId?: number): Observable<Dependencia[]> {
    let params = new HttpParams();
    if (sedeId) {
      params = params.set('sedeId', sedeId);
    }
    return this.http.get<Dependencia[]>(`${this.apiUrl}/dependencias`, { params });
  }

  createDependencia(request: DependenciaRequest): Observable<Dependencia> {
    return this.http.post<Dependencia>(`${this.apiUrl}/dependencias`, request);
  }

  updateDependencia(id: number, request: DependenciaRequest): Observable<Dependencia> {
    return this.http.put<Dependencia>(`${this.apiUrl}/dependencias/${id}`, request);
  }

  deleteDependencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dependencias/${id}`);
  }

  getSubdependencias(dependenciaId?: number): Observable<Subdependencia[]> {
    let params = new HttpParams();
    if (dependenciaId) {
      params = params.set('dependenciaId', dependenciaId);
    }
    return this.http.get<Subdependencia[]>(`${this.apiUrl}/subdependencias`, { params });
  }

  createSubdependencia(request: SubdependenciaRequest): Observable<Subdependencia> {
    return this.http.post<Subdependencia>(`${this.apiUrl}/subdependencias`, request);
  }

  updateSubdependencia(id: number, request: SubdependenciaRequest): Observable<Subdependencia> {
    return this.http.put<Subdependencia>(`${this.apiUrl}/subdependencias/${id}`, request);
  }

  deleteSubdependencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subdependencias/${id}`);
  }

  getTiposContrato(): Observable<TipoContrato[]> {
    return this.http.get<TipoContrato[]>(`${this.apiUrl}/tipos-contrato`);
  }

  createTipoContrato(request: CatalogoRequest): Observable<TipoContrato> {
    return this.http.post<TipoContrato>(`${this.apiUrl}/tipos-contrato`, request);
  }

  updateTipoContrato(id: number, request: CatalogoRequest): Observable<TipoContrato> {
    return this.http.put<TipoContrato>(`${this.apiUrl}/tipos-contrato/${id}`, request);
  }

  deleteTipoContrato(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-contrato/${id}`);
  }

  getTiposLicencia(): Observable<TipoLicencia[]> {
    return this.http.get<TipoLicencia[]>(`${this.apiUrl}/tipos-licencia`);
  }

  createTipoLicencia(request: CatalogoRequest): Observable<TipoLicencia> {
    return this.http.post<TipoLicencia>(`${this.apiUrl}/tipos-licencia`, request);
  }

  updateTipoLicencia(id: number, request: CatalogoRequest): Observable<TipoLicencia> {
    return this.http.put<TipoLicencia>(`${this.apiUrl}/tipos-licencia/${id}`, request);
  }

  deleteTipoLicencia(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-licencia/${id}`);
  }

  getTiposBien(): Observable<TipoBien[]> {
    return this.http.get<TipoBien[]>(`${this.apiUrl}/tipos-bien`);
  }

  createTipoBien(request: CatalogoRequest): Observable<TipoBien> {
    return this.http.post<TipoBien>(`${this.apiUrl}/tipos-bien`, request);
  }

  updateTipoBien(id: number, request: CatalogoRequest): Observable<TipoBien> {
    return this.http.put<TipoBien>(`${this.apiUrl}/tipos-bien/${id}`, request);
  }

  deleteTipoBien(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-bien/${id}`);
  }

  getTiposImpresora(): Observable<TipoImpresora[]> {
    return this.http.get<TipoImpresora[]>(`${this.apiUrl}/tipos-impresora`);
  }

  createTipoImpresora(request: CatalogoRequest): Observable<TipoImpresora> {
    return this.http.post<TipoImpresora>(`${this.apiUrl}/tipos-impresora`, request);
  }

  updateTipoImpresora(id: number, request: CatalogoRequest): Observable<TipoImpresora> {
    return this.http.put<TipoImpresora>(`${this.apiUrl}/tipos-impresora/${id}`, request);
  }

  deleteTipoImpresora(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-impresora/${id}`);
  }

  getMarcasImpresora(): Observable<MarcaImpresora[]> {
    return this.http.get<MarcaImpresora[]>(`${this.apiUrl}/marcas-impresora`);
  }

  createMarcaImpresora(request: CatalogoRequest): Observable<MarcaImpresora> {
    return this.http.post<MarcaImpresora>(`${this.apiUrl}/marcas-impresora`, request);
  }

  updateMarcaImpresora(id: number, request: CatalogoRequest): Observable<MarcaImpresora> {
    return this.http.put<MarcaImpresora>(`${this.apiUrl}/marcas-impresora/${id}`, request);
  }

  deleteMarcaImpresora(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/marcas-impresora/${id}`);
  }

  getModelosImpresora(marcaId?: number): Observable<ModeloImpresora[]> {
    let params = new HttpParams();
    if (marcaId) {
      params = params.set('marcaId', marcaId);
    }
    return this.http.get<ModeloImpresora[]>(`${this.apiUrl}/modelos-impresora`, { params });
  }

  createModeloImpresora(request: ModeloImpresoraRequest): Observable<ModeloImpresora> {
    return this.http.post<ModeloImpresora>(`${this.apiUrl}/modelos-impresora`, request);
  }

  updateModeloImpresora(id: number, request: ModeloImpresoraRequest): Observable<ModeloImpresora> {
    return this.http.put<ModeloImpresora>(`${this.apiUrl}/modelos-impresora/${id}`, request);
  }

  deleteModeloImpresora(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/modelos-impresora/${id}`);
  }

  uploadModeloImpresoraDriver(id: number, file: File, version = '', so = ''): Observable<ModeloImpresora> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', version);
    formData.append('so', so);
    return this.http.post<ModeloImpresora>(`${this.apiUrl}/modelos-impresora/${id}/driver`, formData);
  }

  downloadModeloImpresoraDriver(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/modelos-impresora/${id}/driver`, { responseType: 'blob' });
  }

  getTiposEquipo(): Observable<TipoEquipoCatalogo[]> {
    return this.http.get<TipoEquipoCatalogo[]>(`${this.apiUrl}/tipo-equipo`);
  }

  createTipoEquipo(request: TipoEquipoCatalogoRequest): Observable<TipoEquipoCatalogo> {
    return this.http.post<TipoEquipoCatalogo>(`${this.apiUrl}/tipo-equipo`, request);
  }

  updateTipoEquipo(id: number, request: TipoEquipoCatalogoRequest): Observable<TipoEquipoCatalogo> {
    return this.http.put<TipoEquipoCatalogo>(`${this.apiUrl}/tipo-equipo/${id}`, request);
  }

  deleteTipoEquipo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipo-equipo/${id}`);
  }
}
