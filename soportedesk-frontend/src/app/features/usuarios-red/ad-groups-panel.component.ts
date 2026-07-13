import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { SectionCardComponent } from '../../shared/section-card/section-card.component';
import { ActiveDirectoryService } from './active-directory.service';
import { ActiveDirectoryGroup, ActiveDirectoryResponse, AdPanelResult, AdUser } from './active-directory.model';

@Component({
  selector: 'app-ad-groups-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionCardComponent],
  template: `
    <app-section-card title="Membresías">
      <svg icon xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>

      <div class="notice error" *ngIf="error">{{ error }}</div>

      <div class="inline-search">
        <input name="groupSearch" [(ngModel)]="groupSearch" placeholder="Buscar grupo" (keyup.enter)="search()" />
        <button type="button" class="btn btn-ghost" (click)="search()">Buscar</button>
      </div>
      <div class="pick-list" *ngIf="results.length">
        <button type="button" *ngFor="let group of results" [disabled]="working" (click)="add(group.dn)">
          <strong>{{ group.cn }}</strong>
          <span>{{ group.description || group.dn }}</span>
        </button>
      </div>
      <div class="assigned-list" *ngIf="groups.length">
        <div *ngFor="let group of groups">
          <span>{{ group.cn }}</span>
          <button type="button" class="link-danger" [disabled]="working" (click)="remove(group.dn)">Quitar</button>
        </div>
      </div>
    </app-section-card>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class AdGroupsPanelComponent implements OnInit {
  private adService = inject(ActiveDirectoryService);

  @Input({ required: true }) samAccountName!: string;
  @Output() changed = new EventEmitter<AdPanelResult>();

  groupSearch = '';
  results: ActiveDirectoryGroup[] = [];
  groups: ActiveDirectoryGroup[] = [];
  working = false;
  error = '';

  ngOnInit(): void {
    this.loadGroups();
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
