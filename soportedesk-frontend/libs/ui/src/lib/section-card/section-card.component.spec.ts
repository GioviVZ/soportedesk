import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionCardComponent } from './section-card.component';

@Component({
    imports: [SectionCardComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <app-section-card title="Identificacion">
      <span icon data-testid="icon">I</span>
      <p data-testid="content">Contenido</p>
    </app-section-card>
  `
})
class HostComponent {}

describe('SectionCardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders the title in an h4', () => {
    const title = fixture.nativeElement.querySelector('h4') as HTMLElement;
    expect(title.textContent?.trim()).toBe('Identificacion');
  });

  it('projects icon and body content', () => {
    expect(fixture.nativeElement.querySelector('[data-testid="icon"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="content"]')?.textContent).toContain('Contenido');
  });
});
