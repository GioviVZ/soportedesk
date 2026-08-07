import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('soportedesk-theme');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.removeItem('soportedesk-theme');
    document.documentElement.removeAttribute('data-theme');
  });

  it('usa la preferencia guardada en localStorage, ignorando el sistema operativo', () => {
    localStorage.setItem('soportedesk-theme', 'dark');
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);

    const service = new ThemeService();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sin preferencia guardada, sigue la preferencia del sistema operativo', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);

    const service = new ThemeService();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sin preferencia guardada ni el sistema operativo en oscuro, usa claro', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);

    const service = new ThemeService();

    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('setTheme cambia el signal, aplica el atributo data-theme y persiste en localStorage', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const service = new ThemeService();

    service.setTheme('dark');

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('soportedesk-theme')).toBe('dark');
  });

  it('toggle alterna entre claro y oscuro', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    const service = new ThemeService();

    expect(service.theme()).toBe('light');
    service.toggle();
    expect(service.theme()).toBe('dark');
    service.toggle();
    expect(service.theme()).toBe('light');
  });
});
