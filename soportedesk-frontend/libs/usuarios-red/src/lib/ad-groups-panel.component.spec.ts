import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdGroupsPanelComponent } from './ad-groups-panel.component';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('AdGroupsPanelComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(): AdGroupsPanelComponent {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withXhr(), withInterceptorsFromDi()), provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(() => new AdGroupsPanelComponent());
    component.samAccountName = 'jperez';
    return component;
  }

  afterEach(() => httpMock.verify());

  it('carga los grupos asignados al iniciar', () => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos').flush([
      { cn: 'Soporte-TI', dn: 'CN=Soporte-TI,DC=inia,DC=local', description: null },
    ]);
    expect(component.groups.length).toBe(1);
  });

  it('agrega un grupo, recarga la lista y emite changed con el usuario actualizado', () => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos').flush([]);

    let result: any = null;
    component.changed.subscribe((r) => (result = r));
    component.add('CN=Soporte-TI,DC=inia,DC=local');

    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos/agregar').flush({
      success: true,
      message: 'Grupo agregado.',
      data: { samAccountName: 'jperez' },
    });
    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos').flush([
      { cn: 'Soporte-TI', dn: 'CN=Soporte-TI,DC=inia,DC=local', description: null },
    ]);

    expect(result.notice.text).toBe('Grupo agregado.');
    expect(component.groups.length).toBe(1);
  });

  it('muestra error y no emite changed si el backend responde success:false', () => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos').flush([]);

    let emitted = false;
    component.changed.subscribe(() => (emitted = true));
    component.remove('CN=Soporte-TI,DC=inia,DC=local');

    httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos/quitar').flush({
      success: false,
      message: 'No se pudo quitar el grupo.',
      data: null,
    });

    expect(emitted).toBe(false);
    expect(component.error).toBe('No se pudo quitar el grupo.');
  });
});
