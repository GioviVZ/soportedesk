import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CatalogosComponent } from './catalogos.component';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('CatalogosComponent', () => {
  let component: CatalogosComponent;
  let fixture: ComponentFixture<CatalogosComponent>;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  function flushLoadAll(sedesData: unknown[] = [], tiposImpresoraData: unknown[] = [], marcasImpresoraData: unknown[] = []): void {
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush(sedesData);
    httpMock.expectOne((req) => req.url.includes('/catalogos/dependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/subdependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-licencia')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-bien')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-impresora')).flush(tiposImpresoraData);
    httpMock.expectOne((req) => req.url.includes('/catalogos/marcas-impresora')).flush(marcasImpresoraData);
    httpMock.expectOne((req) => req.url.includes('/catalogos/modelos-impresora')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipo-equipo')).flush([]);
    // Dos peticiones a config-institucional: una de CatalogosComponent.loadVpnConfig()
    // y otra de VpnConfigInstitucionalFormComponent, que se instancia eagerly como
    // contenido proyectado dentro de app-modal aunque el modal este cerrado.
    httpMock.match((req) => req.url.includes('/vpn/config-institucional'))
      .forEach((req) => req.flush({ vencimientoAntivirus: null }));
  }

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['canWrite']);
    authService.canWrite.and.returnValue(true);

    await TestBed.configureTestingModule({
    imports: [CatalogosComponent],
    providers: [{ provide: AuthService, useValue: authService }, provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

    fixture = TestBed.createComponent(CatalogosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);

    flushLoadAll();
  });

  it('setTheme delega en ThemeService y expone el tema actual', () => {
    const themeService = TestBed.inject(ThemeService);

    component.setTheme('dark');

    expect(themeService.theme()).toBe('dark');
    expect(component.theme()).toBe('dark');

    component.setTheme('light');

    expect(themeService.theme()).toBe('light');
    expect(component.theme()).toBe('light');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should default to sedes tab', () => {
    expect(component.activeTab).toBe('sedes');
  });

  it('should switch to dependencias tab', () => {
    component.setTab('dependencias');
    expect(component.activeTab).toBe('dependencias');
  });

  it('should create a sede and reload', () => {
    component.activeTab = 'sedes';
    component.nombreForm = 'Nueva Sede';
    component.submitSimple();

    const postReq = httpMock.expectOne((req) =>
      req.method === 'POST' && req.url.includes('/catalogos/sedes'),
    );
    postReq.flush({ id: 1, nombre: 'Nueva Sede' });

    // After create, loadAll() fires 6 more requests
    flushLoadAll([{ id: 1, nombre: 'Nueva Sede' }]);

    expect(component.sedes.length).toBe(1);
  });

  it('should create a tipo de impresora and reload', () => {
    component.activeTab = 'tiposImpresora';
    component.nombreForm = 'Láser';
    component.submitSimple();

    const postReq = httpMock.expectOne((req) =>
      req.method === 'POST' && req.url.includes('/catalogos/tipos-impresora'),
    );
    postReq.flush({ id: 1, nombre: 'Láser' });

    // After create, loadAll() fires 7 requests including tipos-impresora
    flushLoadAll([], [{ id: 1, nombre: 'Láser' }]);

    expect(component.tiposImpresora.length).toBe(1);
  });

  it('should create a marca de impresora and reload', () => {
    component.activeTab = 'marcasImpresora';
    component.nombreForm = 'HP';
    component.submitSimple();

    const postReq = httpMock.expectOne((req) =>
      req.method === 'POST' && req.url.includes('/catalogos/marcas-impresora'),
    );
    postReq.flush({ id: 1, nombre: 'HP' });

    flushLoadAll([], [], [{ id: 1, nombre: 'HP' }]);

    expect(component.marcasImpresora.length).toBe(1);
  });

  it('does not create a sede without catalog edit permission', () => {
    authService.canWrite.and.returnValue(false);
    component.activeTab = 'sedes';
    component.nombreForm = 'Nueva Sede';

    component.submitSimple();

    httpMock.expectNone((req) => req.method === 'POST' && req.url.includes('/catalogos/sedes'));
    expect(authService.canWrite).toHaveBeenCalledWith('catalogos');
  });
});
