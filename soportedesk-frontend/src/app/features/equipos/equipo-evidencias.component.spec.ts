import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { EquipoEvidencia } from './equipo.model';
import { EquipoService } from './equipo.service';
import { EquipoEvidenciasComponent } from './equipo-evidencias.component';

describe('EquipoEvidenciasComponent', () => {
  let component: EquipoEvidenciasComponent;
  let service: jasmine.SpyObj<EquipoService>;
  let auth: jasmine.SpyObj<AuthService>;

  const evidencia = (id: number, name: string): EquipoEvidencia => ({
    id,
    nombreOriginal: name,
    descripcion: null,
    subidoPor: 'admin',
    fechaSubida: '2026-08-16T10:00:00',
  });

  beforeEach(() => {
    service = jasmine.createSpyObj<EquipoService>('EquipoService', [
      'getEvidencias',
      'descargarEvidencia',
      'subirEvidencia',
      'eliminarEvidencia',
    ]);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['canWrite']);
    service.getEvidencias.and.returnValue(of([]));
    service.descargarEvidencia.and.returnValue(of(new Blob()));
    auth.canWrite.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        { provide: EquipoService, useValue: service },
        { provide: AuthService, useValue: auth },
      ],
    });

    component = TestBed.runInInjectionContext(() => new EquipoEvidenciasComponent());
    component.computerId = 25;
    component.ngOnChanges({ computerId: new SimpleChange(null, 25, true) });
  });

  it('carga las imágenes del equipo indicado', () => {
    expect(service.getEvidencias).toHaveBeenCalledOnceWith(25);
    expect(component.loading()).toBeFalse();
    expect(component.canWrite).toBeTrue();
  });

  it('rechaza archivos que no sean imágenes antes de enviarlos', () => {
    const file = new File(['contenido'], 'documento.txt', { type: 'text/plain' });
    const input = { files: [file], value: 'documento.txt' };

    component.onFilesSelected({ target: input } as unknown as Event);

    expect(service.subirEvidencia).not.toHaveBeenCalled();
    expect(component.error()).toContain('no es una imagen');
    expect(input.value).toBe('');
  });

  it('permite subir varias imágenes en una sola selección', () => {
    const first = new File(['foto-1'], 'frontal.jpg', { type: 'image/jpeg' });
    const second = new File(['foto-2'], 'etiqueta.png', { type: 'image/png' });
    service.subirEvidencia.and.returnValues(
      of(evidencia(1, first.name)),
      of(evidencia(2, second.name)),
    );
    const input = { files: [first, second], value: 'imagenes' };

    component.onFilesSelected({ target: input } as unknown as Event);

    expect(service.subirEvidencia).toHaveBeenCalledTimes(2);
    expect(service.subirEvidencia).toHaveBeenCalledWith(25, first, '');
    expect(service.subirEvidencia).toHaveBeenCalledWith(25, second, '');
    expect(component.uploading()).toBeFalse();
    expect(input.value).toBe('');
  });
});
