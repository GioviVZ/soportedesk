import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsuariosRedListComponent } from './usuarios-red-list.component';
import { AuthService } from '../../core/auth/auth.service';
import { AdUser } from './active-directory.model';

describe('UsuariosRedListComponent', () => {
  let httpMock: HttpTestingController;

  function createComponent(canWrite = true): UsuariosRedListComponent {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { canWrite: () => canWrite } }],
    });
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.runInInjectionContext(() => new UsuariosRedListComponent());
  }

  function adUser(overrides: Partial<AdUser> = {}): AdUser {
    return {
      samAccountName: 'jperez',
      displayName: 'Juan Perez',
      givenName: 'Juan',
      surname: 'Perez',
      mail: 'jperez@inia.local',
      department: null,
      company: null,
      title: null,
      telephoneNumber: null,
      mobile: null,
      office: null,
      description: null,
      distinguishedName: 'CN=Juan Perez,OU=Usuarios,DC=inia,DC=local',
      userPrincipalName: 'jperez@inia.local',
      enabled: true,
      locked: false,
      organizationalUnit: 'Usuarios',
      whenCreated: null,
      whenChanged: null,
      pwdLastSet: null,
      lastLogonTimestamp: null,
      accountExpires: null,
      badPwdCount: null,
      daysSincePasswordChange: null,
      groups: [],
      ...overrides,
    };
  }

  afterEach(() => httpMock.verify());

  it('loads the AD dashboard counts on init', () => {
    const component = createComponent();

    component.ngOnInit();

    const req = httpMock.expectOne('/api/active-directory/dashboard');
    req.flush({ usuariosHabilitados: 10, usuariosBloqueados: 1, usuariosDeshabilitados: 2, controladoresDominio: 1 });

    expect(component.dashboard?.usuariosHabilitados).toBe(10);
  });

  it('flashes an error and skips the request when the search term is empty', () => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 0,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 0,
    });

    component.searchTerm = '   ';
    component.searchUser();

    expect(component.notice).toEqual({ tone: 'error', text: 'Ingresa un usuario de red.' });
    expect(component.loading).toBe(false);
  });

  it('loads the user and their groups on a successful search', () => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 0,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 0,
    });

    component.searchTerm = 'jperez';
    component.searchUser();

    const userReq = httpMock.expectOne('/api/active-directory/usuarios/jperez');
    userReq.flush({ success: true, message: 'Usuario encontrado correctamente.', data: adUser() });

    const groupsReq = httpMock.expectOne('/api/active-directory/usuarios/jperez/grupos');
    groupsReq.flush([{ cn: 'VPN-Users', dn: 'CN=VPN-Users,DC=inia,DC=local', description: null }]);

    expect(component.user?.samAccountName).toBe('jperez');
    expect(component.groups.length).toBe(1);
    expect(component.notice?.tone).toBe('success');
  });

  it('shows the AD error message and clears the user when not found', () => {
    const component = createComponent();
    component.ngOnInit();
    httpMock.expectOne('/api/active-directory/dashboard').flush({
      usuariosHabilitados: 0,
      usuariosBloqueados: 0,
      usuariosDeshabilitados: 0,
      controladoresDominio: 0,
    });

    component.searchTerm = 'noexiste';
    component.searchUser();

    const userReq = httpMock.expectOne('/api/active-directory/usuarios/noexiste');
    userReq.flush({ success: false, message: 'Usuario no encontrado.', data: null });

    expect(component.user).toBeNull();
    expect(component.notice).toEqual({ tone: 'error', text: 'Usuario no encontrado.' });
  });
});
