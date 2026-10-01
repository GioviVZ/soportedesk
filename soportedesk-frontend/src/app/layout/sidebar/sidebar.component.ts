import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@soportedesk/core';
import { LayoutService } from '@soportedesk/core';
import { filter } from 'rxjs';
import { AnimatedNavIconComponent } from './animated-nav-icon/animated-nav-icon.component';
import { IconName } from './animated-nav-icon/icon-name';

interface NavLeaf {
  label: string;
  path: string;
  icon: string;
}

interface NavGroup {
  key: string;
  label: string;
  icon: string;
  permission?: string;
  children: NavLeaf[];
}

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
  permission?: string;
  groups?: NavGroup[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, AnimatedNavIconComponent],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly layout = inject(LayoutService);

  collapsed = false;
  hoveredPath: string | null = null;
  expanded = new Set<string>();
  currentUrl = '';

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Panel de Control', icon: 'dashboard' },
    { path: '/usuarios-red/consultas', label: 'Usuarios de Red/AD', icon: 'usuarios-red', permission: 'usuarios-red' },
    { path: '/correos', label: 'Correos Institucionales', icon: 'correos', permission: 'correos' },
    {
      path: '/equipos',
      label: 'Inventario de Equipos',
      icon: 'equipos',
      permission: 'equipos',
      groups: [
        {
          key: 'computadoras',
          label: 'Computadoras',
          icon: 'ti-device-desktop',
          permission: 'equipos',
          children: [
            {
              label: 'Equipos de cómputo (GLPI)',
              path: '/equipos/computadoras',
              icon: 'ti-device-desktop-search',
            },
          ],
        },
        {
          key: 'red',
          label: 'Equipos de Conexión de Red',
          icon: 'ti-network',
          permission: 'equipos-red',
          children: [
            { label: 'Switches', path: '/equipos/red/switches', icon: 'ti-server-2' },
            { label: 'Routers', path: '/equipos/red/routers', icon: 'ti-router' },
            { label: 'Access Points', path: '/equipos/red/access-points', icon: 'ti-access-point' },
            { label: 'Radioenlaces', path: '/equipos/red/radioenlaces', icon: 'ti-antenna' },
          ],
        },
        {
          key: 'moviles',
          label: 'Equipos Móviles',
          icon: 'ti-device-mobile',
          permission: 'equipos',
          children: [
            { label: 'Inventario', path: '/equipos/moviles/inventario', icon: 'ti-list-details' },
            { label: 'Asignación de número', path: '/equipos/moviles/asignacion-numero', icon: 'ti-device-sim' },
            { label: 'Actas', path: '/equipos/moviles/actas', icon: 'ti-file-text' },
          ],
        },
        {
          key: 'telefonia-fija',
          label: 'Equipos de Telefonía Fija',
          icon: 'ti-phone',
          permission: 'equipos',
          children: [
            { label: 'Inventario', path: '/equipos/telefonia-fija/inventario', icon: 'ti-list-details' },
            { label: 'Asignación de anexos', path: '/equipos/telefonia-fija/asignacion-anexos', icon: 'ti-phone-call' },
          ],
        },
      ],
    },
    { path: '/vpn', label: 'VPN', icon: 'vpn', permission: 'vpn' },
    { path: '/impresoras', label: 'Impresoras', icon: 'impresoras', permission: 'impresoras' },
    { path: '/wifi', label: 'Claves WiFi', icon: 'wifi', permission: 'wifi' },
    { path: '/licencias', label: 'Licencias', icon: 'licencias', permission: 'licencias' },
    { path: '/auditoria', label: 'Movimientos', icon: 'auditoria', permission: 'auditoria' },
    { path: '/herramientas', label: 'Aplicaciones', icon: 'herramientas', permission: 'herramientas' },
    { path: '/usuarios-sistema', label: 'Usuarios del Sistema', icon: 'usuarios-sistema', adminOnly: true },
    { path: '/catalogos', label: 'Configuración', icon: 'catalogos', permission: 'catalogos' },
  ];

  constructor() {
    this.expandForUrl(this.router.url);
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe((event) => this.expandForUrl(event.urlAfterRedirects));
  }

  iconActive(item: NavItem, routeIsActive: boolean): boolean {
    return routeIsActive || this.hoveredPath === item.path;
  }

  canShow(item: NavItem): boolean {
    if (item.adminOnly) {
      return this.authService.isAdmin();
    }
    if (item.groups) {
      return this.authService.isAdmin() || item.groups.some((group) => this.canShowGroup(group));
    }
    if (item.permission) {
      if (item.permission === 'vpn') {
        return this.authService.isAdmin()
          || this.authService.canRead('vpn')
          || this.authService.canWrite('solicitar-vpn')
          || this.authService.canWrite('aprobar-vpn');
      }
      return this.authService.isAdmin() || this.authService.canRead(item.permission);
    }
    return true;
  }

  canShowGroup(group: NavGroup): boolean {
    return !group.permission
      || this.authService.isAdmin()
      || this.authService.canRead(group.permission);
  }

  firstVisiblePath(item: NavItem): string {
    return item.groups
      ?.find((group) => this.canShowGroup(group))
      ?.children[0]?.path ?? item.path;
  }

  isExpanded(key: string): boolean {
    return this.expanded.has(key);
  }

  toggle(key: string): void {
    if (this.expanded.has(key)) {
      this.expanded.delete(key);
    } else {
      this.expanded.add(key);
    }
  }

  isWithin(path: string): boolean {
    const currentUrl = this.currentUrl.replace(/[?#].*$/, '');
    return currentUrl === path || currentUrl.startsWith(`${path}/`);
  }

  groupIsActive(group: NavGroup): boolean {
    return group.children.some((child) => this.isWithin(child.path));
  }

  expandForUrl(url: string): void {
    this.currentUrl = url.replace(/[?#].*$/, '');

    for (const item of this.navItems) {
      if (!item.groups || !this.isWithin(item.path)) continue;

      this.expanded.add(item.path);
      for (const group of item.groups) {
        if (this.groupIsActive(group)) {
          this.expanded.add(`${item.path}:${group.key}`);
        }
      }
    }
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    this.layout.close();
  }
}
