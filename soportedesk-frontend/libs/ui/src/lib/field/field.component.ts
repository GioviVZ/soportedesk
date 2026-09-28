import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-field',
    imports: [],
    templateUrl: './field.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './field.component.scss'
})
export class FieldComponent {
  @Input({ required: true }) label!: string;
}
