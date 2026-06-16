import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CatalogosComponent } from './catalogos.component';

describe('CatalogosComponent', () => {
  let component: CatalogosComponent;
  let fixture: ComponentFixture<CatalogosComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogosComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);

    // Flush all 4 initial HTTP requests from loadAll()
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/dependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/subdependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);
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

    // After create, loadAll() fires 4 more requests
    httpMock.expectOne((req) => req.url.includes('/catalogos/sedes')).flush([{ id: 1, nombre: 'Nueva Sede' }]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/dependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/subdependencias')).flush([]);
    httpMock.expectOne((req) => req.url.includes('/catalogos/tipos-contrato')).flush([]);

    expect(component.sedes.length).toBe(1);
  });
});
