import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { RealtimeService } from './realtime.service';

describe('RealtimeService', () => {
  let service: RealtimeService;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    auth.getToken.and.returnValue('token-vencido');
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        RealtimeService,
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(RealtimeService);
  });

  afterEach(() => service.stop());

  it('cierra la sesion y no reconecta cuando el token vencio', fakeAsync(() => {
    spyOn(window, 'fetch').and.resolveTo(new Response(null, { status: 401 }));

    service.start();
    flushMicrotasks();

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(window.fetch).toHaveBeenCalledTimes(1);
  }));
});
