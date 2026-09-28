import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdMoveOuPanelComponent } from './ad-move-ou-panel.component';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('AdMoveOuPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): AdMoveOuPanelComponent {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdMoveOuPanelComponent());
    component.samAccountName = 'jperez';
    return component;
  }

  afterEach(() => httpMock.verify());

  it('no busca si el termino tiene menos de 2 caracteres', () => {
    const component = createComponent();
    component.ouSearch = 'a';
    component.search();
    httpMock.expectNone((req) => req.url === '/api/active-directory/ous');
    expect(component.results).toEqual([]);
  });

  it('busca OUs y llena los resultados', () => {
    const component = createComponent();
    component.ouSearch = 'Soporte';
    component.search();
    httpMock
      .expectOne((req) => req.url === '/api/active-directory/ous' && req.params.get('nombre') === 'Soporte')
      .flush([{ name: 'Soporte', dn: 'OU=Soporte,DC=inia,DC=local' }]);
    expect(component.results.length).toBe(1);
  });

  it('emite saved con el usuario actualizado al mover exitosamente', () => {
    const component = createComponent();
    let result: any = null;
    component.saved.subscribe((r) => (result = r));
    component.move('OU=Soporte,DC=inia,DC=local');

    httpMock.expectOne('/api/active-directory/usuarios/jperez/mover-ou').flush({
      success: true,
      message: 'Usuario movido.',
      data: { samAccountName: 'jperez', organizationalUnit: 'OU=Soporte,DC=inia,DC=local' },
    });

    expect(result.user.organizationalUnit).toBe('OU=Soporte,DC=inia,DC=local');
    expect(component.working).toBe(false);
  });

  it('muestra error y no emite saved si el backend responde success:false', () => {
    const component = createComponent();
    let emitted = false;
    component.saved.subscribe(() => (emitted = true));
    component.move('OU=X');

    httpMock.expectOne('/api/active-directory/usuarios/jperez/mover-ou').flush({
      success: false,
      message: 'No se pudo mover.',
      data: null,
    });

    expect(emitted).toBe(false);
    expect(component.error).toBe('No se pudo mover.');
  });
});
