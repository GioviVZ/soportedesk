import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/auth/auth.service';
import { ICON_NAMES } from './animated-nav-icon/icon-name';

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

  it('shows catalogos when the user has catalog read access', () => {
    authService.isAdmin.and.returnValue(false);
    authService.canRead.and.returnValue(true);

    const catalogos = component.navItems.find((item) => item.path === '/catalogos')!;

    expect(component.canShow(catalogos)).toBe(true);
    expect(authService.canRead).toHaveBeenCalledWith('catalogos');
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

  it('gives every nav item an icon name the animated icon component recognizes', () => {
    for (const item of component.navItems) {
      expect(ICON_NAMES).withContext(`unknown icon "${item.icon}" for ${item.path}`).toContain(item.icon);
    }
  });

  it('treats the icon as active while the mouse is anywhere over its row, not just on the icon itself', () => {
    const impresoras = component.navItems.find((item) => item.path === '/impresoras')!;

    expect(component.iconActive(impresoras, false)).toBe(false);

    component.hoveredPath = '/impresoras';
    expect(component.iconActive(impresoras, false)).toBe(true);

    component.hoveredPath = null;
    expect(component.iconActive(impresoras, false)).toBe(false);
  });

  it('keeps the icon active for the current route even when the mouse is elsewhere', () => {
    const impresoras = component.navItems.find((item) => item.path === '/impresoras')!;

    component.hoveredPath = '/dashboard';

    expect(component.iconActive(impresoras, true)).toBe(true);
  });
});
