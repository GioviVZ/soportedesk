import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuariosRedPorUbicacionChartComponent } from './usuarios-red-por-ubicacion-chart.component';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('UsuariosRedPorUbicacionChartComponent', () => {
  let httpMock: HttpTestingController;
  let component: UsuariosRedPorUbicacionChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(() => new UsuariosRedPorUbicacionChartComponent());
  });

  afterEach(() => httpMock.verify());

  it('requests sede-level data on init', () => {
    component.ngOnInit();

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/usuarios-red-por-ubicacion') && r.params.get('nivel') === 'sede',
    );
    req.flush([{ nombre: 'Lima', activos: 10, inactivos: 2 }]);

    expect(component.rows.map((r) => r.nombre)).toEqual(['Lima']);
    expect(component.topRows.map((r) => r.nombre)).toEqual(['Lima']);
  });

  it('requests dependencia-level data when the toggle changes', () => {
    component.ngOnInit();
    httpMock.expectOne((r) => r.params.get('nivel') === 'sede').flush([]);

    component.setNivel('dependencia');

    const req = httpMock.expectOne((r) => r.params.get('nivel') === 'dependencia');
    req.flush([{ nombre: 'TI', activos: 8, inactivos: 0 }]);

    expect(component.rows.map((r) => r.nombre)).toEqual(['TI']);
  });

  it('ranks offices by inactivos and finds a selected office by name', () => {
    component.ngOnInit();
    httpMock.expectOne((r) => r.params.get('nivel') === 'sede').flush([
      { nombre: 'Lima', activos: 10, inactivos: 1 },
      { nombre: 'Cusco', activos: 5, inactivos: 6 },
    ]);

    expect(component.topRows.map((r) => r.nombre)).toEqual(['Cusco', 'Lima']);

    component.selectOffice('Lima');
    expect(component.selectedRow?.nombre).toBe('Lima');

    component.clearSelection();
    expect(component.selectedRow).toBeNull();
  });

  it('flags an error when the request fails, without throwing', () => {
    component.ngOnInit();

    httpMock
      .expectOne((r) => r.params.get('nivel') === 'sede')
      .flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.error).toBe(true);
  });
});
