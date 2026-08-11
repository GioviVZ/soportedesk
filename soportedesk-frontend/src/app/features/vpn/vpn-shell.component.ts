
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ModuleViewItem, ModuleViewSwitcherComponent } from '../../shared/module-view-switcher/module-view-switcher.component';

@Component({
    selector: 'app-vpn-shell',
    imports: [RouterOutlet, ModuleViewSwitcherComponent],
    template: `
    <div class="module-page vpn-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Acceso remoto</span>
          <h2>VPN</h2>
          <p>Solicitudes, verificaciones de seguridad y credenciales de acceso remoto.</p>
        </div>
      </div>
    
      <app-module-view-switcher ariaLabel="Vistas de VPN" [items]="views" />
    
      <router-outlet />
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './vpn.shared.scss'
})
export class VpnShellComponent {
  private authService = inject(AuthService);
  readonly views: readonly ModuleViewItem[] = [
    { label: 'Registros', route: 'registros', icon: 'ti-file-description' },
    ...(this.canAdmin ? [
      { label: 'Administración', route: 'administracion', icon: 'ti-settings-2' }
    ] : []),
    ...(this.canDashboard ? [
      { label: 'Dashboard', route: 'dashboard', icon: 'ti-chart-bar' }
    ] : [])
  ];

  get canAdmin(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('solicitar-vpn') || this.authService.canWrite('aprobar-vpn');
  }

  get canDashboard(): boolean {
    return this.authService.isAdmin() || this.authService.canWrite('aprobar-vpn');
  }
}
