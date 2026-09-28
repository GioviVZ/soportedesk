import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { vpnAdminGuard } from './vpn-admin.guard';

describe('vpnAdminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'canWrite']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows access for admins', () => {
    authService.isAdmin.and.returnValue(true);
    authService.canWrite.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => vpnAdminGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('allows access with solicitar-vpn write permission', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canWrite.and.callFake((modulo: string) => modulo === 'solicitar-vpn');

    const result = TestBed.runInInjectionContext(() => vpnAdminGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('allows access with aprobar-vpn write permission', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canWrite.and.callFake((modulo: string) => modulo === 'aprobar-vpn');

    const result = TestBed.runInInjectionContext(() => vpnAdminGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('redirects to dashboard without either permission', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canWrite.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => vpnAdminGuard({} as any, {} as any));

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
