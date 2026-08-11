import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { UsuariosRedDashboardComponent } from './usuarios-red-dashboard.component';

describe('UsuariosRedDashboardComponent', () => {
  let fixture: ComponentFixture<UsuariosRedDashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UsuariosRedDashboardComponent],
      providers: [
        provideRouter([]),
        provideCharts(withDefaultRegisterables()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    fixture = TestBed.createComponent(UsuariosRedDashboardComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne('/api/active-directory/dashboard/completo').flush({
      usuariosHabilitados: 20,
      usuariosDeshabilitados: 2,
      usuariosBloqueados: 1,
      controladoresDominio: 3,
      distribucionPorOficina: [],
      distribucionPorOu: [],
      passwordsVencidas: [],
      totalPasswordsVencidas: 0,
      cuentasInactivas: [],
      totalCuentasInactivas: 0,
      cuentasBloqueadas: [],
      totalCuentasBloqueadas: 1,
      contratosPorVencer: [{
        samAccountName: 'dsme02',
        displayName: 'JOSE RICARDO ASCOY CANCINO',
        detalle: '1905-2026 · vence en 11 días · 20/08/2026',
      }],
      totalContratosPorVencer: 4,
    });
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('shows the contract-expiration KPI and alert list', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Contratos por vencer');
    expect(text).toContain('Próximos 30 días');
    expect(text).toContain('dsme02');
    expect(text).toContain('20/08/2026');
    expect(fixture.componentInstance.totalAlertas(fixture.componentInstance.dashboard!)).toBe(5);
  });
});
