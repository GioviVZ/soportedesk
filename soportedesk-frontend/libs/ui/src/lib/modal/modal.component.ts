import { Component, EventEmitter, HostListener, Input, Output, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-modal',
    imports: [],
    templateUrl: './modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './modal.component.scss'
})
export class ModalComponent {
  @Input({ required: true }) title!: string;
  @Input() open = false;
  @Input() size: 'default' | 'wide' = 'default';
  @Input() hideDefaultFooter = false;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }
}
