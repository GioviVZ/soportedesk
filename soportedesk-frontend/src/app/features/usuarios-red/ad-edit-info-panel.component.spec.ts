import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdEditInfoPanelComponent } from './ad-edit-info-panel.component';
import { AdUser } from './active-directory.model';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

function buildUser(overrides: Partial<AdUser> = {}): AdUser {
  return {
    samAccountName: 'jperez',
    displayName: 'Juan Perez',
    givenName: 'Juan',
    surname: 'Perez',
    mail: 'jperez@inia.local',
    department: 'Soporte',
    company: null,
    title: 'Analista',
    telephoneNumber: null,
    mobile: null,
    office: 'Soporte',
    description: null,
    distinguishedName: null,
    userPrincipalName: 'jperez@inia.local',
    enabled: true,
    locked: false,
    organizationalUnit: null,
    whenCreated: null,
    whenChanged: null,
    pwdLastSet: null,
    lastLogonTimestamp: null,
    accountExpires: null,
    badPwdCount: null,
    daysSincePasswordChange: null,
    groups: [],
    ...overrides,
  };
}

describe('AdEditInfoPanelComponent', () => {
  let httpMock: HttpTestingController;
  const correoDisponible = {
    email: 'nuevo@inia.gob.pe',
    nombreCompleto: 'Juan Perez',
    estado: 'Activo',
  };

  function flushCorreos(correos = [correoDisponible]): void {
    httpMock
      .expectOne((req) => req.url === '/api/active-directory/correos-disponibles'
        && req.params.get('samAccountName') === 'jperez')
      .flush(correos);
  }

  function createComponent(user: AdUser): AdEditInfoPanelComponent {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdEditInfoPanelComponent());
    component.user = user;
    return component;
  }

  afterEach(() => httpMock.verify());

  it('precarga el formulario y selecciona la dependencia que coincide con el area de AD', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();
    flushCorreos();

    httpMock.expectOne('/api/catalogos/dependencias').flush([
      { id: 1, nombre: 'Soporte' },
      { id: 2, nombre: 'Administracion' },
    ]);
    httpMock
      .expectOne((req) => req.url === '/api/catalogos/subdependencias' && req.params.get('dependenciaId') === '1')
      .flush([{ id: 10, nombre: 'Soporte' }]);

    expect(component.form.displayName).toBe('Juan Perez');
    expect(component.dependenciaId).toBe(1);
  });

  it('emite saved con el usuario actualizado cuando el guardado es exitoso', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();
    flushCorreos();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);

    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios/jperez/actualizar-info').flush({
      success: true,
      message: 'Datos actualizados.',
      data: buildUser({ title: 'Analista Senior' }),
    });

    expect(result.user.title).toBe('Analista Senior');
  });

  it('muestra error y no emite saved si el backend responde success:false', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();
    flushCorreos();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);

    let emitted = false;
    component.saved.subscribe(() => (emitted = true));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios/jperez/actualizar-info').flush({
      success: false,
      message: 'No se pudo actualizar.',
      data: null,
    });

    expect(emitted).toBe(false);
    expect(component.error).toBe('No se pudo actualizar.');
  });

  it('busca y selecciona un correo disponible del modulo Correos', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();
    flushCorreos();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);

    component.onCorreoSearch('Juan');
    expect(component.correosFiltrados).toEqual([correoDisponible]);

    component.selectCorreo(correoDisponible);
    expect(component.form.mail).toBe('nuevo@inia.gob.pe');
  });

  it('permite quitar el correo y envia null al actualizar', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();
    flushCorreos();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);

    component.clearCorreo();
    component.submit();

    const request = httpMock.expectOne('/api/active-directory/usuarios/jperez/actualizar-info');
    expect(request.request.body.mail).toBeNull();
    expect(request.request.body.clearMail).toBeTrue();
    request.flush({ success: true, message: 'Datos actualizados.', data: buildUser({ mail: null }) });
  });

  it('rechaza un correo manual que no pertenece a la lista sincronizada', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();
    flushCorreos();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);
    component.form.mail = 'externo@example.com';

    component.submit();

    expect(component.error).toBe('Selecciona un correo de la lista sincronizada con el módulo Correos.');
    httpMock.expectNone('/api/active-directory/usuarios/jperez/actualizar-info');
  });
});
