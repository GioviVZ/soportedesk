import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { UsuariosRedListComponent } from './usuarios-red-list.component';
import { AuthService } from '../../core/auth/auth.service';

describe('UsuariosRedListComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(queryParams: Record<string, string>): UsuariosRedListComponent {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: { canWrite: () => true } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedListComponent());
  }

  afterEach(() => httpMock.verify());

  it('reads the search query param and pre-filters the list', () => {
    const component = createComponent({ search: 'Inactivo' });

    component.ngOnInit();

    expect(component.initialSearch).toBe('Inactivo');
    const req = httpMock.expectOne(
      (r) => r.url === '/api/usuarios-red' && r.params.get('search') === 'Inactivo',
    );
    req.flush([]);
  });

  it('loads without a filter when there is no search query param', () => {
    const component = createComponent({});

    component.ngOnInit();

    expect(component.initialSearch).toBe('');
    const req = httpMock.expectOne((r) => r.url === '/api/usuarios-red');
    expect(req.request.params.has('search')).toBe(false);
    req.flush([]);
  });
});
