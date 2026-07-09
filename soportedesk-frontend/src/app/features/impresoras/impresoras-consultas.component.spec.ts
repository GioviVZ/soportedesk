import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ImpresoraService } from './impresora.service';
import { ImpresorasConsultasComponent } from './impresoras-consultas.component';

describe('ImpresorasConsultasComponent', () => {
  let fixture: ComponentFixture<ImpresorasConsultasComponent>;
  let component: ImpresorasConsultasComponent;
  let service: jasmine.SpyObj<ImpresoraService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ImpresoraService>('ImpresoraService', ['getAll']);
    service.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ImpresorasConsultasComponent],
      providers: [{ provide: ImpresoraService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresorasConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the printer list on init', () => {
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('never allows management actions', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-impresora-form')).toBeNull();
  });
});
