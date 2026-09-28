import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LicenciasPorTipoChartComponent } from './licencias-por-tipo-chart.component';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('LicenciasPorTipoChartComponent', () => {
  let httpMock: HttpTestingController;
  let component: LicenciasPorTipoChartComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    component = TestBed.runInInjectionContext(() => new LicenciasPorTipoChartComponent());
  });

  afterEach(() => httpMock.verify());

  it('requests licencias-por-tipo data on init and populates the chart', () => {
    component.ngOnInit();

    const req = httpMock.expectOne((r) => r.url.endsWith('/licencias-por-tipo'));
    req.flush([
      { nombre: 'Office', totalClaves: 450 },
      { nombre: 'Antivirus', totalClaves: 200 },
    ]);

    expect(component.chartData.labels).toEqual(['Office', 'Antivirus']);
    expect(component.chartData.datasets[0].data).toEqual([450, 200]);
  });

  it('flags an error when the request fails, without throwing', () => {
    component.ngOnInit();

    httpMock
      .expectOne((r) => r.url.endsWith('/licencias-por-tipo'))
      .flush('error', { status: 500, statusText: 'Server Error' });

    expect(component.error).toBe(true);
  });
});
