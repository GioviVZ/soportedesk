import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { ThemeService } from '../../core/services/theme.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;

  beforeEach(() => {
    jasmine.clock().install();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { getNombre: () => 'GERSON SANTIAGO', getRole: () => 'ADMIN' } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: ElementRef, useValue: new ElementRef(document.createElement('div')) },
        { provide: LayoutService, useValue: { sidebarOpen: () => false, toggle: jasmine.createSpy('toggle') } },
        { provide: ThemeService, useValue: { theme: () => 'light', toggle: jasmine.createSpy('toggle') } }
      ]
    });

    component = TestBed.runInInjectionContext(() => new HeaderComponent());
  });

  afterEach(() => jasmine.clock().uninstall());

  it('personaliza el saludo con el primer nombre normalizado', () => {
    jasmine.clock().mockDate(new Date(2026, 7, 10, 9));

    expect(component.saludo).toBe('Buenos días');
    expect(component.primerNombre).toBe('Gerson');
    expect(component.saludoIcon).toBe('ti-sun-high');
  });

  it('adapta el saludo y el icono a la tarde y la noche', () => {
    jasmine.clock().mockDate(new Date(2026, 7, 10, 16));
    expect(component.saludo).toBe('Buenas tardes');
    expect(component.saludoIcon).toBe('ti-sunset-2');

    jasmine.clock().mockDate(new Date(2026, 7, 10, 21));
    expect(component.saludo).toBe('Buenas noches');
    expect(component.saludoIcon).toBe('ti-moon-stars');
  });
});
