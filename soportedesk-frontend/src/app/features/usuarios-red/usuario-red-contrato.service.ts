import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioRedConsultaResultado, UsuarioRedContrato, UsuarioRedContratoRequest } from './usuario-red-contrato.model';

@Injectable({ providedIn: 'root' })
export class UsuarioRedContratoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/usuarios-red/contratos`;

  getByUsuario(usuario: string): Observable<UsuarioRedContrato[]> {
    return this.http.get<UsuarioRedContrato[]>(this.apiUrl, { params: { usuario } });
  }

  buscarPorPersonal(termino: string): Observable<UsuarioRedContrato[]> {
    return this.http.get<UsuarioRedContrato[]>(`${this.apiUrl}/buscar`, { params: { termino } });
  }

  buscarConsultas(termino: string): Observable<UsuarioRedConsultaResultado[]> {
    return this.http.get<UsuarioRedConsultaResultado[]>(`${this.apiUrl}/consultas`, { params: { termino } });
  }

  create(request: UsuarioRedContratoRequest): Observable<UsuarioRedContrato> {
    return this.http.post<UsuarioRedContrato>(this.apiUrl, request);
  }

  update(id: number, request: UsuarioRedContratoRequest): Observable<UsuarioRedContrato> {
    return this.http.put<UsuarioRedContrato>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
