import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdCreateUserPanelComponent } from './ad-create-user-panel.component';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('AdCreateUserPanelComponent', () => {
  let httpMock: HttpTestingController;
  const correoDisponible = {
    email: 'jperez@inia.gob.pe',
    nombreCompleto: 'Juan Perez',
    estado: 'Activo',
  };

  function createComponent(): AdCreateUserPanelComponent {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdCreateUserPanelComponent());
    component.ngOnInit();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);
    httpMock.expectOne('/api/active-directory/correos-disponibles').flush([correoDisponible]);
    return component;
  }

  afterEach(() => httpMock.verify());

  it('autogenera el UPN a partir del usuario mientras no se edite manualmente', () => {
    const component = createComponent();
    component.onSamChanged('jperez');
    expect(component.form.userPrincipalName).toBe('jperez@inia.local');

    component.onUpnChanged('otro@inia.local');
    component.onSamChanged('jperez2');
    expect(component.form.userPrincipalName).toBe('otro@inia.local');
  });

  it('no envia la peticion si faltan campos obligatorios', () => {
    const component = createComponent();
    component.submit();
    expect(component.error).toBe('Completa usuario, nombres, apellidos, contraseña temporal y OU destino.');
    httpMock.expectNone('/api/active-directory/usuarios');
  });

  it('vincula el correo al seleccionarlo desde el inventario de Correos', () => {
    const component = createComponent();

    component.onCorreoSearch('Juan');
    expect(component.correosFiltrados).toEqual([correoDisponible]);

    component.selectCorreo(correoDisponible);
    expect(component.form.mail).toBe('jperez@inia.gob.pe');
    expect(component.correoPickerOpen).toBeFalse();
  });

  it('rechaza un correo escrito manualmente aunque tenga formato valido', () => {
    const component = createComponent();
    component.form.samAccountName = 'jperez';
    component.form.givenName = 'Juan';
    component.form.surname = 'Perez';
    component.form.mail = 'externo@example.com';
    component.form.temporaryPassword = 'Temporal123';
    component.form.ouDestinoDn = 'OU=Soporte,DC=inia,DC=local';

    component.submit();

    expect(component.error).toBe('Selecciona un correo de la lista sincronizada con el módulo Correos.');
    httpMock.expectNone('/api/active-directory/usuarios');
  });

  it('permite crear el usuario sin correo institucional', () => {
    const component = createComponent();
    component.form.samAccountName = 'scorreo';
    component.form.givenName = 'Sin';
    component.form.surname = 'Correo';
    component.form.temporaryPassword = 'Temporal123';
    component.form.ouDestinoDn = 'OU=Soporte,DC=inia,DC=local';

    component.submit();

    const request = httpMock.expectOne('/api/active-directory/usuarios');
    expect(request.request.body.mail).toBeNull();
    request.flush({ success: true, message: 'Usuario creado.', data: { samAccountName: 'scorreo' } });
  });

  it('crea el usuario sin contrato y emite saved', () => {
    const component = createComponent();
    component.form.samAccountName = 'jperez';
    component.form.givenName = 'Juan';
    component.form.surname = 'Perez';
    component.form.temporaryPassword = 'Temporal123';
    component.form.ouDestinoDn = 'OU=Soporte,DC=inia,DC=local';
    component.selectCorreo(correoDisponible);

    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios').flush({
      success: true,
      message: 'Usuario creado.',
      data: { samAccountName: 'jperez' },
    });

    expect(result.user.samAccountName).toBe('jperez');
    expect(result.notice.text).toBe('Usuario creado.');
  });

  it('crea el usuario con contrato inicial y encadena el registro del contrato', () => {
    const component = createComponent();
    component.form.samAccountName = 'jperez';
    component.form.givenName = 'Juan';
    component.form.surname = 'Perez';
    component.form.temporaryPassword = 'Temporal123';
    component.form.ouDestinoDn = 'OU=Soporte,DC=inia,DC=local';
    component.selectCorreo(correoDisponible);
    component.contratoEnabled = true;
    component.contratoForm.tipoContratoId = 5;
    component.contratoForm.fechaInicio = '2026-07-13';

    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios').flush({
      success: true,
      message: 'Usuario creado.',
      data: { samAccountName: 'jperez' },
    });
    httpMock.expectOne('/api/usuarios-red/contratos').flush({
      id: 1, usuario: 'jperez', tipoContratoId: 5, tipoContratoNombre: 'CAS', fechaInicio: '2026-07-13', fechaFin: null,
      numeroContrato: null, personalNombre: null, personalApellidos: null, registradoPor: null, fechaRegistro: null,
      actualizadoPor: null, fechaActualizacion: null,
    });

    expect(result.notice.text).toBe('Usuario creado. Contrato inicial registrado.');
  });

  it('si el registro del contrato falla, igual emite saved pero con notice de error', () => {
    const component = createComponent();
    component.form.samAccountName = 'jperez';
    component.form.givenName = 'Juan';
    component.form.surname = 'Perez';
    component.form.temporaryPassword = 'Temporal123';
    component.form.ouDestinoDn = 'OU=Soporte,DC=inia,DC=local';
    component.selectCorreo(correoDisponible);
    component.contratoEnabled = true;
    component.contratoForm.tipoContratoId = 5;
    component.contratoForm.fechaInicio = '2026-07-13';

    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios').flush({
      success: true,
      message: 'Usuario creado.',
      data: { samAccountName: 'jperez' },
    });
    httpMock
      .expectOne('/api/usuarios-red/contratos')
      .flush({ message: 'Tipo de contrato invalido.' }, { status: 400, statusText: 'Bad Request' });

    expect(result.notice.tone).toBe('error');
    expect(result.notice.text).toContain('Usuario creado en AD, pero no se pudo registrar el contrato');
  });
});
