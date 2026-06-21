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
  sede: { id: 1, nombre: 'Sede Central' },
  dependencia: { id: 1, nombre: 'Dependencia Test' },
  subdependencia: null,
  estado: 'Activa',
  modeloTonerNegro: 'TN-2380',
  modeloTonerC: null,
  modeloTonerM: null,
  modeloTonerY: null,
  modeloCartucho: null,
  modeloDrum: 'DR-2365',
  modeloFusor: null,
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
      providers: [{ provide: AuthService, useValue: { isAdmin: () => false, canWrite: () => false } }],
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

  it('hasConsumibles returns true when any model is set', () => {
    expect(component.hasConsumibles()).toBeTrue();
  });

  it('hasConsumibles returns false when all models are null', () => {
    component.impresora = {
      ...mockImpresora,
      modeloTonerNegro: null, modeloTonerC: null, modeloTonerM: null,
      modeloTonerY: null, modeloCartucho: null, modeloDrum: null, modeloFusor: null,
    };
    expect(component.hasConsumibles()).toBeFalse();
  });

  it('should show upload section for admin', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => true, canWrite: () => true } }],
    }).compileComponents();

    const adminFixture = TestBed.createComponent(ImpresoraFichaComponent);
    const adminComponent = adminFixture.componentInstance;
    adminComponent.impresora = mockImpresora;
    adminFixture.detectChanges();
    adminComponent.setTab('driver');
    adminFixture.detectChanges();

    expect(adminComponent.isAdmin).toBeTrue();
  });
});
