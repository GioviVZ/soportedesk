import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ImpresoraService } from './impresora.service';
import { ImpresorasAdministracionComponent } from './impresoras-administracion.component';

describe('ImpresorasAdministracionComponent', () => {
  let fixture: ComponentFixture<ImpresorasAdministracionComponent>;
  let component: ImpresorasAdministracionComponent;
  let service: jasmine.SpyObj<ImpresoraService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ImpresoraService>('ImpresoraService', ['getAll', 'delete']);
    service.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ImpresorasAdministracionComponent],
      providers: [{ provide: ImpresoraService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresorasAdministracionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the printer list on init', () => {
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('opens the add form when onAdd is called', () => {
    component.onAdd();
    expect(component.formOpen).toBe(true);
  });
});
