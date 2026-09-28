import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VencimientoBadgeComponent } from './vencimiento-badge.component';

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().substring(0, 10);
}

describe('VencimientoBadgeComponent', () => {
  let fixture: ComponentFixture<VencimientoBadgeComponent>;
  let component: VencimientoBadgeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VencimientoBadgeComponent],
    });
    fixture = TestBed.createComponent(VencimientoBadgeComponent);
    component = fixture.componentInstance;
  });

  it('shows "Vencido" when fecha is in the past', () => {
    component.fecha = isoDateOffset(-5);
    fixture.detectChanges();
    expect(component.status).toBe('vencido');
    expect(fixture.nativeElement.textContent).toContain('Vencido');
  });

  it('shows "Por vencer" when fecha is within 30 days', () => {
    component.fecha = isoDateOffset(10);
    fixture.detectChanges();
    expect(component.status).toBe('por-vencer');
    expect(fixture.nativeElement.textContent).toContain('Por vencer');
  });

  it('shows nothing when fecha is more than 30 days away', () => {
    component.fecha = isoDateOffset(60);
    fixture.detectChanges();
    expect(component.status).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('shows nothing when fecha is null', () => {
    component.fecha = null;
    fixture.detectChanges();
    expect(component.status).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});
