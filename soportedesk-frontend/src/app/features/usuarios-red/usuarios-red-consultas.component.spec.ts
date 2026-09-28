import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Dependencia, Sede, Subdependencia } from '@soportedesk/core';
import { UsuariosRedConsultasComponent } from './usuarios-red-consultas.component';
import { UsuarioRedConsultaResultado } from './usuario-red-contrato.model';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

interface CatalogoPrueba {
  sedes: Sede[];
  dependencias: Dependencia[];
  subdependencias: Subdependencia[];
}

const CATALOGO_VACIO: CatalogoPrueba = {
  sedes: [],
  dependencias: [],
  subdependencias: [],
};

const SEDE_CENTRAL: Sede = { id: 1, nombre: 'Sede Central' };
const DEPENDENCIA_TI: Dependencia = {
  id: 10,
  nombre: 'Tecnologías de la Información',
  sede: SEDE_CENTRAL,
  orgUnitPath: null,
};
const SUBDEPENDENCIA_MESA_AYUDA: Subdependencia = {
  id: 100,
  nombre: 'Mesa de Ayuda',
  dependencia: DEPENDENCIA_TI,
  orgUnitPath: null,
};
const CATALOGO_UBICACION: CatalogoPrueba = {
  sedes: [SEDE_CENTRAL],
  dependencias: [DEPENDENCIA_TI],
  subdependencias: [SUBDEPENDENCIA_MESA_AYUDA],
};

function consulta(overrides: Partial<UsuarioRedConsultaResultado> = {}): UsuarioRedConsultaResultado {
  return {
    usuario: 'jperez',
    displayName: 'Juan Perez',
    mail: null,
    office: 'Informatica',
    department: null,
    company: null,
    organizationalUnit: null,
    enabled: true,
    locked: false,
    vencimientoUsuarioRed: null,
    estadoVencimientoUsuarioRed: null,
    hosts: [],
    contratos: [],
    ...overrides,
  };
}

describe('UsuariosRedConsultasComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): UsuariosRedConsultasComponent {
    TestBed.configureTestingModule({
    imports: [],
    providers: [{ provide: Router, useValue: { navigate: () => Promise.resolve(true) } }, provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
});
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedConsultasComponent());
  }

  function flushCatalogos(catalogo: CatalogoPrueba = CATALOGO_VACIO): void {
    httpMock.expectOne('/api/catalogos/sedes').flush(catalogo.sedes);
    httpMock.expectOne('/api/catalogos/dependencias').flush(catalogo.dependencias);
    httpMock.expectOne('/api/catalogos/subdependencias').flush(catalogo.subdependencias);
  }

  function initComponent(
    directorio: UsuarioRedConsultaResultado[] = [consulta()],
    catalogo: CatalogoPrueba = CATALOGO_VACIO,
  ): UsuariosRedConsultasComponent {
    const component = createComponent();
    component.ngOnInit();
    flushCatalogos(catalogo);
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
      flushCatalogos();
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
    it('filtra por sede, dependencia y subdependencia, incluyendo el bucket "Pendiente de clasificar"', () => {
      const component = initComponent([
        consulta({ usuario: 'dependencia', department: 'tecnologias-de la informacion' }),
        consulta({ usuario: 'subdependencia', company: 'TECNOLOGIAS DE LA INFORMACION', department: 'MESA-DE AYUDA' }),
        consulta({ usuario: 'pendiente', company: 'Recursos Humanos', department: 'Talento' }),
      ], CATALOGO_UBICACION);

      component.filters.sedeId = SEDE_CENTRAL.id.toString();
      expect(component.directorioFiltrado.map((i) => i.usuario).sort()).toEqual(['dependencia', 'subdependencia']);

      component.filters.dependenciaId = DEPENDENCIA_TI.id.toString();
      expect(component.directorioFiltrado.map((i) => i.usuario).sort()).toEqual(['dependencia', 'subdependencia']);

      component.filters.subdependenciaId = SUBDEPENDENCIA_MESA_AYUDA.id.toString();
      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['subdependencia']);

      component.filters.subdependenciaId = '';
      component.filters.dependenciaId = component.PENDIENTE;
      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['pendiente']);
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

    it('combina filtros de dependencia, estado y vencimiento', () => {
      const component = initComponent([
        consulta({ usuario: 'match', company: 'Tecnologias de la Informacion', enabled: true, estadoVencimientoUsuarioRed: 'VIGENTE' }),
        consulta({ usuario: 'otraDependencia', company: 'Recursos Humanos', enabled: true, estadoVencimientoUsuarioRed: 'VIGENTE' }),
        consulta({ usuario: 'deshabilitado', company: 'Tecnologias de la Informacion', enabled: false, estadoVencimientoUsuarioRed: 'VIGENTE' }),
      ], CATALOGO_UBICACION);

      component.filters = {
        sedeId: SEDE_CENTRAL.id.toString(),
        dependenciaId: DEPENDENCIA_TI.id.toString(),
        subdependenciaId: '',
        estado: 'HABILITADO',
        vencimiento: 'VIGENTE',
      };

      expect(component.directorioFiltrado.map((i) => i.usuario)).toEqual(['match']);
    });

    it('clearFilters resetea los filtros y hasActiveFilters refleja el estado', () => {
      const component = initComponent([consulta()]);
      expect(component.hasActiveFilters).toBe(false);

      component.filters.dependenciaId = DEPENDENCIA_TI.id.toString();
      expect(component.hasActiveFilters).toBe(true);

      component.clearFilters();
      expect(component.hasActiveFilters).toBe(false);
      expect(component.filters).toEqual({
        sedeId: '',
        dependenciaId: '',
        subdependenciaId: '',
        estado: '',
        vencimiento: '',
      });
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
