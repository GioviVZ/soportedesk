import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@soportedesk/core';
import { GenericTableComponent } from '@soportedesk/ui';
import { of } from 'rxjs';
import { EquipoRed, EquipoRedResumen } from './equipo-red.model';
import { EquipoRedService } from './equipo-red.service';
import { EquiposRedPageComponent } from './equipos-red-page.component';

const resumen: EquipoRedResumen = {
  total: 2,
  operativos: 1,
  enRevision: 1,
  inactivos: 0,
  deBaja: 0,
  sedes: 1,
};

function equipoMock(id: number, overrides: Partial<EquipoRed> = {}): EquipoRed {
  const sede = { id: 1, nombre: 'Sede Central' };
  return {
    id,
    tipo: 'ROUTER',
    sede,
    dependencia: { id: 2, nombre: 'Tecnología', sede, orgUnitPath: null },
    subdependencia: null,
    referencia: null,
    latitud: null,
    longitud: null,
    edificio: null,
    piso: null,
    gabinete: null,
    marca: 'Cisco',
    modelo: 'ISR 1100',
    serie: `SER-${id}`,
    codigoPatrimonial: null,
    codigoInventario: null,
    etiqueta: `RT-CENTRAL-${id}`,
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: `10.0.0.${id}`,
    ipPorDefecto: null,
    host: `router-${id}`,
    estado: 'Operativo',
    observaciones: null,
    remotoSede: null,
    remotoReferencia: null,
    frecuenciaGhz: null,
    anchoCanalMhz: null,
    ssidEnlace: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('EquiposRedPageComponent', () => {
  let fixture: ComponentFixture<EquiposRedPageComponent>;
  let component: EquiposRedPageComponent;
  let service: jasmine.SpyObj<EquipoRedService>;
  let auth: jasmine.SpyObj<AuthService>;
  const items = [
    equipoMock(5, { ip: '172.16.20.5', etiqueta: 'RT-NORTE-01' }),
    equipoMock(6, { ip: '10.10.0.6', etiqueta: 'rt-sur-02', marca: 'MikroTik' }),
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj<EquipoRedService>('EquipoRedService', ['getAll', 'getResumen', 'delete']);
    service.getAll.and.returnValue(of(items));
    service.getResumen.and.returnValue(of(resumen));
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['canWrite']);
    auth.canWrite.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [EquiposRedPageComponent],
      providers: [
        { provide: EquipoRedService, useValue: service },
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { tipo: 'ROUTER' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquiposRedPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('solicita el listado y el resumen con el tipo de la ruta', () => {
    expect(service.getAll).toHaveBeenCalledOnceWith('ROUTER');
    expect(service.getResumen).toHaveBeenCalledOnceWith('ROUTER');
  });

  it('oculta las acciones de alta y edición sin permiso de escritura', () => {
    const table = fixture.debugElement.query(By.directive(GenericTableComponent))
      .componentInstance as GenericTableComponent;

    expect(table.canAdd).toBeFalse();
    expect(table.canEdit).toBeFalse();
    expect(fixture.nativeElement.querySelector('.add-btn')).toBeNull();
    expect(fixture.nativeElement.querySelector('.edit-btn')).toBeNull();
    expect(auth.canWrite).toHaveBeenCalledWith('equipos-red');
  });

  it('filtra localmente por IP y sin distinguir mayúsculas', () => {
    component.searchTerm = '172.16.20.5';
    expect(component.filteredItems.map((item) => item.id)).toEqual([5]);

    component.searchTerm = 'RT-SUR-02';
    expect(component.filteredItems.map((item) => item.id)).toEqual([6]);
  });
});
