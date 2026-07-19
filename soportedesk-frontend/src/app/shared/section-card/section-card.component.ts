
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-section-card',
    imports: [],
    templateUrl: './section-card.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './section-card.component.scss'
})
export class SectionCardComponent {
  @Input({ required: true }) title!: string;
}
