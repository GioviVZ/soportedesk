import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AuthService } from '@soportedesk/core';
import { GenericTableComponent } from '@soportedesk/ui';
import { of } from 'rxjs';
import { AsignacionNumeroMovil } from './asignacion-numero-movil.model';
import { AsignacionNumeroMovilService } from './asignacion-numero-movil.service';
import { EquipoMovil } from './equipo-movil.model';
import { EquipoMovilService } from './equipo-movil.service';
import { EquiposMovilesInventarioPageComponent } from './equipos-moviles-inventario-page.component';

function equipoMock(id: number, overrides: Partial<EquipoMovil> = {}): EquipoMovil {
  const sede = { id: 1, nombre: 'Sede Central' };
  return {
    id,
    tipo: 'SMARTPHONE',
    sede,
    dependencia: { id: 2, nombre: 'Tecnología', sede, orgUnitPath: null },
    subdependencia: null,
    referencia: 'Oficina 201',
    latitud: null,
    longitud: null,
    edificio: null,
    piso: null,
    marca: 'Samsung',
    modelo: 'Galaxy A55',
    serie: `SER-${id}`,
    imei1: '490154203237518',
    imei2: null,
    mac: null,
    sistemaOperativo: 'Android',
    almacenamiento: '128 GB',
    codigoPatrimonial: null,
    codigoInventario: `INV-${id}`,
    estado: 'Operativo',
    observaciones: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('EquiposMovilesInventarioPageComponent', () => {
  let fixture: ComponentFixture<EquiposMovilesInventarioPageComponent>;
  let component: EquiposMovilesInventarioPageComponent;
  let equipoService: jasmine.SpyObj<EquipoMovilService>;
  let asignacionService: jasmine.SpyObj<AsignacionNumeroMovilService>;
  let auth: jasmine.SpyObj<AuthService>;
  const equipo = equipoMock(1);
  const assignment: AsignacionNumeroMovil = {
    id: 8,
    equipoMovil: equipo,
    numero: '987654321',
    operador: 'Claro',
    plan: 'Plan institucional',
    simIccid: null,
    personaNombre: 'María Pérez',
    personaDni: '12345678',
    dependencia: equipo.dependencia,
    fechaInicio: '2026-09-01',
    fechaFin: null,
    estado: 'Activa',
    observaciones: null,
  };

  beforeEach(async () => {
    equipoService = jasmine.createSpyObj<EquipoMovilService>('EquipoMovilService', ['getAll', 'getResumen', 'delete']);
    equipoService.getAll.and.returnValue(of([equipo]));
    equipoService.getResumen.and.returnValue(of({ total: 1, operativos: 1, enRevision: 0, sinAsignar: 0 }));
    asignacionService = jasmine.createSpyObj<AsignacionNumeroMovilService>('AsignacionNumeroMovilService', ['getAll']);
    asignacionService.getAll.and.returnValue(of([assignment]));
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['canWrite']);
    auth.canWrite.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [EquiposMovilesInventarioPageComponent],
      providers: [
        { provide: EquipoMovilService, useValue: equipoService },
        { provide: AsignacionNumeroMovilService, useValue: asignacionService },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquiposMovilesInventarioPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('solicita resumen, inventario y asignaciones activas', () => {
    expect(equipoService.getAll).toHaveBeenCalledOnceWith();
    expect(equipoService.getResumen).toHaveBeenCalledOnceWith();
    expect(asignacionService.getAll).toHaveBeenCalledOnceWith({ estado: 'Activa' });
  });

  it('muestra la asignación actual en la fila', () => {
    expect(component.tableRows[0].asignacionDisplay).toBe('987654321 · María Pérez');
  });

  it('encuentra un equipo por la persona asignada sin distinguir acentos', () => {
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
    expect(auth.canWrite).toHaveBeenCalledWith('equipos-moviles');
  });
});
