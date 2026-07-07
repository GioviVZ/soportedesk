import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, NivelPermiso, Rol } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('rol', response.rol);
        localStorage.setItem('username', response.username);
        localStorage.setItem('nombre', response.nombre);
        localStorage.setItem('permisos', JSON.stringify(response.permisos ?? {}));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('username');
    localStorage.removeItem('nombre');
    localStorage.removeItem('permisos');
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cambiar-password`, { passwordActual, passwordNueva });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): Rol | null {
    return localStorage.getItem('rol') as Rol | null;
  }

  getNombre(): string | null {
    return localStorage.getItem('nombre');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  getPermisos(): Record<string, NivelPermiso> {
    try {
      return JSON.parse(localStorage.getItem('permisos') ?? '{}');
    } catch {
      return {};
    }
  }

  canRead(modulo: string): boolean {
    if (this.isAdmin()) return true;
    return modulo in this.getPermisos();
  }

  canWrite(modulo: string): boolean {
    if (this.isAdmin()) return true;
    return this.getPermisos()[modulo] === 'EDIT';
  }
}
