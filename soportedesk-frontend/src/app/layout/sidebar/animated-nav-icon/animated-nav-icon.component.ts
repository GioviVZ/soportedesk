import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { IconName } from './icon-name';

const FALLBACK_ICONS = new Set<IconName>(['equipos', 'impresoras', 'licencias', 'usuarios-sistema', 'candidatos-persona']);

@Component({
  selector: 'app-animated-nav-icon',
  standalone: true,
  templateUrl: './animated-nav-icon.component.html',
  styleUrl: './animated-nav-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimatedNavIconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() active = false;

  @HostBinding('class')
  get hostClass(): string {
    const tier = FALLBACK_ICONS.has(this.name) ? 'icon-fallback' : 'icon-animated';
    const classes = ['icon', `icon-${this.name}`, tier];
    if (this.active) {
      classes.push('active');
    }
    return classes.join(' ');
  }
}
