import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PersonaCandidato } from './persona-candidato.model';

@Injectable({ providedIn: 'root' })
export class PersonaCandidatoService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/personas/candidatos`;

  getPendientes(): Observable<PersonaCandidato[]> {
    return this.http.get<PersonaCandidato[]>(this.apiUrl);
  }

  confirmar(id: number): Observable<{ personaId: number }> {
    return this.http.post<{ personaId: number }>(`${this.apiUrl}/${id}/confirmar`, {});
  }

  descartar(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/descartar`, {});
  }

  detectarAhora(): Observable<{ nuevos: number; totalPendientes: number }> {
    return this.http.post<{ nuevos: number; totalPendientes: number }>(`${this.apiUrl}/detectar-ahora`, {});
  }
}
