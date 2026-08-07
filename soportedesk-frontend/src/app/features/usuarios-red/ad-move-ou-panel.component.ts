
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryOu, AdPanelResult } from './active-directory.model';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
    selector: 'app-ad-move-ou-panel',
    imports: [FormsModule, SectionCardComponent],
    template: `
    <app-section-card title="Nueva unidad organizativa">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    
      @if (error) {
        <div class="notice error">{{ error }}</div>
      }
    
      <div class="inline-search">
        <input name="ouSearch" [(ngModel)]="ouSearch" (ngModelChange)="onSearchChange($event)"
               placeholder="Buscar OU" autocomplete="off" />
      </div>
      @if (results.length) {
        <div class="pick-list">
          @for (ou of results; track ou) {
            <button type="button" [disabled]="working" (click)="move(ou.dn)">
              <strong>{{ ou.name }}</strong>
              <span>{{ ou.dn }}</span>
            </button>
          }
        </div>
      }
    </app-section-card>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './usuarios-red.shared.scss'
})
export class AdMoveOuPanelComponent implements OnInit, OnDestroy {
  private adService = inject(ActiveDirectoryService);
  private readonly searchQueue = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  @Input({ required: true }) samAccountName!: string;
  @Output() saved = new EventEmitter<AdPanelResult>();

  ouSearch = '';
  results: ActiveDirectoryOu[] = [];
  working = false;
  error = '';

  ngOnInit(): void {
    this.searchQueue.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => this.search());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.ouSearch = value;
    if (value.trim().length < 2) this.results = [];
    this.searchQueue.next(value.trim());
  }

  search(): void {
    const term = this.ouSearch.trim();
    if (term.length < 2) return;
    this.adService.searchOus(term).subscribe((ous) => (this.results = ous));
  }

  move(ouDn: string): void {
    if (!ouDn) return;
    this.error = '';
    this.working = true;
    this.adService.moveUser(this.samAccountName, ouDn).subscribe({
      next: (response) => {
        this.working = false;
        if (!response.success) {
          this.error = response.message;
          return;
        }
        this.saved.emit({ user: response.data!, notice: { tone: 'success', text: response.message } });
      },
      error: () => {
        this.working = false;
        this.error = 'No se pudo completar la acción.';
      },
    });
  }
}
