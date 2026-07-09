import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ActiveDirectoryService } from './active-directory.service';
import { AdUserSummary } from './active-directory.model';

@Component({
  selector: 'app-ad-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  template: `
    <section class="card search-panel">
      <form class="search-form" (ngSubmit)="search()">
        <div class="field">
          <label>Usuario</label>
          <input name="usuario" [(ngModel)]="usuario" placeholder="usuario.apellido" autocomplete="off" />
        </div>
        <div class="field">
          <label>Nombre</label>
          <input name="nombre" [(ngModel)]="nombre" placeholder="Nombre completo" autocomplete="off" />
        </div>
        <div class="field">
          <label>Oficina</label>
          <input name="oficina" [(ngModel)]="oficina" placeholder="Sede u oficina" autocomplete="off" />
        </div>
        <button type="submit" class="btn btn-primary" [disabled]="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          {{ loading ? 'Buscando...' : 'Buscar' }}
        </button>
      </form>
      <p class="search-hint" *ngIf="!searched">Ingresa al menos 2 caracteres en un filtro para consultar el directorio.</p>
    </section>

    <div class="notice" [class.error]="messageTone === 'error'" *ngIf="message">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {{ message }}
    </div>

    <div class="card table-wrap" *ngIf="searched && results.length">
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre completo</th>
            <th>Oficina</th>
            <th>OU</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr
            class="clickable"
            *ngFor="let user of results"
            tabindex="0"
            role="button"
            [attr.aria-label]="'Ver detalle de ' + (user.displayName || user.samAccountName)"
            (click)="selected.emit(user)"
            (keydown.enter)="selected.emit(user)"
            (keydown.space)="$event.preventDefault(); selected.emit(user)"
          >
            <td>{{ user.samAccountName }}</td>
            <td>{{ user.displayName || 'Sin nombre' }}</td>
            <td>{{ user.office || 'No registrada' }}</td>
            <td>{{ user.organizationalUnit || 'Sin OU' }}</td>
            <td>
              <app-status-badge [label]="user.enabled ? 'Habilitado' : 'Deshabilitado'" [tone]="user.enabled ? 'success' : 'neutral'" />
              <app-status-badge *ngIf="user.locked" label="Bloqueado" tone="danger" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <section class="empty-state" *ngIf="searched && !results.length && !loading">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <strong>Sin resultados</strong>
      <span>Ajusta los filtros para consultar Active Directory.</span>
    </section>
  `,
  styleUrl: './usuarios-red.shared.scss',
})
export class AdUserSearchComponent {
  private adService = inject(ActiveDirectoryService);

  @Output() selected = new EventEmitter<AdUserSummary>();

  usuario = '';
  nombre = '';
  oficina = '';
  results: AdUserSummary[] = [];
  searched = false;
  loading = false;
  message = '';
  messageTone: 'info' | 'error' = 'info';

  search(): void {
    if (![this.usuario, this.nombre, this.oficina].some((value) => value.trim().length >= 2)) {
      this.results = [];
      this.searched = true;
      this.message = 'Ingresa al menos 2 caracteres en un filtro.';
      this.messageTone = 'error';
      return;
    }
    this.loading = true;
    this.message = '';
    this.adService.searchUsers({ usuario: this.usuario, nombre: this.nombre, oficina: this.oficina }).subscribe({
      next: (result) => {
        this.loading = false;
        this.searched = true;
        this.results = result.items;
        this.message = result.truncated ? 'Mostrando los primeros 50 resultados, afina tu busqueda.' : '';
        this.messageTone = 'info';
      },
      error: () => {
        this.loading = false;
        this.searched = true;
        this.results = [];
        this.message = 'No se pudo cargar. Intenta nuevamente.';
        this.messageTone = 'error';
      },
    });
  }
}
