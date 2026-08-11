
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ModuleViewItem, ModuleViewSwitcherComponent } from '../../shared/module-view-switcher/module-view-switcher.component';

@Component({
    selector: 'app-impresoras-shell',
    imports: [RouterOutlet, ModuleViewSwitcherComponent],
    template: `
    <div class="module-page impresoras-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Inventario fisico</span>
          <h2>Impresoras</h2>
          <p>Ficha tecnica, ubicacion, conexion, estado y consumibles de cada equipo.</p>
        </div>
      </div>
    
      <app-module-view-switcher ariaLabel="Vistas de Impresoras" [items]="views" />
    
      <router-outlet />
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './impresoras.shared.scss'
})
export class ImpresorasShellComponent {
  private authService = inject(AuthService);
  readonly views: readonly ModuleViewItem[] = [
    { label: 'Consultas', route: 'consultas', icon: 'ti-search' },
    ...(this.authService.canWrite('impresoras') ? [
      { label: 'Administración', route: 'administracion', icon: 'ti-settings-2' },
      { label: 'Dashboard', route: 'dashboard', icon: 'ti-chart-bar' }
    ] : [])
  ];
}
