
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ModuleViewItem, ModuleViewSwitcherComponent } from '../../shared/module-view-switcher/module-view-switcher.component';

@Component({
    selector: 'app-wifi-shell',
    imports: [RouterOutlet, ModuleViewSwitcherComponent],
    template: `
    <div class="module-page wifi-page">
      <div class="module-header"><div><span class="module-eyebrow">Conectividad</span><h2>WiFi</h2><p>Consulta, administración y panorama de las redes inalámbricas institucionales.</p></div></div>
      <app-module-view-switcher ariaLabel="Vistas de WiFi" [items]="views" />
      <router-outlet />
    </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './wifi-list.component.scss'
})
export class WifiShellComponent {
  private auth = inject(AuthService);
  readonly views: readonly ModuleViewItem[] = [
    { label: 'Consultas', route: 'consultas', icon: 'ti-search' },
    ...(this.auth.canWrite('wifi') ? [
      { label: 'Administración', route: 'administracion', icon: 'ti-settings-2' },
      { label: 'Dashboard', route: 'dashboard', icon: 'ti-chart-bar' }
    ] : [])
  ];
}
