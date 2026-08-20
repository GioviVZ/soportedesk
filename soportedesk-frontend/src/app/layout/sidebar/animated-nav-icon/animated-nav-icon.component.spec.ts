import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimatedNavIconComponent } from './animated-nav-icon.component';
import { ICON_NAMES, IconName } from './icon-name';

const FALLBACK_ICONS: IconName[] = ['equipos', 'impresoras', 'licencias', 'usuarios-sistema', 'candidatos-persona'];
const BESPOKE_ICONS: IconName[] = ICON_NAMES.filter((name) => !FALLBACK_ICONS.includes(name));

describe('AnimatedNavIconComponent', () => {
  let fixture: ComponentFixture<AnimatedNavIconComponent>;

  function render(name: IconName): void {
    fixture = TestBed.createComponent(AnimatedNavIconComponent);
    fixture.componentInstance.name = name;
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AnimatedNavIconComponent] });
  });

  ICON_NAMES.forEach((name) => {
    it(`renders an svg with a viewBox for "${name}"`, () => {
      render(name);

      const svg = fixture.nativeElement.querySelector('svg');

      expect(svg).withContext(`missing svg for icon "${name}"`).not.toBeNull();
      expect(svg.getAttribute('viewBox')).toBeTruthy();
    });
  });

  it('adds an icon-<name> host class so each icon can be styled individually', () => {
    render('dashboard');

    expect(fixture.nativeElement.classList.contains('icon-dashboard')).toBe(true);
  });

  it('does not add the active class by default', () => {
    render('correos');

    expect(fixture.nativeElement.classList.contains('active')).toBe(false);
  });

  it('adds the active class when the active input is true', () => {
    render('correos');
    fixture.componentInstance.active = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.classList.contains('active')).toBe(true);
  });

  BESPOKE_ICONS.forEach((name) => {
    it(`marks "${name}" as a bespoke animated icon (icon-animated host class)`, () => {
      render(name);

      expect(fixture.nativeElement.classList.contains('icon-animated')).toBe(true);
      expect(fixture.nativeElement.classList.contains('icon-fallback')).toBe(false);
    });
  });

  FALLBACK_ICONS.forEach((name) => {
    it(`marks "${name}" as a fallback drawn icon (icon-fallback host class)`, () => {
      render(name);

      expect(fixture.nativeElement.classList.contains('icon-fallback')).toBe(true);
      expect(fixture.nativeElement.classList.contains('icon-animated')).toBe(false);
    });
  });

  it('actually rotates the gear when the catalogos icon becomes active (not just adds the class)', () => {
    render('catalogos');
    const rotator = fixture.nativeElement.querySelector('.gear-rotator') as SVGGElement;
    const restTransform = getComputedStyle(rotator).transform;

    fixture.componentInstance.active = true;
    fixture.detectChanges();
    const activeTransform = getComputedStyle(rotator).transform;

    expect(activeTransform).not.toBe(restTransform);
  });

  it('actually plays the redraw animation on a fallback icon when it becomes active (not just adds the class)', () => {
    render('impresoras');
    const path = fixture.nativeElement.querySelector('path') as SVGPathElement;

    fixture.componentInstance.active = true;
    fixture.detectChanges();

    expect(getComputedStyle(path).animationName).toContain('icon-redraw');
  });

  it('renders every icon with the same effective stroke width and cap style (DESIGN.md: trazo uniforme)', () => {
    const rendered = ICON_NAMES.map((name) => {
      render(name);
      const svg = fixture.nativeElement.querySelector('svg') as SVGSVGElement;
      const renderedSize = Number(svg.getAttribute('width'));
      const viewBoxWidth = svg.viewBox.baseVal.width;
      const strokeWidth = Number(svg.getAttribute('stroke-width'));
      return {
        name,
        effectiveStrokeWidth: strokeWidth * (renderedSize / viewBoxWidth),
        linecap: svg.getAttribute('stroke-linecap'),
      };
    });

    const [reference, ...rest] = rendered;
    for (const icon of rest) {
      expect(icon.effectiveStrokeWidth)
        .withContext(`"${icon.name}" stroke renders at ${icon.effectiveStrokeWidth}px vs "${reference.name}" at ${reference.effectiveStrokeWidth}px`)
        .toBeCloseTo(reference.effectiveStrokeWidth, 1);
      expect(icon.linecap).withContext(`"${icon.name}" uses stroke-linecap="${icon.linecap}"`).toBe(reference.linecap);
    }
  });
});
