import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { DashboardBreakdownComponent } from './dashboard-breakdown.component';

describe('DashboardBreakdownComponent', () => {
  let fixture: ComponentFixture<DashboardBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardBreakdownComponent],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardBreakdownComponent);
    fixture.nativeElement.style.display = 'block';
    fixture.nativeElement.style.width = '360px';
    fixture.componentRef.setInput('title', 'Usuarios por una dependencia con un nombre institucional bastante extenso');
    fixture.componentRef.setInput('subtitle', 'Descripción completa que debe seguir visible aun cuando el cuadro sea estrecho');
    fixture.componentRef.setInput('items', [
      { label: 'Subdependencia con una denominación administrativa especialmente larga', total: 18 },
      { label: 'Soporte', total: 7 },
    ]);
    fixture.detectChanges();
  });

  it('keeps long header text visible instead of truncating it', () => {
    const title = fixture.nativeElement.querySelector('.breakdown__identity strong') as HTMLElement;
    const subtitle = fixture.nativeElement.querySelector('.breakdown__identity small') as HTMLElement;

    expect(title.textContent).toContain('nombre institucional bastante extenso');
    expect(getComputedStyle(title).whiteSpace).toBe('normal');
    expect(getComputedStyle(title).textOverflow).not.toBe('ellipsis');
    expect(getComputedStyle(subtitle).display).not.toBe('none');
  });

  it('wraps long category names and stacks the open content in a narrow card', () => {
    (fixture.nativeElement.querySelector('.breakdown__toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    const body = fixture.nativeElement.querySelector('.breakdown__body') as HTMLElement;
    const label = fixture.nativeElement.querySelector('.breakdown__row span') as HTMLElement;

    expect(label.textContent).toContain('denominación administrativa especialmente larga');
    expect(getComputedStyle(label).whiteSpace).toBe('normal');
    expect(getComputedStyle(label).textOverflow).not.toBe('ellipsis');
    expect(getComputedStyle(body).gridTemplateColumns.split(' ')).toHaveSize(1);
  });
});
