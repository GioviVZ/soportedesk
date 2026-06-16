import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeColor = 'green' | 'yellow' | 'red' | 'gray';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input({ required: true }) text!: string;
  @Input() color: BadgeColor = 'gray';
}
