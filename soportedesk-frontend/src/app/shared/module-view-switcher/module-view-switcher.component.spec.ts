import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ModuleViewSwitcherComponent } from './module-view-switcher.component';

@Component({ template: '' })
class EmptyViewComponent {}

describe('ModuleViewSwitcherComponent', () => {
  let fixture: ComponentFixture<ModuleViewSwitcherComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleViewSwitcherComponent],
      providers: [
        provideRouter([
          { path: 'consultas', component: EmptyViewComponent },
          { path: 'dashboard', component: EmptyViewComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleViewSwitcherComponent);
    fixture.componentRef.setInput('ariaLabel', 'Vistas de prueba');
    fixture.componentRef.setInput('items', [
      { label: 'Consultas', route: '/consultas', icon: 'ti-search' },
      { label: 'Dashboard', route: '/dashboard', icon: 'ti-chart-bar' }
    ]);
    router = TestBed.inject(Router);
  });

  it('expone etiquetas, iconos y nombre accesible', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Vistas de prueba');
    expect(Array.from(element.querySelectorAll('a')).map((link) => link.textContent?.trim()))
      .toEqual(['Consultas', 'Dashboard']);
    expect(element.querySelector('.ti-search')).not.toBeNull();
  });

  it('indica la vista activa con aria-current', async () => {
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const activeLink = fixture.nativeElement.querySelector('a.is-active') as HTMLAnchorElement;
    expect(activeLink.textContent).toContain('Dashboard');
    expect(activeLink.getAttribute('aria-current')).toBe('page');
  });
});
