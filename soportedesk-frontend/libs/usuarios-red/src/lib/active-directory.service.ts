import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ActiveDirectoryDashboard,
  ActiveDirectoryDashboardCompleto,
  ActiveDirectoryGroup,
  ActiveDirectoryOu,
  ActiveDirectoryResponse,
  AdSyncStatus,
  AdUserSearchResult,
  AdUser,
  CreateAdUserRequest,
  CorreoDisponible,
  UpdateUserInfoRequest,
} from './active-directory.model';

@Injectable({ providedIn: 'root' })
export class ActiveDirectoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/active-directory';

  getDashboard(): Observable<ActiveDirectoryDashboard> {
    return this.http.get<ActiveDirectoryDashboard>(`${this.apiUrl}/dashboard`);
  }

  getDashboardCompleto(): Observable<ActiveDirectoryDashboardCompleto> {
    return this.http.get<ActiveDirectoryDashboardCompleto>(`${this.apiUrl}/dashboard/completo`);
  }

  startSync(): Observable<AdSyncStatus> {
    return this.http.post<AdSyncStatus>(`${this.apiUrl}/sync/iniciar`, {});
  }

  getSyncStatus(): Observable<AdSyncStatus> {
    return this.http.get<AdSyncStatus>(`${this.apiUrl}/sync/estado`);
  }

  searchUsers(filters: { q?: string; usuario?: string; nombre?: string; oficina?: string; ou?: string; estado?: string; sedeId?: number | null; dependenciaId?: number | null; subdependenciaId?: number | null }): Observable<AdUserSearchResult> {
    let params = new HttpParams();
    if (filters.q?.trim()) params = params.set('q', filters.q.trim());
    if (filters.usuario?.trim()) params = params.set('usuario', filters.usuario.trim());
    if (filters.nombre?.trim()) params = params.set('nombre', filters.nombre.trim());
    if (filters.oficina?.trim()) params = params.set('oficina', filters.oficina.trim());
    if (filters.ou?.trim()) params = params.set('ou', filters.ou.trim());
    if (filters.estado?.trim() && filters.estado !== 'all') params = params.set('estado', filters.estado.trim());
    if (filters.sedeId != null) params = params.set('sedeId', String(filters.sedeId));
    if (filters.dependenciaId != null) params = params.set('dependenciaId', String(filters.dependenciaId));
    if (filters.subdependenciaId != null) params = params.set('subdependenciaId', String(filters.subdependenciaId));
    return this.http.get<AdUserSearchResult>(`${this.apiUrl}/usuarios/buscar`, { params });
  }

  getUser(samAccountName: string): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.get<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}`);
  }

  createUser(request: CreateAdUserRequest): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.post<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios`, request);
  }

  getCorreosDisponibles(samAccountName?: string): Observable<CorreoDisponible[]> {
    const params = samAccountName?.trim()
      ? new HttpParams().set('samAccountName', samAccountName.trim())
      : undefined;
    return this.http.get<CorreoDisponible[]>(`${this.apiUrl}/correos-disponibles`, { params });
  }

  unlockUser(samAccountName: string): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.post<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}/desbloquear`, {});
  }

  enableUser(samAccountName: string): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.post<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}/habilitar`, {});
  }

  disableUser(samAccountName: string): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.post<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}/deshabilitar`, {});
  }

  deleteUser(samAccountName: string): Observable<ActiveDirectoryResponse<void>> {
    return this.http.delete<ActiveDirectoryResponse<void>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}`);
  }

  resetPassword(samAccountName: string, newPassword: string, forceChange: boolean): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.post<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}/reset-password`, {
      newPassword,
      forceChange,
    });
  }

  updateInfo(samAccountName: string, request: UpdateUserInfoRequest): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.post<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}/actualizar-info`, request);
  }

  searchGroups(nombre: string): Observable<ActiveDirectoryGroup[]> {
    return this.http.get<ActiveDirectoryGroup[]>(`${this.apiUrl}/grupos`, {
      params: new HttpParams().set('nombre', nombre),
    });
  }

  getUserGroups(samAccountName: string): Observable<ActiveDirectoryGroup[]> {
    return this.http.get<ActiveDirectoryGroup[]>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}/grupos`);
  }

  addGroup(samAccountName: string, groupDn: string): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.post<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}/grupos/agregar`, { groupDn });
  }

  removeGroup(samAccountName: string, groupDn: string): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.post<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}/grupos/quitar`, { groupDn });
  }

  searchOus(nombre: string): Observable<ActiveDirectoryOu[]> {
    return this.http.get<ActiveDirectoryOu[]>(`${this.apiUrl}/ous`, {
      params: new HttpParams().set('nombre', nombre),
    });
  }

  moveUser(samAccountName: string, ouDestinoDn: string): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.post<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}/mover-ou`, { ouDestinoDn });
  }
}
