import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ImpresoraService } from './impresora.service';
import { ImpresorasListComponent } from './impresoras-list.component';

describe('ImpresorasListComponent', () => {
  let fixture: ComponentFixture<ImpresorasListComponent>;
  let component: ImpresorasListComponent;
  let service: jasmine.SpyObj<ImpresoraService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ImpresoraService>('ImpresoraService', ['getAll', 'delete']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['canWrite']);
    service.getAll.and.returnValue(of([]));
    authService.canWrite.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [ImpresorasListComponent],
      providers: [
        { provide: ImpresoraService, useValue: service },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresorasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads only the printer list when the user has read-only access', () => {
    expect(service.getAll).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('app-impresora-form')).toBeNull();
  });

  it('does not open the printer form without write access', () => {
    component.onAdd();
    fixture.detectChanges();

    expect(component.formOpen).toBe(false);
  });
});
