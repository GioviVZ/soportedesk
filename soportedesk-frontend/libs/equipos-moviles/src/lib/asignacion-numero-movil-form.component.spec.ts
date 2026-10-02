import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogoService } from '@soportedesk/core';
import { of } from 'rxjs';
import { AsignacionNumeroMovilFormComponent } from './asignacion-numero-movil-form.component';
import { AsignacionNumeroMovil } from './asignacion-numero-movil.model';
import { AsignacionNumeroMovilService } from './asignacion-numero-movil.service';
import { EquipoMovil } from './equipo-movil.model';

function equipoMock(): EquipoMovil {
  return {
    id: 4,
    tipo: 'SMARTPHONE',
    sede: null,
    dependencia: null,
    subdependencia: null,
    referencia: null,
    latitud: null,
    longitud: null,
    edificio: null,
    piso: null,
    marca: 'Apple',
    modelo: 'iPhone 15',
    serie: 'SER-4',
    imei1: '490154203237518',
    imei2: null,
    mac: null,
    sistemaOperativo: 'iOS',
    almacenamiento: '128 GB',
    codigoPatrimonial: null,
    codigoInventario: 'INV-4',
    estado: 'Operativo',
    observaciones: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('AsignacionNumeroMovilFormComponent', () => {
  let fixture: ComponentFixture<AsignacionNumeroMovilFormComponent>;
  let component: AsignacionNumeroMovilFormComponent;
  let service: jasmine.SpyObj<AsignacionNumeroMovilService>;
  const equipo = equipoMock();

  beforeEach(async () => {
    service = jasmine.createSpyObj<AsignacionNumeroMovilService>('AsignacionNumeroMovilService', ['create', 'update']);
    const catalogo = jasmine.createSpyObj<CatalogoService>('CatalogoService', ['getDependencias']);
    catalogo.getDependencias.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AsignacionNumeroMovilFormComponent],
      providers: [
        { provide: AsignacionNumeroMovilService, useValue: service },
        { provide: CatalogoService, useValue: catalogo },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionNumeroMovilFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('equipos', [equipo]);
    fixture.detectChanges();
  });

  it('requiere fecha de fin cuando el estado es Finalizada', () => {
    component.form.patchValue({ estado: 'Finalizada', fechaInicio: '2026-09-10', fechaFin: '' });
    expect(component.form.hasError('fechaFinRequerida')).toBeTrue();
    expect(component.form.invalid).toBeTrue();
  });

  it('rechaza una fecha de fin anterior al inicio', () => {
    component.form.patchValue({ estado: 'Finalizada', fechaInicio: '2026-09-10', fechaFin: '2026-09-09' });
    expect(component.form.hasError('fechaFinAnterior')).toBeTrue();
  });

  it('valida un número móvil de 9 dígitos que empieza por 9', () => {
    const numero = component.form.controls.numero;
    numero.setValue('887654321');
    expect(numero.invalid).toBeTrue();
    numero.setValue('987654321');
    expect(numero.valid).toBeTrue();
  });

  it('envía equipoMovilId al crear', () => {
    const created: AsignacionNumeroMovil = {
      id: 1,
      equipoMovil: equipo,
      numero: '987654321',
      operador: 'Claro',
      plan: null,
      simIccid: null,
      personaNombre: 'Ana Torres',
      personaDni: null,
      dependencia: null,
      fechaInicio: '2026-09-10',
      fechaFin: null,
      estado: 'Activa',
      observaciones: null,
    };
    service.create.and.returnValue(of(created));
    component.form.patchValue({
      equipoMovilId: 4,
      numero: '987654321',
      personaNombre: 'Ana Torres',
      fechaInicio: '2026-09-10',
    });

    component.submit();

    expect(service.create).toHaveBeenCalledWith(jasmine.objectContaining({ equipoMovilId: 4 }));
  });
});
