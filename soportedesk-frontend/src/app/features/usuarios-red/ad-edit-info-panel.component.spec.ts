import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdEditInfoPanelComponent } from './ad-edit-info-panel.component';
import { AdUser } from './active-directory.model';

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

  function createComponent(user: AdUser): AdEditInfoPanelComponent {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdEditInfoPanelComponent());
    component.user = user;
    return component;
  }

  afterEach(() => httpMock.verify());

  it('precarga el formulario y selecciona la dependencia que coincide con el area de AD', () => {
    const component = createComponent(buildUser());
    component.ngOnInit();

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
});
