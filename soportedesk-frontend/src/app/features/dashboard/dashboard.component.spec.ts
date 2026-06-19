import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
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
    wifi: 4,
    impresoras: 7,
    equipos: 15,
    usuariosRedInactivos: 2,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne('/api/dashboard/counts').flush(counts);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('renders a card for usuarios desactivados that links to the filtered list', () => {
    const links = fixture.debugElement.queryAll(By.directive(RouterLink));
    const card = links.find((l) => l.nativeElement.textContent.includes('Usuarios Desactivados'));
    expect(card).toBeTruthy();
    expect(card!.nativeElement.textContent).toContain('2');

    const routerLink = card!.injector.get(RouterLink);
    expect(routerLink.queryParams).toEqual({ search: 'Inactivo' });
  });

  it('computes totalRegistros from the 7 record categories, excluding usuariosRedInactivos', () => {
    expect(fixture.componentInstance.totalRegistros).toBe(5 + 12 + 20 + 3 + 4 + 7 + 15);
  });
});
