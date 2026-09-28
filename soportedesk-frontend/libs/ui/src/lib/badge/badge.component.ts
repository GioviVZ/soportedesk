import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


export type BadgeColor = 'green' | 'yellow' | 'red' | 'gray';

@Component({
    selector: 'app-badge',
    imports: [],
    templateUrl: './badge.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './badge.component.scss'
})
export class BadgeComponent {
  @Input({ required: true }) text!: string;
  @Input() color: BadgeColor = 'gray';
}
