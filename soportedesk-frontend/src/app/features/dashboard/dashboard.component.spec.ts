import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { DashboardComponent } from './dashboard.component';
import { DashboardCounts } from './dashboard-counts.model';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { OrdenServicio } from '../../core/models/orden-servicio.model';

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
    usuariosRedPorVencer: 4,
    proximoVencimientoUsuarioRed: '2026-08-20',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [DashboardComponent],
    providers: [provideRouter([]), provideCharts(withDefaultRegisterables()), provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()]
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
        diasTranscurridos: 17,
        hitos: [],
        finalizada: false,
        registradoPor: 'admin',
        fechaRegistro: '2026-07-18T10:00:00',
      },
    ]);
    httpMock.expectOne((r) => r.url.endsWith('/equipos-por-tipo')).flush([
      { label: 'Laptop', count: 8 },
      { label: 'Computadora de Escritorio', count: 5 },
      { label: 'All in One', count: 2 },
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

  it('shows the number of network-user contracts expiring in priority attention', () => {
    const priorityRows = fixture.debugElement.queryAll(By.css('.priority-row'));
    const expiration = priorityRows.find((row) => row.nativeElement.textContent.includes('Contratos de usuarios por vencer'));

    expect(expiration).toBeTruthy();
    expect(expiration!.nativeElement.textContent).toContain('4');
    expect(expiration!.nativeElement.textContent).toContain('20/08/2026');
    expect(expiration!.injector.get(RouterLink).href).toBe('/usuarios-red/consultas');
  });

  it('computes totalRegistros from the 7 record categories, excluding usuariosRedInactivos', () => {
    expect(fixture.componentInstance.totalRegistros).toBe(5 + 12 + 20 + 3 + 4 + 7 + 15);
  });

  it('places the main-module shortcuts before operational data', () => {
    const modules = fixture.nativeElement.querySelector('.cards-grid') as HTMLElement;
    const priorities = fixture.nativeElement.querySelector('.ops-grid') as HTMLElement;

    expect(fixture.nativeElement.querySelector('.summary-grid')).toBeNull();
    expect(modules.compareDocumentPosition(priorities) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows active service orders with their remaining days', () => {
    const card = fixture.debugElement.query(By.css('.service-orders-card'));
    expect(card.nativeElement.textContent).toContain('OS-2026-001');
    expect(card.nativeElement.textContent).toContain('Faltan 13 días');
    expect(card.query(By.css('.service-order-tile'))).toBeTruthy();
    expect(card.query(By.css('.flip-clock__value')).nativeElement.textContent.trim()).toBe('13');
  });

  it('keeps an overdue phase alert while counting down to the next deliverable', () => {
    const orden: OrdenServicio = {
      id: 2385,
      numeroOrden: 'OS-2385-2026',
      descripcion: 'Servicio por entregables',
      proveedor: null,
      fechaInicio: '2026-07-17',
      plazoDias: 90,
      fechaVencimiento: '2026-10-15',
      diasRestantes: 55,
      diasTranscurridos: 35,
      finalizada: false,
      registradoPor: 'admin',
      fechaRegistro: '2026-07-17T08:00:00',
      hitos: [
        { id: 1, nombre: 'Primer entregable', diaPlazo: 30, fechaVencimiento: '2026-08-16', diasRestantes: -5, completado: false, fechaCompletado: null },
        { id: 2, nombre: 'Segundo entregable', diaPlazo: 60, fechaVencimiento: '2026-09-15', diasRestantes: 25, completado: false, fechaCompletado: null },
        { id: 3, nombre: 'Tercer entregable', diaPlazo: 90, fechaVencimiento: '2026-10-15', diasRestantes: 55, completado: false, fechaCompletado: null },
      ],
    };

    expect(fixture.componentInstance.ordenHitosVencidos(orden).length).toBe(1);
    expect(fixture.componentInstance.ordenObjetivoNombre(orden)).toBe('Segundo entregable');
    expect(fixture.componentInstance.ordenConteoValor(orden)).toBe(25);
    expect(fixture.componentInstance.ordenEstadoClass(orden)).toBe('bad');
  });

  it('places the service-order countdown below the dashboard analysis', () => {
    const charts = fixture.nativeElement.querySelector('.charts-grid') as HTMLElement;
    const serviceOrders = fixture.nativeElement.querySelector('.service-orders-card') as HTMLElement;

    expect(charts.compareDocumentPosition(serviceOrders) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps inventory selected by default and does not render a collapsing "Todos" option', () => {
    const pills = fixture.debugElement.queryAll(By.css('.modulo-pill'));
    const labels = pills.map((p) => p.nativeElement.textContent.trim());

    expect(labels).not.toContain('Todos');
    expect(labels).toContain('Licencias');
    expect(labels).toContain('VPN');
    expect(labels).toContain('Inventario de Equipos');
    expect(fixture.componentInstance.selectedModulo).toBe('equipos');
    expect(fixture.nativeElement.querySelector('.modulo-breakdown-panel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.modulo-breakdown-total').textContent).toContain('15');
  });

  it('selecting a module pill fetches its breakdown and renders the panel', () => {
    const vpnPill = fixture.debugElement.queryAll(By.css('.modulo-pill'))
      .find((p) => p.nativeElement.textContent.trim() === 'VPN')!;
    vpnPill.nativeElement.click();
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url.endsWith('/vpn-por-estado-solicitud')).flush([
      { label: 'PENDIENTE', count: 1 },
      { label: 'APROBADA', count: 2 },
    ]);
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.modulo-breakdown-row'));
    expect(rows.length).toBe(2);
    expect(rows[0].nativeElement.textContent).toContain('PENDIENTE');
    expect(rows[0].nativeElement.textContent).toContain('1');
  });

  it('selecting "usuarios-red" derives the breakdown from counts without an extra request', () => {
    const pill = fixture.debugElement.queryAll(By.css('.modulo-pill'))
      .find((p) => p.nativeElement.textContent.trim() === 'Usuarios de Red/AD')!;
    pill.nativeElement.click();
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.modulo-breakdown-row'));
    expect(rows.length).toBe(2);
    expect(rows[0].nativeElement.textContent).toContain('Activos');
    expect(rows[0].nativeElement.textContent).toContain('18');
    expect(rows[1].nativeElement.textContent).toContain('Inactivos');
    expect(rows[1].nativeElement.textContent).toContain('2');
  });

  it('switching modules keeps the breakdown panel mounted', () => {
    const vpnPill = fixture.debugElement.queryAll(By.css('.modulo-pill'))
      .find((p) => p.nativeElement.textContent.trim() === 'VPN')!;
    vpnPill.nativeElement.click();
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.endsWith('/vpn-por-estado-solicitud')).flush([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedModulo).toBe('vpn');
    expect(fixture.nativeElement.querySelector('.modulo-breakdown-panel')).not.toBeNull();
  });
});
