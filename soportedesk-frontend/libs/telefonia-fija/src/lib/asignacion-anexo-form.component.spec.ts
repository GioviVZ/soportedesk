import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogoService } from '@soportedesk/core';
import { of } from 'rxjs';
import { AsignacionAnexoFormComponent } from './asignacion-anexo-form.component';
import { AsignacionAnexo } from './asignacion-anexo.model';
import { AsignacionAnexoService } from './asignacion-anexo.service';
import { TelefonoFijo } from './telefono-fijo.model';

function telefonoMock(): TelefonoFijo {
  return {
    id: 4,
    tipo: 'IP',
    sede: null,
    dependencia: null,
    subdependencia: null,
    referencia: null,
    latitud: null,
    longitud: null,
    edificio: null,
    piso: null,
    marca: 'Cisco',
    modelo: 'CP-7841',
    serie: 'SER-4',
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '192.168.1.44',
    host: 'TEL-44',
    codigoPatrimonial: null,
    codigoInventario: 'INV-4',
    estado: 'Operativo',
    observaciones: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('AsignacionAnexoFormComponent', () => {
  let fixture: ComponentFixture<AsignacionAnexoFormComponent>;
  let component: AsignacionAnexoFormComponent;
  let service: jasmine.SpyObj<AsignacionAnexoService>;
  const telefono = telefonoMock();

  beforeEach(async () => {
    service = jasmine.createSpyObj<AsignacionAnexoService>('AsignacionAnexoService', ['create', 'update']);
    const catalogo = jasmine.createSpyObj<CatalogoService>('CatalogoService', ['getDependencias']);
    catalogo.getDependencias.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AsignacionAnexoFormComponent],
      providers: [
        { provide: AsignacionAnexoService, useValue: service },
        { provide: CatalogoService, useValue: catalogo },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionAnexoFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('telefonos', [telefono]);
    fixture.detectChanges();
  });

  it('valida que el anexo tenga entre 3 y 6 dígitos', () => {
    const anexo = component.form.controls.anexo;
    anexo.setValue('12');
    expect(anexo.invalid).toBeTrue();
    anexo.setValue('1234567');
    expect(anexo.invalid).toBeTrue();
    anexo.setValue('1234');
    expect(anexo.valid).toBeTrue();
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

  it('envía telefonoFijoId al crear', () => {
    const created: AsignacionAnexo = {
      id: 1,
      telefonoFijo: telefono,
      anexo: '4321',
      numeroDirecto: null,
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
      telefonoFijoId: 4,
      anexo: '4321',
      personaNombre: 'Ana Torres',
      fechaInicio: '2026-09-10',
    });

    component.submit();

    expect(service.create).toHaveBeenCalledWith(jasmine.objectContaining({ telefonoFijoId: 4 }));
  });
});
