import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Wifi, WifiRequest } from './wifi.model';

@Injectable({ providedIn: 'root' })
export class WifiService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/wifi`;

  getAll(search?: string): Observable<Wifi[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Wifi[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Wifi> {
    return this.http.get<Wifi>(`${this.apiUrl}/${id}`);
  }

  create(request: WifiRequest): Observable<Wifi> {
    return this.http.post<Wifi>(this.apiUrl, request);
  }

  update(id: number, request: WifiRequest): Observable<Wifi> {
    return this.http.put<Wifi>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
