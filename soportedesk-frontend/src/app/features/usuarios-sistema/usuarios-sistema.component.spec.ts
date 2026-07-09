import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { UsuariosSistemaComponent } from './usuarios-sistema.component';
import { UsuarioSistemaService } from './usuario-sistema.service';
import { UsuarioSistema, UsuarioSistemaRequest } from './usuario-sistema.model';

describe('UsuariosSistemaComponent', () => {
  let fixture: ComponentFixture<UsuariosSistemaComponent>;
  let service: jasmine.SpyObj<UsuarioSistemaService>;

  const usuario: UsuarioSistema = {
    id: 7,
    username: 'soporte01',
    nombre: 'Soporte Uno',
    rol: 'SOPORTE',
    activo: true,
    permisos: { vpn: 'VIEW' },
  };

  beforeEach(() => {
    service = jasmine.createSpyObj<UsuarioSistemaService>('UsuarioSistemaService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    service.getAll.and.returnValue(of([usuario]));
    service.update.and.returnValue(of({ ...usuario, permisos: { vpn: 'VIEW', auditoria: 'VIEW' } }));

    TestBed.configureTestingModule({
      imports: [UsuariosSistemaComponent],
      providers: [{ provide: UsuarioSistemaService, useValue: service }],
    });

    fixture = TestBed.createComponent(UsuariosSistemaComponent);
    fixture.detectChanges();
  });

  it('permite agregar Vista de Movimientos al actualizar permisos de un usuario', () => {
    const editButton = fixture.debugElement.query(By.css('.edit-btn'));
    editButton.triggerEventHandler('click');
    fixture.detectChanges();

    const auditCheckbox = fixture.debugElement.query(By.css('input[data-modulo="auditoria"][data-nivel="VIEW"]'));

    expect(auditCheckbox).toBeTruthy();
    auditCheckbox.nativeElement.checked = true;
    auditCheckbox.triggerEventHandler('change');
    fixture.detectChanges();

    const saveButton = fixture.debugElement
      .queryAll(By.css('.form-actions button'))
      .find((button) => button.nativeElement.textContent.includes('Guardar'));
    saveButton!.triggerEventHandler('click');

    const request = service.update.calls.mostRecent().args[1] as UsuarioSistemaRequest;
    expect(service.update).toHaveBeenCalledWith(
      7,
      jasmine.objectContaining({ permisos: jasmine.objectContaining({ vpn: 'VIEW', auditoria: 'VIEW' }) }),
    );
    expect(request.permisos['auditoria']).toBe('VIEW');
  });

  it('permite asignar nivel de edicion a un modulo mediante el selector de 3 opciones', () => {
    const editButton = fixture.debugElement.query(By.css('.edit-btn'));
    editButton.triggerEventHandler('click');
    fixture.detectChanges();

    const editRadio = fixture.debugElement.query(By.css('input[data-modulo="licencias"][data-nivel="EDIT"]'));
    expect(editRadio).toBeTruthy();
    editRadio.nativeElement.checked = true;
    editRadio.triggerEventHandler('change');
    fixture.detectChanges();

    const saveButton = fixture.debugElement
      .queryAll(By.css('.form-actions button'))
      .find((button) => button.nativeElement.textContent.includes('Guardar'));
    saveButton!.triggerEventHandler('click');

    expect(service.update).toHaveBeenCalledWith(
      7,
      jasmine.objectContaining({ permisos: jasmine.objectContaining({ licencias: 'EDIT' }) }),
    );
  });

  it('permite asignar permiso de edicion al modulo Catalogos', () => {
    const editButton = fixture.debugElement.query(By.css('.edit-btn'));
    editButton.triggerEventHandler('click');
    fixture.detectChanges();

    const editRadio = fixture.debugElement.query(By.css('input[data-modulo="catalogos"][data-nivel="EDIT"]'));
    expect(editRadio).toBeTruthy();
    editRadio.nativeElement.checked = true;
    editRadio.triggerEventHandler('change');
    fixture.detectChanges();

    const saveButton = fixture.debugElement
      .queryAll(By.css('.form-actions button'))
      .find((button) => button.nativeElement.textContent.includes('Guardar'));
    saveButton!.triggerEventHandler('click');

    expect(service.update).toHaveBeenCalledWith(
      7,
      jasmine.objectContaining({ permisos: jasmine.objectContaining({ catalogos: 'EDIT' }) }),
    );
  });

  it('quitar el nivel de un modulo de edicion elimina la clave del mapa de permisos', () => {
    const editButton = fixture.debugElement.query(By.css('.edit-btn'));
    editButton.triggerEventHandler('click');
    fixture.detectChanges();

    const sinAccesoRadio = fixture.debugElement.query(By.css('input[data-modulo="vpn"][data-nivel="NONE"]'));
    expect(sinAccesoRadio).toBeTruthy();
    sinAccesoRadio.nativeElement.checked = true;
    sinAccesoRadio.triggerEventHandler('change');
    fixture.detectChanges();

    const saveButton = fixture.debugElement
      .queryAll(By.css('.form-actions button'))
      .find((button) => button.nativeElement.textContent.includes('Guardar'));
    saveButton!.triggerEventHandler('click');

    const request = service.update.calls.mostRecent().args[1] as UsuarioSistemaRequest;
    expect(request.permisos['vpn']).toBeUndefined();
  });
});
