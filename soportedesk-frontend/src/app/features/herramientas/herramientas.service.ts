import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PingResult, SystemInventoryResponse } from './herramientas.model';

@Injectable({ providedIn: 'root' })
export class HerramientasService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/herramientas`;

  ping(host: string): Observable<PingResult> {
    return this.http.post<PingResult>(`${this.apiUrl}/ping`, { host });
  }

  inventory(): Observable<SystemInventoryResponse> {
    return this.http.get<SystemInventoryResponse>(`${this.apiUrl}/inventario`);
  }
}
