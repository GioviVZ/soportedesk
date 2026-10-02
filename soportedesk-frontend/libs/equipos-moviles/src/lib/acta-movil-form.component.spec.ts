import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogoService } from '@soportedesk/core';
import { of } from 'rxjs';
import { ActaMovilFormComponent } from './acta-movil-form.component';
import { ActaMovil } from './acta-movil.model';
import { ActaMovilService } from './acta-movil.service';
import { EquipoMovil } from './equipo-movil.model';

function equipoMock(): EquipoMovil {
  return {
    id: 7,
    tipo: 'TABLET',
    sede: null,
    dependencia: null,
    subdependencia: null,
    referencia: null,
    latitud: null,
    longitud: null,
    edificio: null,
    piso: null,
    marca: 'Samsung',
    modelo: 'Tab S9',
    serie: 'SER-7',
    imei1: '490154203237518',
    imei2: null,
    mac: null,
    sistemaOperativo: 'Android',
    almacenamiento: '256 GB',
    codigoPatrimonial: null,
    codigoInventario: 'INV-7',
    estado: 'Operativo',
    observaciones: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('ActaMovilFormComponent', () => {
  let fixture: ComponentFixture<ActaMovilFormComponent>;
  let component: ActaMovilFormComponent;
  let service: jasmine.SpyObj<ActaMovilService>;
  const equipo = equipoMock();
  const savedActa: ActaMovil = {
    id: 12,
    numeroActa: 'ACT-012',
    tipo: 'Entrega',
    fecha: '2026-10-02',
    personaNombre: 'Luis Vega',
    personaDni: null,
    dependencia: null,
    equipos: [equipo],
    observaciones: null,
    archivoNombre: null,
    archivoContentType: null,
    archivoTamano: null,
    tieneArchivo: false,
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<ActaMovilService>('ActaMovilService', [
      'create',
      'update',
      'uploadArchivo',
      'deleteArchivo',
    ]);
    const catalogo = jasmine.createSpyObj<CatalogoService>('CatalogoService', ['getDependencias']);
    catalogo.getDependencias.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ActaMovilFormComponent],
      providers: [
        { provide: ActaMovilService, useValue: service },
        { provide: CatalogoService, useValue: catalogo },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActaMovilFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('equipos', [equipo]);
    fixture.detectChanges();
  });

  it('requiere al menos un equipo', () => {
    component.form.patchValue({
      numeroActa: 'ACT-001',
      personaNombre: 'Luis Vega',
      equipoMovilIds: [],
    });
    expect(component.form.controls.equipoMovilIds.invalid).toBeTrue();
    expect(component.form.invalid).toBeTrue();
  });

  it('rechaza un archivo de 12 MB en el cliente', () => {
    const file = new File([new ArrayBuffer(12 * 1024 * 1024)], 'acta.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file], value: 'acta.pdf' } } as unknown as Event;

    component.onFileSelected(event);

    expect(component.selectedFile).toBeNull();
    expect(component.fileError).toContain('10 MB');
  });

  it('sube el archivo con el id devuelto después de crear el acta', () => {
    const file = new File(['contenido'], 'acta.pdf', { type: 'application/pdf' });
    service.create.and.returnValue(of(savedActa));
    service.uploadArchivo.and.returnValue(of(void 0));
    component.form.patchValue({
      numeroActa: 'ACT-012',
      personaNombre: 'Luis Vega',
      fecha: '2026-10-02',
      equipoMovilIds: [7],
    });
    component.selectedFile = file;

    component.submit();

    expect(service.create).toHaveBeenCalled();
    expect(service.uploadArchivo).toHaveBeenCalledOnceWith(12, file);
  });
});
