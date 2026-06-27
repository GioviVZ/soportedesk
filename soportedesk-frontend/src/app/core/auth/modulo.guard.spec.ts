import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { moduloGuard } from './modulo.guard';

describe('moduloGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'canRead']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows access when the user can read the module', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => moduloGuard('licencias')({} as any, {} as any));

    expect(result).toBe(true);
    expect(authService.canRead).toHaveBeenCalledWith('licencias');
  });

  it('allows access for admins regardless of canRead', () => {
    authService.isAdmin.and.returnValue(true);
    authService.canRead.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => moduloGuard('licencias')({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('redirects to dashboard and denies access without read permission', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => moduloGuard('licencias')({} as any, {} as any));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
