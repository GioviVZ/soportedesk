import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import {
  ModulePlaceholderComponent,
  ModulePlaceholderData,
} from './module-placeholder.component';

describe('ModulePlaceholderComponent', () => {
  const data: ModulePlaceholderData = {
    eyebrow: 'Inventario de Equipos · Equipos Móviles',
    titulo: 'Inventario',
    descripcion: 'Smartphones y tablets institucionales.',
    icono: 'ti-device-mobile',
    acento: '--color-equipos',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModulePlaceholderComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data } },
        },
      ],
    });
  });

  it('renders the route data', () => {
    const fixture = TestBed.createComponent(ModulePlaceholderComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h2')?.textContent?.trim()).toBe(data.titulo);
    expect(
      element.querySelector('.module-eyebrow')?.textContent?.trim(),
    ).toBe(data.eyebrow);
    const icon = element.querySelector<HTMLElement>('.proximamente-icon .ti');

    expect(icon).not.toBeNull();
    expect(icon!.classList.contains(data.icono)).toBeTrue();
  });
});
