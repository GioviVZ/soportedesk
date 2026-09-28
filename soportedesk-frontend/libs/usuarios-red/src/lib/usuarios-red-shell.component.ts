
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@soportedesk/core';
import { ModuleViewItem, ModuleViewSwitcherComponent } from '@soportedesk/ui';

@Component({
    selector: 'app-usuarios-red-shell',
    imports: [RouterOutlet, ModuleViewSwitcherComponent],
    template: `
    <div class="module-page usuarios-red-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Active Directory en vivo</span>
          <h2>Usuarios de Red/AD</h2>
          <p>Consulta, administracion y seguimiento del directorio institucional.</p>
        </div>
      </div>
    
      <app-module-view-switcher ariaLabel="Vistas de Usuarios de Red" [items]="views" />
    
      <router-outlet />
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './usuarios-red.shared.scss'
})
export class UsuariosRedShellComponent {
  private authService = inject(AuthService);
  readonly views: readonly ModuleViewItem[] = [
    { label: 'Consultas', route: 'consultas', icon: 'ti-search' },
    ...(this.authService.canWrite('usuarios-red') ? [
      { label: 'Administración', route: 'administracion', icon: 'ti-settings-2' },
      { label: 'Dashboard', route: 'dashboard', icon: 'ti-chart-bar' }
    ] : [])
  ];
}
