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
    permisos: ['vpn'],
  };

  beforeEach(() => {
    service = jasmine.createSpyObj<UsuarioSistemaService>('UsuarioSistemaService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    service.getAll.and.returnValue(of([usuario]));
    service.update.and.returnValue(of({ ...usuario, permisos: ['vpn', 'auditoria'] }));

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

    const auditCheckbox = fixture.debugElement
      .queryAll(By.css('.permiso-check'))
      .find((el) => el.nativeElement.textContent.includes('Vista de Movimientos'))
      ?.query(By.css('input'));

    expect(auditCheckbox).toBeTruthy();
    auditCheckbox!.nativeElement.checked = true;
    auditCheckbox!.triggerEventHandler('change');
    fixture.detectChanges();

    const saveButton = fixture.debugElement
      .queryAll(By.css('.form-actions button'))
      .find((button) => button.nativeElement.textContent.includes('Guardar'));
    saveButton!.triggerEventHandler('click');

    const request = service.update.calls.mostRecent().args[1] as UsuarioSistemaRequest;
    expect(service.update).toHaveBeenCalledWith(7, jasmine.objectContaining({ permisos: ['vpn', 'auditoria'] }));
    expect(request.permisos).toContain('auditoria');
  });
});
