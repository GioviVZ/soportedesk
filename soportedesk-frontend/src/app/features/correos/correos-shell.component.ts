
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-correos-shell',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="module-page correos-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Cuentas institucionales</span>
          <h2>Correos Institucionales</h2>
          <p>Licencias, estado de cuentas y uso de Google Workspace desde GestionTI.</p>
        </div>
      </div>

      <nav class="ad-tabs" aria-label="Correos">
        <a routerLink="consultas" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          Consultas
        </a>
        <a routerLink="dashboard" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Dashboard
        </a>
      </nav>

      <router-outlet />
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './correos.shared.scss'
})
export class CorreosShellComponent {}
