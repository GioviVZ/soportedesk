import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdResetPasswordPanelComponent } from './ad-reset-password-panel.component';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('AdResetPasswordPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): AdResetPasswordPanelComponent {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdResetPasswordPanelComponent());
    component.samAccountName = 'jperez';
    return component;
  }

  afterEach(() => httpMock.verify());

  it('no envia la peticion si la contraseña esta vacia', () => {
    const component = createComponent();
    component.newPassword = '   ';
    component.submit();
    expect(component.error).toBe('Ingresa una contraseña temporal.');
    httpMock.expectNone('/api/active-directory/usuarios/jperez/reset-password');
  });

  it('emite saved con el usuario actualizado cuando el reset es exitoso', () => {
    const component = createComponent();
    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.newPassword = 'Temporal123';
    component.forceChange = true;
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios/jperez/reset-password').flush({
      success: true,
      message: 'Contraseña restablecida.',
      data: { samAccountName: 'jperez', displayName: 'Juan Perez' },
    });

    expect(result.user.samAccountName).toBe('jperez');
    expect(result.notice).toEqual({ tone: 'success', text: 'Contraseña restablecida.' });
    expect(component.working).toBe(false);
  });

  it('muestra el error y no emite saved cuando el backend responde success:false', () => {
    const component = createComponent();
    let emitted = false;
    component.saved.subscribe(() => (emitted = true));
    component.newPassword = 'Temporal123';
    component.submit();

    httpMock.expectOne('/api/active-directory/usuarios/jperez/reset-password').flush({
      success: false,
      message: 'No se pudo restablecer.',
      data: null,
    });

    expect(emitted).toBe(false);
    expect(component.error).toBe('No se pudo restablecer.');
  });
});
