import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-row.component.html',
  styleUrl: './info-row.component.scss',
})
export class InfoRowComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number | null;
}
