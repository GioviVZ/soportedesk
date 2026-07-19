import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

@Component({
    selector: 'app-status-badge',
    imports: [CommonModule],
    templateUrl: './status-badge.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) tone!: BadgeTone;
  @Input() selectable = false;
  @Input() active = true;
  @Output() select = new EventEmitter<void>();

  onClick(): void {
    if (this.selectable) {
      this.select.emit();
    }
  }
}
