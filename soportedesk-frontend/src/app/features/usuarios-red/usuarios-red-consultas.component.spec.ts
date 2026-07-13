import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { UsuariosRedConsultasComponent } from './usuarios-red-consultas.component';
import { UsuarioRedConsultaResultado } from './usuario-red-contrato.model';

function consulta(overrides: Partial<UsuarioRedConsultaResultado> = {}): UsuarioRedConsultaResultado {
  return {
    usuario: 'jperez',
    displayName: 'Juan Perez',
    mail: null,
    office: 'Informatica',
    organizationalUnit: null,
    enabled: true,
    locked: false,
    vencimientoUsuarioRed: null,
    estadoVencimientoUsuarioRed: null,
    contratos: [],
    ...overrides,
  };
}

describe('UsuariosRedConsultasComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): UsuariosRedConsultasComponent {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedConsultasComponent());
  }

  function initComponent(directorio: UsuarioRedConsultaResultado[] = [consulta()]): UsuariosRedConsultasComponent {
    const component = createComponent();
    component.ngOnInit();
    const req = httpMock.expectOne((r) => r.url === '/api/usuarios-red/contratos/consultas');
    expect(req.request.params.has('termino')).toBe(false);
    req.flush(directorio);
    return component;
  }

  afterEach(() => httpMock.verify());

  describe('carga inicial del directorio', () => {
    it('carga el directorio sin termino al iniciar', () => {
      const component = initComponent([
        consulta({ usuario: 'jperez' }),
        consulta({ usuario: 'agomez', displayName: 'Ana Gomez' }),
      ]);

      expect(component.directorio.length).toBe(2);
      expect(component.directorioLoaded).toBe(true);
      expect(component.directorioError).toBe('');
    });

    it('marca error si falla la carga y no rompe el buscador', () => {
      const component = createComponent();
      component.ngOnInit();
      const req = httpMock.expectOne((r) => r.url === '/api/usuarios-red/contratos/consultas');
      req.flush('error', { status: 500, statusText: 'Server Error' });

      expect(component.directorioError).toBeTruthy();
      expect(component.directorio.length).toBe(0);

      component.termino = 'Juan';
      component.buscar();
      const searchReq = httpMock.expectOne((r) => r.params.get('termino') === 'Juan');
      searchReq.flush([consulta()]);

      expect(component.resultados.length).toBe(1);
    });
  });

  describe('filtros', () => {
    it('filtra por oficina, incluyendo el bucket "Sin oficina"', () => {
      const component = initComponent([
        consulta({ usuario: 'a', office: 'Informatica' }),
        consulta({ usuario: 'b', office: null }),
        consulta({ usuario: 'c', office: 'Informatica' }),
      ]);

      component.filters.oficina = 'Sin oficina';
      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['b']);

      component.filters.oficina = 'Informatica';
      expect(component.directorioFiltrado.map((i) => i.usuario).sort()).toEqual(['a', 'c']);
    });

    it('filtra por estado: habilitado, deshabilitado, bloqueado y sin ficha AD', () => {
      const component = initComponent([
        consulta({ usuario: 'hab', enabled: true, locked: false }),
        consulta({ usuario: 'deshab', enabled: false, locked: false }),
        consulta({ usuario: 'bloq', enabled: true, locked: true }),
        consulta({ usuario: 'sinad', enabled: null, locked: null }),
      ]);

      component.filters.estado = 'HABILITADO';
      expect(component.directorioFiltrado.map((i) => i.usuario).sort()).toEqual(['bloq', 'hab']);

      component.filters.estado = 'DESHABILITADO';
      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['deshab']);

      component.filters.estado = 'BLOQUEADO';
      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['bloq']);

      component.filters.estado = 'SIN_FICHA_AD';
      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['sinad']);
    });

    it('filtra por estado de vencimiento de red', () => {
      const component = initComponent([
        consulta({ usuario: 'vig', estadoVencimientoUsuarioRed: 'VIGENTE' }),
        consulta({ usuario: 'porv', estadoVencimientoUsuarioRed: 'POR_VENCER' }),
        consulta({ usuario: 'venc', estadoVencimientoUsuarioRed: 'VENCIDO' }),
        consulta({ usuario: 'sinf', estadoVencimientoUsuarioRed: 'SIN_FECHA' }),
      ]);

      component.filters.vencimiento = 'VENCIDO';
      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['venc']);
    });

    it('combina filtros de oficina, estado y vencimiento', () => {
      const component = initComponent([
        consulta({ usuario: 'match', office: 'Informatica', enabled: true, estadoVencimientoUsuarioRed: 'VIGENTE' }),
        consulta({ usuario: 'otraOficina', office: 'RRHH', enabled: true, estadoVencimientoUsuarioRed: 'VIGENTE' }),
        consulta({ usuario: 'deshabilitado', office: 'Informatica', enabled: false, estadoVencimientoUsuarioRed: 'VIGENTE' }),
      ]);

      component.filters = { oficina: 'Informatica', estado: 'HABILITADO', vencimiento: 'VIGENTE' };

      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['match']);
    });

    it('clearFilters resetea los filtros y hasActiveFilters refleja el estado', () => {
      const component = initComponent([consulta()]);
      expect(component.hasActiveFilters).toBe(false);

      component.filters.oficina = 'Informatica';
      expect(component.hasActiveFilters).toBe(true);

      component.clearFilters();
      expect(component.hasActiveFilters).toBe(false);
      expect(component.filters).toEqual({ oficina: '', estado: '', vencimiento: '' });
    });

    it('oficinas deduplica, agrega "Sin oficina" y ordena alfabeticamente', () => {
      const component = initComponent([
        consulta({ usuario: 'a', office: 'Zoologia' }),
        consulta({ usuario: 'b', office: 'Informatica' }),
        consulta({ usuario: 'c', office: 'Informatica' }),
        consulta({ usuario: 'd', office: null }),
      ]);

      expect(component.oficinas).toEqual(['Informatica', 'Sin oficina', 'Zoologia']);
    });
  });

  describe('ordenar por', () => {
    it('ordena por nombre A-Z por defecto', () => {
      const component = initComponent([
        consulta({ usuario: 'b', displayName: 'Beatriz' }),
        consulta({ usuario: 'a', displayName: 'Ana' }),
        consulta({ usuario: 'c', displayName: 'Carlos' }),
      ]);

      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['a', 'b', 'c']);
    });

    it('ordena por oficina A-Z', () => {
      const component = initComponent([
        consulta({ usuario: 'x', office: 'Zoologia' }),
        consulta({ usuario: 'y', office: 'Administracion' }),
        consulta({ usuario: 'z', office: null }),
      ]);
      component.ordenarPor = 'oficina';

      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['y', 'z', 'x']);
    });

    it('ordena por vencimiento, mas proximo primero, con "sin fecha" al final', () => {
      const component = initComponent([
        consulta({ usuario: 'later', vencimientoUsuarioRed: '2026-12-01' }),
        consulta({ usuario: 'soon', vencimientoUsuarioRed: '2026-08-01' }),
        consulta({ usuario: 'none', vencimientoUsuarioRed: null }),
      ]);
      component.ordenarPor = 'vencimiento';

      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['soon', 'later', 'none']);
    });
  });

  describe('busqueda (modo existente, sin cambios de comportamiento)', () => {
    it('busca por termino y guarda resultados', () => {
      const component = initComponent([]);
      component.termino = 'Juan';

      component.buscar();

      const req = httpMock.expectOne((r) => r.params.get('termino') === 'Juan');
      req.flush([consulta()]);

      expect(component.resultados.length).toBe(1);
      expect(component.buscandoActivo).toBe(true);
    });

    it('no busca si el termino tiene menos de 2 caracteres', () => {
      const component = initComponent([]);
      component.termino = 'a';

      component.buscar();

      httpMock.expectNone((req) => req.params.has('termino'));
    });

    it('limpiar() no dispara una nueva peticion de directorio', () => {
      const component = initComponent([consulta()]);
      component.termino = 'Juan';
      component.buscar();
      const req = httpMock.expectOne((r) => r.params.get('termino') === 'Juan');
      req.flush([consulta()]);

      component.limpiar();

      httpMock.expectNone((r) => r.url === '/api/usuarios-red/contratos/consultas');
      expect(component.buscandoActivo).toBe(false);
      expect(component.directorio.length).toBe(1);
    });

    it('abrirResultado abre el detalle consultando active-directory por samAccountName', () => {
      const component = initComponent([]);

      component.abrirResultado(consulta({ usuario: 'jperez' }));

      expect(component.detailOpen).toBe(true);
      httpMock.expectOne('/api/active-directory/usuarios/jperez').flush({
        success: true,
        message: 'ok',
        data: { samAccountName: 'jperez', displayName: 'Juan Perez' },
      });

      expect(component.selectedUser?.samAccountName).toBe('jperez');
    });

    it('tieneFichaAd es false cuando no hay ficha AD (enabled null)', () => {
      const component = initComponent([]);
      expect(component.tieneFichaAd(consulta({ enabled: null, usuario: 'x' }))).toBe(false);
      expect(component.tieneFichaAd(consulta({ enabled: true, usuario: 'x' }))).toBe(true);
    });

    it('initials calcula las iniciales del nombre', () => {
      const component = initComponent([]);
      expect(component.initials(consulta({ displayName: 'Juan Perez' }))).toBe('JP');
    });
  });
});
