import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss',
})
export class FieldComponent {
  @Input({ required: true }) label!: string;
}
