
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryGroup, ActiveDirectoryResponse, AdPanelResult, AdUser } from './active-directory.model';

@Component({
    selector: 'app-ad-groups-panel',
    imports: [FormsModule, SectionCardComponent],
    template: `
    <app-section-card title="Membresías">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    
      @if (error) {
        <div class="notice error">{{ error }}</div>
      }
    
      <div class="inline-search">
        <input name="groupSearch" [(ngModel)]="groupSearch" (ngModelChange)="onSearchChange($event)"
               placeholder="Buscar grupo" autocomplete="off" />
      </div>
      @if (results.length) {
        <div class="pick-list">
          @for (group of results; track group) {
            <button type="button" [disabled]="working" (click)="add(group.dn)">
              <strong>{{ group.cn }}</strong>
              <span>{{ group.description || group.dn }}</span>
            </button>
          }
        </div>
      }
      @if (groups.length) {
        <div class="assigned-list">
          @for (group of groups; track group) {
            <div>
              <span>{{ group.cn }}</span>
              <button type="button" class="record-action link-danger" [disabled]="working" (click)="remove(group.dn)">Quitar</button>
            </div>
          }
        </div>
      }
    </app-section-card>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './usuarios-red.shared.scss'
})
export class AdGroupsPanelComponent implements OnInit, OnDestroy {
  private adService = inject(ActiveDirectoryService);
  private readonly searchQueue = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  @Input({ required: true }) samAccountName!: string;
  @Output() changed = new EventEmitter<AdPanelResult>();

  groupSearch = '';
  results: ActiveDirectoryGroup[] = [];
  groups: ActiveDirectoryGroup[] = [];
  working = false;
  error = '';

  ngOnInit(): void {
    this.searchQueue.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => this.search());
    this.loadGroups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.groupSearch = value;
    if (value.trim().length < 2) this.results = [];
    this.searchQueue.next(value.trim());
  }

  search(): void {
    const term = this.groupSearch.trim();
    if (term.length < 2) return;
    this.adService.searchGroups(term).subscribe((groups) => (this.results = groups));
  }

  add(groupDn: string): void {
    if (!groupDn) return;
    this.run(this.adService.addGroup(this.samAccountName, groupDn));
  }

  remove(groupDn: string): void {
    if (!groupDn) return;
    this.run(this.adService.removeGroup(this.samAccountName, groupDn));
  }

  private run(request: Observable<ActiveDirectoryResponse<AdUser>>): void {
    this.error = '';
    this.working = true;
    request.subscribe({
      next: (response) => {
        this.working = false;
        if (!response.success) {
          this.error = response.message;
          return;
        }
        this.loadGroups();
        this.changed.emit({ user: response.data!, notice: { tone: 'success', text: response.message } });
      },
      error: () => {
        this.working = false;
        this.error = 'No se pudo completar la acción.';
      },
    });
  }

  private loadGroups(): void {
    this.adService.getUserGroups(this.samAccountName).subscribe({
      next: (groups) => (this.groups = groups),
      error: () => (this.groups = []),
    });
  }
}
