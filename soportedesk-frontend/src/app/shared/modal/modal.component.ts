import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input({ required: true }) title!: string;
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
