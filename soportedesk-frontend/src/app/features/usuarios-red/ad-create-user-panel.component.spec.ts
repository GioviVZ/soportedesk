import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdCreateUserPanelComponent } from './ad-create-user-panel.component';

describe('AdCreateUserPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): AdCreateUserPanelComponent {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdCreateUserPanelComponent());
    component.ngOnInit();
    httpMock.expectOne('/api/catalogos/dependencias').flush([]);
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

  it('crea el usuario sin contrato y emite saved', () => {
    const component = createComponent();
    component.form.samAccountName = 'jperez';
    component.form.givenName = 'Juan';
    component.form.surname = 'Perez';
    component.form.temporaryPassword = 'Temporal123';
    component.form.ouDestinoDn = 'OU=Soporte,DC=inia,DC=local';

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
