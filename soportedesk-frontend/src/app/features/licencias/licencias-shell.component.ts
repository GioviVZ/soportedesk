
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ModuleViewItem, ModuleViewSwitcherComponent } from '../../shared/module-view-switcher/module-view-switcher.component';

@Component({
    selector: 'app-licencias-shell',
    imports: [RouterOutlet, ModuleViewSwitcherComponent],
    template: `
    <div class="module-page licencias-page">
      <div class="module-header"><div><span class="module-eyebrow">Activos de software</span><h2>Licencias</h2><p>Consulta, administración y métricas de compras, activaciones y unidades.</p></div></div>
      <app-module-view-switcher ariaLabel="Vistas de Licencias" [items]="views" />
      <router-outlet />
    </div>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './licencias-list.component.scss'
})
export class LicenciasShellComponent {
  private auth = inject(AuthService);
  readonly views: readonly ModuleViewItem[] = [
    { label: 'Consultas', route: 'consultas', icon: 'ti-search' },
    ...(this.auth.canWrite('licencias') ? [
      { label: 'Administración', route: 'administracion', icon: 'ti-settings-2' },
      { label: 'Dashboard', route: 'dashboard', icon: 'ti-chart-bar' }
    ] : [])
  ];
}
