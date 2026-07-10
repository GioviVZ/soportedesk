import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-equipos-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="module-page equipos-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Inventario</span>
          <h2>Inventario de Equipos</h2>
          <p>Inventario GLPI, usuarios responsables, ubicacion y hardware detectado.</p>
        </div>
      </div>

      <nav class="ad-tabs" aria-label="Inventario de Equipos">
        <a routerLink="inventario" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          Inventario
        </a>
        <a *ngIf="canWrite" routerLink="mantenimiento" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Mantenimiento
        </a>
        <a *ngIf="canWrite" routerLink="dashboard" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Dashboard
        </a>
      </nav>

      <router-outlet />
    </div>
  `,
  styleUrl: './equipos.shared.scss',
})
export class EquiposShellComponent {
  private authService = inject(AuthService);

  get canWrite(): boolean {
    return this.authService.canWrite('equipos');
  }
}
