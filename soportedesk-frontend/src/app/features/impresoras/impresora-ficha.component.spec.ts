import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { AuthService } from '../../core/auth/auth.service';
import { Impresora } from './impresora.model';

const mockImpresora: Impresora = {
  id: 1,
  nombre: 'Impresora Test',
  marca: 'HP',
  modelo: 'LaserJet',
  ip: '192.168.1.100',
  piso: '1',
  area: 'Oficina',
  estado: 'Activa',
  tonerNegro: 80,
  tonerC: 70,
  tonerM: 60,
  tonerY: 50,
  cartucho: 90,
  drum: 85,
  fusor: 75,
  driverNombre: null,
  driverVersion: null,
  driverSo: null,
  driverArchivoPath: null,
};

describe('ImpresoraFichaComponent', () => {
  let component: ImpresoraFichaComponent;
  let fixture: ComponentFixture<ImpresoraFichaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: { isAdmin: () => false } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresoraFichaComponent);
    component = fixture.componentInstance;
    component.impresora = mockImpresora;
    fixture.detectChanges();
  });

  it('should default to instalacion tab', () => {
    expect(component.activeTab).toBe('instalacion');
  });

  it('should switch to consumibles tab', () => {
    component.setTab('consumibles');
    expect(component.activeTab).toBe('consumibles');
  });

  it('should switch to driver tab and show upload section for admin', () => {
    const adminAuthService = { isAdmin: () => true };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: adminAuthService },
      ],
    }).compileComponents();

    const adminFixture = TestBed.createComponent(ImpresoraFichaComponent);
    const adminComponent = adminFixture.componentInstance;
    adminComponent.impresora = mockImpresora;
    adminFixture.detectChanges();

    adminComponent.setTab('driver');
    adminFixture.detectChanges();

    expect(adminComponent.activeTab).toBe('driver');
    expect(adminComponent.isAdmin).toBe(true);
  });
});
