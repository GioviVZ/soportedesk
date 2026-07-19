import { Component, ContentChild, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
}

@Component({
    selector: 'app-generic-table',
    imports: [CommonModule],
    templateUrl: './generic-table.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './generic-table.component.scss'
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class GenericTableComponent<T = any> implements OnInit, OnChanges {
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input({ required: true }) data: T[] = [];
  @Input() canEdit = false;
  @Input() canAdd: boolean | null = null;
  @Input() canView = true;
  @Input() extraColumnLabel: string | null = null;
  @Input() initialSearch = '';
  @Input() emptyMessage = 'Sin registros aun';
  @Input() showSearch = true;

  @Output() searchChange = new EventEmitter<string>();
  @Output() add = new EventEmitter<void>();
  @Output() view = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();

  @ContentChild('extraCell') extraCellTemplate?: TemplateRef<{ $implicit: T }>;

  searchTerm = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;

  get showAddButton(): boolean {
    return this.canAdd ?? this.canEdit;
  }

  ngOnInit(): void {
    this.searchTerm = this.initialSearch;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialSearch'] && !changes['initialSearch'].firstChange) {
      this.searchTerm = this.initialSearch;
    }
  }

  getValue(row: T, key: string): unknown {
    return key.split('.').reduce<unknown>((value, part) => {
      if (value && typeof value === 'object') {
        return (value as Record<string, unknown>)[part];
      }
      return undefined;
    }, row);
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.searchChange.emit(value), 300);
  }
}
