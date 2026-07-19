import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { DashboardComponent } from './dashboard.component';
import { DashboardCounts } from './dashboard-counts.model';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  const counts: DashboardCounts = {
    licencias: 5,
    correos: 12,
    usuariosRed: 20,
    vpn: 3,
    vpnPendientes: 1,
    wifi: 4,
    impresoras: 7,
    equipos: 15,
    usuariosRedInactivos: 2,
    proximoVencimientoUsuarioRed: '2026-07-31',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule],
      providers: [provideRouter([]), provideCharts(withDefaultRegisterables())],
    });
    localStorage.setItem('rol', 'ADMIN');
    fixture = TestBed.createComponent(DashboardComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne('/api/dashboard/counts').flush(counts);
    httpMock.expectOne('/api/dashboard/ordenes-servicio').flush([
      {
        id: 1,
        numeroOrden: 'OS-2026-001',
        descripcion: 'Soporte de infraestructura',
        proveedor: 'Proveedor INIA',
        fechaInicio: '2026-07-01',
        plazoDias: 30,
        fechaVencimiento: '2026-07-31',
        diasRestantes: 13,
        finalizada: false,
        registradoPor: 'admin',
        fechaRegistro: '2026-07-18T10:00:00',
      },
    ]);
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.endsWith('/usuarios-red-por-ubicacion')).flush([]);
    httpMock.expectOne((r) => r.url.endsWith('/licencias-por-tipo')).flush([]);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('renders a card for usuarios desactivados only for usuarios-red write access', () => {
    const links = fixture.debugElement.queryAll(By.directive(RouterLink));
    const card = links.find((l) => l.nativeElement.textContent.includes('Usuarios Desactivados'));
    expect(card).toBeTruthy();
    expect(card!.nativeElement.textContent).toContain('2');

    const routerLink = card!.injector.get(RouterLink);
    expect(routerLink.href).toBe('/usuarios-red/dashboard');
  });

  it('shows the next network-user expiration in priority attention', () => {
    const priorityRows = fixture.debugElement.queryAll(By.css('.priority-row'));
    const expiration = priorityRows.find((row) => row.nativeElement.textContent.includes('Vencimiento de usuarios de red'));

    expect(expiration).toBeTruthy();
    expect(expiration!.nativeElement.textContent).toContain('31/07');
    expect(expiration!.injector.get(RouterLink).href).toBe('/usuarios-red/consultas');
  });

  it('computes totalRegistros from the 7 record categories, excluding usuariosRedInactivos', () => {
    expect(fixture.componentInstance.totalRegistros).toBe(5 + 12 + 20 + 3 + 4 + 7 + 15);
  });

  it('shows active service orders with their remaining days', () => {
    const card = fixture.debugElement.query(By.css('.service-orders-card'));
    expect(card.nativeElement.textContent).toContain('OS-2026-001');
    expect(card.nativeElement.textContent).toContain('Faltan 13 días');
    expect(card.query(By.css('.service-order-tile'))).toBeTruthy();
    expect(card.query(By.css('.flip-clock__value')).nativeElement.textContent.trim()).toBe('13');
  });

  it('places the service-order countdown below the dashboard analysis', () => {
    const charts = fixture.nativeElement.querySelector('.charts-grid') as HTMLElement;
    const serviceOrders = fixture.nativeElement.querySelector('.service-orders-card') as HTMLElement;

    expect(charts.compareDocumentPosition(serviceOrders) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
