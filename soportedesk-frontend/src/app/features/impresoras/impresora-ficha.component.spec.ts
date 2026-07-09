import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ImpresoraFichaComponent } from './impresora-ficha.component';
import { AuthService } from '../../core/auth/auth.service';
import { Impresora } from './impresora.model';

const mockImpresora: Impresora = {
  id: 1,
  modeloImpresora: {
    id: 1,
    nombre: 'LaserJet',
    marca: { id: 1, nombre: 'HP' },
    toners: [{ id: 1, color: 'Negro', variante: 'Estándar', codigo: 'TN-2380' }],
    driverNombre: null,
    driverVersion: null,
    driverSo: null,
    driverArchivoPath: null,
  },
  tipoImpresora: { id: 1, nombre: 'Láser' },
  serie: 'SN-001',
  codigoInventario: 'INV-001',
  codigoPatrimonial: 'PAT-001',
  tipoConexion: 'IP',
  ip: '192.168.1.100',
  sede: { id: 1, nombre: 'Sede Central' },
  dependencia: { id: 1, nombre: 'Dependencia Test' },
  subdependencia: null,
  estado: 'Activa',
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

  it('tonersPorColor groups toners by color', () => {
    expect(component.tonersPorColor).toEqual([
      { color: 'Negro', variantes: [{ id: 1, color: 'Negro', variante: 'Estándar', codigo: 'TN-2380' }] },
    ]);
  });

  it('tonersPorColor returns empty array when modelo has no toners', () => {
    component.impresora = {
      ...mockImpresora,
      modeloImpresora: { ...mockImpresora.modeloImpresora, toners: [] },
    };
    expect(component.tonersPorColor).toEqual([]);
  });

  it('shows the IP row when tipoConexion is IP', () => {
    component.impresora = { ...mockImpresora, tipoConexion: 'IP', ip: '10.0.0.5' };
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('10.0.0.5');
  });

  it('hides the IP row when tipoConexion is USB', () => {
    component.impresora = { ...mockImpresora, tipoConexion: 'USB', ip: '' };
    fixture.detectChanges();

    const conexionField = Array.from(fixture.nativeElement.querySelectorAll('.detail-field')).find((el) =>
      (el as HTMLElement).querySelector('.detail-label')?.textContent?.trim() === 'Conexión'
    ) as HTMLElement | undefined;
    expect(conexionField?.querySelector('.detail-value')?.textContent).not.toContain('—');
  });

  it('shows "no hay driver" message when modelo has no driver', () => {
    component.setTab('driver');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('no tiene driver cargado');
  });

  it('shows download button and driver info when modelo has a driver', () => {
    component.impresora = {
      ...mockImpresora,
      modeloImpresora: { ...mockImpresora.modeloImpresora, driverNombre: 'driver-hp.zip', driverVersion: '1.2', driverSo: 'Windows 10' },
    };
    component.setTab('driver');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('driver-hp.zip');
    expect(fixture.nativeElement.querySelector('.download-btn')).toBeTruthy();
  });

  it('shows the edit button by default when the user can write', async () => {
    await TestBed.resetTestingModule().configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => false, canWrite: () => true } }],
    }).compileComponents();
    const writableFixture = TestBed.createComponent(ImpresoraFichaComponent);
    writableFixture.componentInstance.impresora = mockImpresora;
    writableFixture.detectChanges();

    expect(writableFixture.nativeElement.querySelector('.edit-btn')).toBeTruthy();
  });

  it('hides the edit button when allowActions is false, even if the user can write', async () => {
    await TestBed.resetTestingModule().configureTestingModule({
      imports: [ImpresoraFichaComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isAdmin: () => false, canWrite: () => true } }],
    }).compileComponents();
    const readOnlyFixture = TestBed.createComponent(ImpresoraFichaComponent);
    readOnlyFixture.componentInstance.impresora = mockImpresora;
    readOnlyFixture.componentInstance.allowActions = false;
    readOnlyFixture.detectChanges();

    expect(readOnlyFixture.nativeElement.querySelector('.edit-btn')).toBeFalsy();
  });
});
