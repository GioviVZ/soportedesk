
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-vpn-shell',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="module-page vpn-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Acceso remoto</span>
          <h2>VPN</h2>
          <p>Solicitudes, verificaciones de seguridad y credenciales de acceso remoto.</p>
        </div>
      </div>
    
      <nav class="ad-tabs" aria-label="VPN">
        <a routerLink="registros" routerLinkActive="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
          </svg>
          Registros
        </a>
        @if (canAdmin) {
          <a routerLink="administracion" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Administracion
          </a>
        }
        @if (canDashboard) {
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
    styleUrl: './vpn.shared.scss'
})
export class VpnShellComponent {
  private authService = inject(AuthService);

  get canAdmin(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn') || this.authService.canWrite('aprobar-vpn');
  }

  get canDashboard(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn');
  }
}
