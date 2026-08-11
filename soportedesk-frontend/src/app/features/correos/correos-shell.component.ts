
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModuleViewItem, ModuleViewSwitcherComponent } from '../../shared/module-view-switcher/module-view-switcher.component';

@Component({
    selector: 'app-correos-shell',
    imports: [RouterOutlet, ModuleViewSwitcherComponent],
    template: `
    <div class="module-page correos-page">
      <div class="module-header">
        <div>
          <span class="module-eyebrow">Cuentas institucionales</span>
          <h2>Correos Institucionales</h2>
          <p>Licencias, estado de cuentas y uso de Google Workspace desde GestionTI.</p>
        </div>
      </div>

      <app-module-view-switcher ariaLabel="Vistas de Correos" [items]="views" />

      <router-outlet />
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './correos.shared.scss'
})
export class CorreosShellComponent {
  readonly views: readonly ModuleViewItem[] = [
    { label: 'Consultas', route: 'consultas', icon: 'ti-search' },
    { label: 'Dashboard', route: 'dashboard', icon: 'ti-chart-bar' }
  ];
}
