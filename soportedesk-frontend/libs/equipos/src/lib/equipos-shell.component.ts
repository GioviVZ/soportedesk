
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@soportedesk/core';
import { ModuleViewItem, ModuleViewSwitcherComponent } from '@soportedesk/ui';

@Component({
    selector: 'app-equipos-shell',
    imports: [RouterOutlet, ModuleViewSwitcherComponent],
    template: `
    <div class="module-page equipos-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Inventario de Equipos · Computadoras</span>
          <h2>Equipos de cómputo (GLPI)</h2>
          <p>Inventario GLPI, usuarios responsables, ubicación y hardware detectado.</p>
        </div>
      </div>
    
      <app-module-view-switcher ariaLabel="Vistas de Inventario de Equipos" [items]="views" />
    
      <router-outlet />
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './equipos.shared.scss'
})
export class EquiposShellComponent {
  private authService = inject(AuthService);
  readonly views: readonly ModuleViewItem[] = [
    { label: 'Inventario', route: 'inventario', icon: 'ti-device-desktop-search' },
    ...(this.authService.canWrite('equipos') ? [
      { label: 'Administración', route: 'mantenimiento', icon: 'ti-settings-2' },
      { label: 'Dashboard', route: 'dashboard', icon: 'ti-chart-bar' }
    ] : [])
  ];
}
