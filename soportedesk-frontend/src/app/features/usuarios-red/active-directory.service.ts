import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActiveDirectoryDashboard,
  ActiveDirectoryGroup,
  ActiveDirectoryOu,
  ActiveDirectoryResponse,
  AdUser,
  UpdateUserInfoRequest,
} from './active-directory.model';

@Injectable({ providedIn: 'root' })
export class ActiveDirectoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/active-directory`;

  getDashboard(): Observable<ActiveDirectoryDashboard> {
    return this.http.get<ActiveDirectoryDashboard>(`${this.apiUrl}/dashboard`);
  }

  getUser(samAccountName: string): Observable<ActiveDirectoryResponse<AdUser>> {
    return this.http.get<ActiveDirectoryResponse<AdUser>>(`${this.apiUrl}/usuarios/${encodeURIComponent(samAccountName)}`);
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
