import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CatalogosComponent } from './catalogos.component';

describe('CatalogosComponent', () => {
  let component: CatalogosComponent;
  let fixture: ComponentFixture<CatalogosComponent>;
  let httpMock: HttpTestingController;

  function flushLoadAll(sedesData: unknown[] = [], tiposImpresoraData: unknown[] = []): void {
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush(sedesData);
    httpMock.expectOne((req) => req.url.includes('/catalogos/dependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/subdependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-licencia')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-bien')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-impresora')).flush(tiposImpresoraData);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogosComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);

    flushLoadAll();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should default to sedes tab', () => {
    expect(component.activeTab).toBe('sedes');
  });

  it('should switch to dependencias tab', () => {
    component.setTab('dependencias');
    expect(component.activeTab).toBe('dependencias');
  });

  it('should create a sede and reload', () => {
    component.activeTab = 'sedes';
    component.nombreForm = 'Nueva Sede';
    component.submitSimple();

    const postReq = httpMock.expectOne((req) =>
      req.method === 'POST' && req.url.includes('/catalogos/sedes'),
    );
    postReq.flush({ id: 1, nombre: 'Nueva Sede' });

    // After create, loadAll() fires 6 more requests
    flushLoadAll([{ id: 1, nombre: 'Nueva Sede' }]);

    expect(component.sedes.length).toBe(1);
  });

  it('should create a tipo de impresora and reload', () => {
    component.activeTab = 'tiposImpresora';
    component.nombreForm = 'Láser';
    component.submitSimple();

    const postReq = httpMock.expectOne((req) =>
      req.method === 'POST' && req.url.includes('/catalogos/tipos-impresora'),
    );
    postReq.flush({ id: 1, nombre: 'Láser' });

    // After create, loadAll() fires 7 requests including tipos-impresora
    flushLoadAll([], [{ id: 1, nombre: 'Láser' }]);

    expect(component.tiposImpresora.length).toBe(1);
  });
});
