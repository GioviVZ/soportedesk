import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface ModuleViewItem {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

@Component({
  selector: 'app-module-view-switcher',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './module-view-switcher.component.html',
  styleUrl: './module-view-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModuleViewSwitcherComponent {
  readonly ariaLabel = input('Vistas del módulo');
  readonly items = input.required<readonly ModuleViewItem[]>();
}
