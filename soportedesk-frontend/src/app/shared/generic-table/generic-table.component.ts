import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-table.component.html',
  styleUrl: './generic-table.component.scss',
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GenericTableComponent<T = any> {
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input({ required: true }) data: T[] = [];
  @Input() canEdit = false;
  @Input() extraColumnLabel: string | null = null;

  @Output() searchChange = new EventEmitter<string>();
  @Output() add = new EventEmitter<void>();
  @Output() view = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();

  @ContentChild('extraCell') extraCellTemplate?: TemplateRef<{ $implicit: T }>;

  getValue(row: T, key: string): unknown {
    return key.split('.').reduce<unknown>((value, part) => {
      if (value && typeof value === 'object') {
        return (value as Record<string, unknown>)[part];
      }
      return undefined;
    }, row);
  }

  onSearch(value: string): void {
    this.searchChange.emit(value);
  }
}
