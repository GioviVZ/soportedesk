import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const response: AuthResponse = {
    token: 'fake-jwt-token',
    username: 'admin',
    nombre: 'Administrador',
    rol: 'ADMIN',
    permisos: {},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login stores token and role in localStorage', () => {
    service.login({ username: 'admin', password: 'admin123' }).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(response);

    expect(localStorage.getItem('token')).toBe('fake-jwt-token');
    expect(localStorage.getItem('rol')).toBe('ADMIN');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.isAdmin()).toBe(true);
  });

  it('logout clears stored session', () => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('rol', 'ADMIN');

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('cambiarPassword posts current and new password', () => {
    service.cambiarPassword('old123', 'newpass1').subscribe();

    const req = httpMock.expectOne('/api/auth/cambiar-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ passwordActual: 'old123', passwordNueva: 'newpass1' });
    req.flush(null);
  });
});
