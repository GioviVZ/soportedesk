import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/auth/auth.service';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'canRead']);

    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [{ provide: AuthService, useValue: authService }],
    });

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it('hides a module item when the user lacks read access', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(false);

    const licencias = component.navItems.find((item) => item.path === '/licencias')!;

    expect(component.canShow(licencias)).toBe(false);
    expect(authService.canRead).toHaveBeenCalledWith('licencias');
  });

  it('shows a module item when the user has read access', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(true);

    const licencias = component.navItems.find((item) => item.path === '/licencias')!;

    expect(component.canShow(licencias)).toBe(true);
  });

  it('shows every item to an admin regardless of canRead', () => {
    authService.isAdmin.and.returnValue(true);
    authService.canRead.and.returnValue(false);

    const licencias = component.navItems.find((item) => item.path === '/licencias')!;
    const usuariosSistema = component.navItems.find((item) => item.path === '/usuarios-sistema')!;

    expect(component.canShow(licencias)).toBe(true);
    expect(component.canShow(usuariosSistema)).toBe(true);
  });

  it('always shows the dashboard item (no permission gate)', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(false);

    const dashboard = component.navItems.find((item) => item.path === '/dashboard')!;

    expect(component.canShow(dashboard)).toBe(true);
  });
});
