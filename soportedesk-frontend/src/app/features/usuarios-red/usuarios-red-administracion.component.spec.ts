import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { UsuariosRedAdministracionComponent } from './usuarios-red-administracion.component';

describe('UsuariosRedAdministracionComponent - sincronizacion AD', () => {
  let httpMock: HttpTestingController;

  function createComponent(): UsuariosRedAdministracionComponent {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedAdministracionComponent());
  }

  function flushInitialRequests(): void {
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 0,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 0,
    });
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: false,
      procesados: 0,
      total: 0,
      iniciadoEn: null,
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });
  }

  afterEach(() => httpMock.verify());

  it('hace polling mientras corre el sync, se detiene al terminar y refresca el dashboard', fakeAsync(() => {
    const component = createComponent();
    component.ngOnInit();
    flushInitialRequests();

    component.startSync();
    httpMock.expectOne('/api/active-directory/sync/iniciar').flush({
      running: true,
      procesados: 0,
      total: 0,
      iniciadoEn: '2026-07-10T10:00:00',
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });

    tick(1500);
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: true,
      procesados: 250,
      total: 500,
      iniciadoEn: '2026-07-10T10:00:00',
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });
    expect(component.syncStatus?.running).toBe(true);
    expect(component.syncPercent()).toBe(50);

    tick(1500);
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: false,
      procesados: 500,
      total: 500,
      iniciadoEn: '2026-07-10T10:00:00',
      finalizadoEn: '2026-07-10T10:01:00',
      ultimoResultado: { usuariosSincronizados: 500, controladoresDominio: 2, sincronizadoEn: '2026-07-10T10:01:00' },
      error: null,
    });
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 500,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 2,
    });

    expect(component.syncStatus?.running).toBe(false);
    expect(component.notice?.tone).toBe('success');

    tick(1500);
    httpMock.expectNone('/api/active-directory/sync/estado');

    component.ngOnDestroy();
  }));

  it('retoma el polling si al entrar a la pantalla ya hay un sync corriendo', fakeAsync(() => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 0,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 0,
    });
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: true,
      procesados: 100,
      total: 400,
      iniciadoEn: '2026-07-10T09:00:00',
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });

    expect(component.syncStatus?.running).toBe(true);

    tick(1500);
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: false,
      procesados: 400,
      total: 400,
      iniciadoEn: '2026-07-10T09:00:00',
      finalizadoEn: '2026-07-10T09:01:00',
      ultimoResultado: { usuariosSincronizados: 400, controladoresDominio: 1, sincronizadoEn: '2026-07-10T09:01:00' },
      error: null,
    });
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 400,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 1,
    });

    expect(component.syncStatus?.running).toBe(false);

    component.ngOnDestroy();
  }));
});

describe('UsuariosRedAdministracionComponent - paneles', () => {
  let httpMock: HttpTestingController;

  function createComponent(): UsuariosRedAdministracionComponent {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedAdministracionComponent());
  }

  function flushInitialRequests(): void {
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 0,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 0,
    });
    httpMock.expectOne('/api/active-directory/sync/estado').flush({
      running: false,
      procesados: 0,
      total: 0,
      iniciadoEn: null,
      finalizadoEn: null,
      ultimoResultado: null,
      error: null,
    });
  }

  afterEach(() => httpMock.verify());

  it('onPanelSaved actualiza el usuario, cierra el panel activo y refresca el dashboard', () => {
    const component = createComponent();
    component.ngOnInit();
    flushInitialRequests();

    component.activePanel = 'password';
    component.onPanelSaved({
      user: { samAccountName: 'jperez', enabled: true } as any,
      notice: { tone: 'success', text: 'Contraseña restablecida.' },
    });

    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 1,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 1,
    });

    expect(component.user?.samAccountName).toBe('jperez');
    expect(component.activePanel).toBeNull();
    expect(component.notice?.text).toBe('Contraseña restablecida.');
  });

  it('onPanelChanged actualiza el usuario sin cerrar el panel activo', () => {
    const component = createComponent();
    component.ngOnInit();
    flushInitialRequests();

    component.activePanel = 'groups';
    component.onPanelChanged({
      user: { samAccountName: 'jperez', enabled: true } as any,
      notice: { tone: 'success', text: 'Grupo agregado.' },
    });

    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 1,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 1,
    });

    expect(component.user?.samAccountName).toBe('jperez');
    expect(component.activePanel).toBe('groups');
  });

  it('openPanel no abre paneles de gestion si no hay usuario seleccionado', () => {
    const component = createComponent();
    component.ngOnInit();
    flushInitialRequests();

    component.openPanel('password');
    expect(component.activePanel).toBeNull();

    component.openPanel('create');
    expect(component.activePanel).toBe('create');
  });
});
