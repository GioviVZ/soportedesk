import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuarioRedContratosPanelComponent } from './usuario-red-contratos-panel.component';
import { UsuarioRedContrato } from './usuario-red-contrato.model';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('UsuarioRedContratosPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): UsuarioRedContratosPanelComponent {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuarioRedContratosPanelComponent());
  }

  const contratoOs: UsuarioRedContrato = {
    id: 1,
    usuario: 'jperez',
    tipoContratoId: 1,
    tipoContratoNombre: 'OS',
    fechaInicio: '2026-01-01',
    fechaFin: '2026-12-31',
    numeroContrato: 'OS-001-2026',
    personalNombre: 'Juan',
    personalApellidos: 'Pérez',
    registradoPor: 'admin',
    fechaRegistro: '2026-01-01T10:00:00',
    actualizadoPor: null,
    fechaActualizacion: null,
  };

  const contratoCas: UsuarioRedContrato = {
    ...contratoOs,
    id: 2,
    tipoContratoId: 2,
    tipoContratoNombre: 'CAS',
    personalNombre: null,
    personalApellidos: null,
  };

  afterEach(() => httpMock.verify());

  it('carga los contratos del usuario cuando cambia el input usuario', () => {
    const component = createComponent();
    component.usuario = 'jperez';

    component.ngOnChanges({ usuario: { currentValue: 'jperez', previousValue: undefined, firstChange: true, isFirstChange: () => true } });

    httpMock.expectOne('/api/usuarios-red/contratos?usuario=jperez').flush([contratoOs, contratoCas]);

    expect(component.contratos).toEqual([contratoOs, contratoCas]);
  });

  it('esOs identifica solo contratos de tipo OS, sin importar mayusculas', () => {
    const component = createComponent();

    expect(component.esOs(contratoOs)).toBe(true);
    expect(component.esOs(contratoCas)).toBe(false);
  });

  it('openCreate carga catalogos y abre el modal en modo alta', () => {
    const component = createComponent();
    component.usuario = 'jperez';

    component.openCreate();
    httpMock.expectOne('/api/catalogos/tipos-contrato').flush([
      { id: 1, nombre: 'OS' },
      { id: 2, nombre: 'CAS' },
    ]);

    expect(component.modalOpen).toBe(true);
    expect(component.editingId).toBeNull();
    expect(component.form.usuario).toBe('jperez');
  });

  it('esTipoSeleccionadoOs refleja el tipo de contrato elegido en el form', () => {
    const component = createComponent();
    component.tiposContrato = [
      { id: 1, nombre: 'OS' },
      { id: 2, nombre: 'CAS' },
    ];

    component.form.tipoContratoId = 1;
    expect(component.esTipoSeleccionadoOs()).toBe(true);

    component.form.tipoContratoId = 2;
    expect(component.esTipoSeleccionadoOs()).toBe(false);
  });

  it('save crea un contrato con el usuario del panel y recarga la lista', () => {
    const component = createComponent();
    component.usuario = 'jperez';
    component.form = {
      usuario: 'otro',
      tipoContratoId: 1,
      fechaInicio: '2026-01-01',
      fechaFin: null,
      numeroContrato: null,
      personalNombre: null,
      personalApellidos: null,
    };

    component.save();

    const req = httpMock.expectOne('/api/usuarios-red/contratos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.usuario).toBe('jperez');
    req.flush(contratoOs);

    httpMock.expectOne('/api/usuarios-red/contratos?usuario=jperez').flush([contratoOs]);

    expect(component.modalOpen).toBe(false);
  });

  it('remove pide confirmacion y elimina el contrato', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const component = createComponent();
    component.usuario = 'jperez';

    component.remove(contratoOs);

    httpMock.expectOne('/api/usuarios-red/contratos/1').flush(null);
    httpMock.expectOne('/api/usuarios-red/contratos?usuario=jperez').flush([]);

    expect(window.confirm).toHaveBeenCalled();
  });

  it('remove no elimina si el usuario cancela la confirmacion', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const component = createComponent();
    component.usuario = 'jperez';

    component.remove(contratoOs);

    httpMock.expectNone('/api/usuarios-red/contratos/1');
  });
});
