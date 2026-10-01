import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogoService } from '@soportedesk/core';
import { of } from 'rxjs';
import { EquipoRedFormComponent } from './equipo-red-form.component';
import { EquipoRed } from './equipo-red.model';
import { EquipoRedService } from './equipo-red.service';

function equipoMock(): EquipoRed {
  const sede = { id: 1, nombre: 'Sede Central' };
  const dependencia = { id: 2, nombre: 'TI', sede, orgUnitPath: null };
  return {
    id: 9,
    tipo: 'SWITCH',
    sede,
    dependencia,
    subdependencia: null,
    referencia: 'Sala técnica',
    latitud: -34.901,
    longitud: -56.164,
    edificio: 'Central',
    piso: '3',
    gabinete: 'RACK-01',
    marca: 'Cisco',
    modelo: 'Catalyst 9200',
    serie: 'SER-99',
    codigoPatrimonial: 'PAT-01',
    codigoInventario: 'INV-01',
    etiqueta: 'SW-CENTRAL-P03-01',
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '10.0.0.10',
    ipPorDefecto: '10.0.0.1',
    host: 'sw-central',
    estado: 'Operativo',
    observaciones: 'Equipo principal',
    remotoSede: null,
    remotoReferencia: null,
    frecuenciaGhz: null,
    anchoCanalMhz: null,
    ssidEnlace: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('EquipoRedFormComponent', () => {
  let fixture: ComponentFixture<EquipoRedFormComponent>;
  let component: EquipoRedFormComponent;
  let service: jasmine.SpyObj<EquipoRedService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<EquipoRedService>('EquipoRedService', ['create', 'update']);
    const catalogo = jasmine.createSpyObj<CatalogoService>('CatalogoService', [
      'getSedes',
      'getTiposContrato',
      'getDependencias',
      'getSubdependencias',
    ]);
    catalogo.getSedes.and.returnValue(of([]));
    catalogo.getTiposContrato.and.returnValue(of([]));
    catalogo.getDependencias.and.returnValue(of([]));
    catalogo.getSubdependencias.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [EquipoRedFormComponent],
      providers: [
        { provide: EquipoRedService, useValue: service },
        { provide: CatalogoService, useValue: catalogo },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipoRedFormComponent);
    component = fixture.componentInstance;
  });

  it('muestra la sección Enlace únicamente para radioenlaces', () => {
    fixture.componentRef.setInput('tipo', 'SWITCH');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.enlace-section')).toBeNull();

    fixture.componentRef.setInput('tipo', 'RADIOENLACE');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.enlace-section')).not.toBeNull();
  });

  it('impide guardar cuando la IP es inválida', () => {
    fixture.detectChanges();
    component.form.patchValue({ marca: 'Cisco', modelo: 'C9200', ip: '999.1.1.1' });

    component.submit();

    expect(component.form.invalid).toBeTrue();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('precarga los valores al editar', () => {
    const equipo = equipoMock();
    fixture.componentRef.setInput('equipo', equipo);
    fixture.detectChanges();

    expect(component.form.getRawValue().marca).toBe('Cisco');
    expect(component.form.getRawValue().ip).toBe('10.0.0.10');
    expect(component.form.getRawValue().etiqueta).toBe('SW-CENTRAL-P03-01');
    expect(component.sedeId).toBe(1);
    expect(component.dependenciaId).toBe(2);
  });

  it('crea el equipo con el tipo y los identificadores de ubicación', () => {
    service.create.and.returnValue(of(equipoMock()));
    fixture.componentRef.setInput('tipo', 'ROUTER');
    fixture.detectChanges();
    component.sedeId = 4;
    component.dependenciaId = 5;
    component.subdependenciaId = 6;
    component.form.patchValue({
      marca: 'MikroTik',
      modelo: 'RB5009',
      ip: '192.168.10.1',
      mac: '00:11:22:33:44:55',
    });

    component.submit();

    expect(service.create).toHaveBeenCalledWith(jasmine.objectContaining({
      tipo: 'ROUTER',
      sedeId: 4,
      dependenciaId: 5,
      subdependenciaId: 6,
    }));
  });
});
