import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AuthService } from '@soportedesk/core';
import { GenericTableComponent } from '@soportedesk/ui';
import { of } from 'rxjs';
import { AsignacionAnexo } from './asignacion-anexo.model';
import { AsignacionAnexoService } from './asignacion-anexo.service';
import { TelefonoFijo } from './telefono-fijo.model';
import { TelefonoFijoService } from './telefono-fijo.service';
import { TelefoniaFijaInventarioPageComponent } from './telefonia-fija-inventario-page.component';

function telefonoMock(id: number, overrides: Partial<TelefonoFijo> = {}): TelefonoFijo {
  const sede = { id: 1, nombre: 'Sede Central' };
  return {
    id,
    tipo: 'IP',
    sede,
    dependencia: { id: 2, nombre: 'Tecnología', sede, orgUnitPath: null },
    subdependencia: null,
    referencia: 'Oficina 201',
    latitud: null,
    longitud: null,
    edificio: null,
    piso: null,
    marca: 'Yealink',
    modelo: 'T31P',
    serie: `SER-${id}`,
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '192.168.1.25',
    host: 'TEL-CENTRAL-25',
    codigoPatrimonial: null,
    codigoInventario: `INV-${id}`,
    estado: 'Operativo',
    observaciones: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('TelefoniaFijaInventarioPageComponent', () => {
  let fixture: ComponentFixture<TelefoniaFijaInventarioPageComponent>;
  let component: TelefoniaFijaInventarioPageComponent;
  let telefonoService: jasmine.SpyObj<TelefonoFijoService>;
  let asignacionService: jasmine.SpyObj<AsignacionAnexoService>;
  let auth: jasmine.SpyObj<AuthService>;
  const telefono = telefonoMock(1);
  const assignment: AsignacionAnexo = {
    id: 8,
    telefonoFijo: telefono,
    anexo: '4321',
    numeroDirecto: '014567890',
    personaNombre: 'María Pérez',
    personaDni: '12345678',
    dependencia: telefono.dependencia,
    fechaInicio: '2026-09-01',
    fechaFin: null,
    estado: 'Activa',
    observaciones: null,
  };

  beforeEach(async () => {
    telefonoService = jasmine.createSpyObj<TelefonoFijoService>('TelefonoFijoService', ['getAll', 'getResumen', 'delete']);
    telefonoService.getAll.and.returnValue(of([telefono]));
    telefonoService.getResumen.and.returnValue(of({ total: 1, operativos: 1, enRevision: 0, sinAsignar: 0 }));
    asignacionService = jasmine.createSpyObj<AsignacionAnexoService>('AsignacionAnexoService', ['getAll']);
    asignacionService.getAll.and.returnValue(of([assignment]));
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['canWrite']);
    auth.canWrite.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [TelefoniaFijaInventarioPageComponent],
      providers: [
        { provide: TelefonoFijoService, useValue: telefonoService },
        { provide: AsignacionAnexoService, useValue: asignacionService },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TelefoniaFijaInventarioPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('solicita resumen, inventario y asignaciones activas', () => {
    expect(telefonoService.getAll).toHaveBeenCalledOnceWith();
    expect(telefonoService.getResumen).toHaveBeenCalledOnceWith();
    expect(asignacionService.getAll).toHaveBeenCalledOnceWith({ estado: 'Activa' });
  });

  it('muestra el anexo activo, el número directo y la persona en la fila', () => {
    expect(component.tableRows[0].asignacionDisplay).toBe('4321 · 014567890 · María Pérez');
  });

  it('encuentra un teléfono por anexo o persona sin distinguir acentos', () => {
    component.searchTerm = '4321';
    expect(component.filteredItems.map((item) => item.id)).toEqual([1]);

    component.searchTerm = 'maria perez';
    expect(component.filteredItems.map((item) => item.id)).toEqual([1]);
  });

  it('oculta alta y edición cuando no tiene permiso de escritura', () => {
    const table = fixture.debugElement.query(By.directive(GenericTableComponent))
      .componentInstance as GenericTableComponent;
    expect(table.canAdd).toBeFalse();
    expect(table.canEdit).toBeFalse();
    expect(fixture.nativeElement.querySelector('.add-btn')).toBeNull();
    expect(fixture.nativeElement.querySelector('.edit-btn')).toBeNull();
    expect(auth.canWrite).toHaveBeenCalledWith('telefonia-fija');
  });
});
