import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { UsuariosRedConsultasComponent } from './usuarios-red-consultas.component';

describe('UsuariosRedConsultasComponent - busqueda por personal', () => {
  let httpMock: HttpTestingController;

  function createComponent(): UsuariosRedConsultasComponent {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedConsultasComponent());
  }

  afterEach(() => httpMock.verify());

  it('no busca si el termino tiene menos de 2 caracteres', () => {
    const component = createComponent();
    component.personalTerm = 'a';

    component.buscarPorPersonal();

    httpMock.expectNone((req) => req.url.includes('/contratos/buscar'));
  });

  it('busca contratos por nombre de personal y guarda los resultados', () => {
    const component = createComponent();
    component.personalTerm = 'Juan';

    component.buscarPorPersonal();

    const req = httpMock.expectOne((r) => r.url === '/api/usuarios-red/contratos/buscar');
    expect(req.request.params.get('termino')).toBe('Juan');
    req.flush([
      {
        id: 1,
        usuario: 'jperez',
        tipoContratoId: 1,
        tipoContratoNombre: 'OS',
        fechaInicio: '2026-01-01',
        fechaFin: null,
        numeroContrato: 'OS-001-2026',
        personalNombre: 'Juan',
        personalApellidos: 'Pérez',
        registradoPor: 'admin',
        fechaRegistro: '2026-01-01T10:00:00',
        actualizadoPor: null,
        fechaActualizacion: null,
      },
    ]);

    expect(component.personalResults.length).toBe(1);
    expect(component.personalSearching).toBe(false);
  });

  it('abrirPorUsuario abre el detalle consultando active-directory por samAccountName', () => {
    const component = createComponent();

    component.abrirPorUsuario('jperez');

    expect(component.detailOpen).toBe(true);
    httpMock.expectOne('/api/active-directory/usuarios/jperez').flush({
      success: true,
      message: 'ok',
      data: { samAccountName: 'jperez', displayName: 'Juan Perez' },
    });

    expect(component.selectedUser?.samAccountName).toBe('jperez');
  });
});
