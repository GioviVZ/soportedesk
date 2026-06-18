import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CambiarPasswordModalComponent } from './cambiar-password-modal.component';

describe('CambiarPasswordModalComponent', () => {
  let component: CambiarPasswordModalComponent;
  let fixture: ComponentFixture<CambiarPasswordModalComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CambiarPasswordModalComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CambiarPasswordModalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('form is invalid when fields are empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when passwords do not match', () => {
    component.form.setValue({ passwordActual: 'old123', passwordNueva: 'newpass1', confirmarPassword: 'different' });
    expect(component.form.invalid).toBeTrue();
  });

  it('form is invalid when new password is shorter than 6 chars', () => {
    component.form.setValue({ passwordActual: 'old123', passwordNueva: 'abc', confirmarPassword: 'abc' });
    expect(component.form.invalid).toBeTrue();
  });

  it('submit calls AuthService and emits saved on success', () => {
    const savedSpy = jasmine.createSpy('saved');
    component.saved.subscribe(savedSpy);
    component.form.setValue({ passwordActual: 'old123', passwordNueva: 'newpass1', confirmarPassword: 'newpass1' });

    component.submit();

    const req = httpMock.expectOne('/api/auth/cambiar-password');
    req.flush(null);

    expect(savedSpy).toHaveBeenCalled();
  });

  it('submit shows backend error message on failure without emitting saved', () => {
    const savedSpy = jasmine.createSpy('saved');
    component.saved.subscribe(savedSpy);
    component.form.setValue({ passwordActual: 'wrong', passwordNueva: 'newpass1', confirmarPassword: 'newpass1' });

    component.submit();

    const req = httpMock.expectOne('/api/auth/cambiar-password');
    req.flush({ message: 'La contraseña actual es incorrecta' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.errorMessage).toBe('La contraseña actual es incorrecta');
    expect(savedSpy).not.toHaveBeenCalled();
  });
});
