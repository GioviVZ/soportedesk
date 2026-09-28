import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let component: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
    component.label = 'Activa';
    component.tone = 'success';
    fixture.detectChanges();
  });

  it('applies the tone class', () => {
    const badge = fixture.nativeElement.querySelector('.status-badge') as HTMLElement;
    expect(badge.classList).toContain('tone-success');
  });

  it('emits select when selectable', () => {
    spyOn(component.select, 'emit');
    component.selectable = true;
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.status-badge').click();

    expect(component.select.emit).toHaveBeenCalled();
  });

  it('does not emit select when not selectable', () => {
    spyOn(component.select, 'emit');

    fixture.nativeElement.querySelector('.status-badge').click();

    expect(component.select.emit).not.toHaveBeenCalled();
  });

  it('applies inactive class when selectable and inactive', () => {
    component.selectable = true;
    component.active = false;
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.status-badge') as HTMLElement;
    expect(badge.classList).toContain('inactive');
  });
});
