import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsuariosRedPorUbicacionChartComponent } from './usuarios-red-por-ubicacion-chart.component';

describe('UsuariosRedPorUbicacionChartComponent', () => {
  let httpMock: HttpTestingController;
  let component: UsuariosRedPorUbicacionChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
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

    expect(component.chartData.labels).toEqual(['Lima']);
  });

  it('requests dependencia-level data when the toggle changes', () => {
    component.ngOnInit();
    httpMock.expectOne((r) => r.params.get('nivel') === 'sede').flush([]);

    component.setNivel('dependencia');

    const req = httpMock.expectOne((r) => r.params.get('nivel') === 'dependencia');
    req.flush([{ nombre: 'TI', activos: 8, inactivos: 0 }]);

    expect(component.chartData.labels).toEqual(['TI']);
  });

  it('flags an error when the request fails, without throwing', () => {
    component.ngOnInit();

    httpMock
      .expectOne((r) => r.params.get('nivel') === 'sede')
      .flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.error).toBe(true);
  });
});
