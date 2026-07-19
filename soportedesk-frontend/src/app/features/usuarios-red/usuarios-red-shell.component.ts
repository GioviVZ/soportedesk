
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-usuarios-red-shell',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="module-page usuarios-red-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Active Directory en vivo</span>
          <h2>Usuarios de Red/AD</h2>
          <p>Consulta, administracion y seguimiento del directorio institucional.</p>
        </div>
      </div>
    
      <nav class="ad-tabs" aria-label="Usuarios de Red">
        <a routerLink="consultas" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          Consultas
        </a>
        @if (canWrite) {
          <a routerLink="administracion" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Administracion
          </a>
        }
        @if (canWrite) {
          <a routerLink="dashboard" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Dashboard
          </a>
        }
      </nav>
    
      <router-outlet />
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './usuarios-red.shared.scss'
})
export class UsuariosRedShellComponent {
  private authService = inject(AuthService);

  get canWrite(): boolean {
    return this.authService.canWrite('usuarios-red');
  }
}
