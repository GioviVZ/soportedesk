import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { AnimatedNavIconComponent } from './animated-nav-icon/animated-nav-icon.component';
import { IconName } from './animated-nav-icon/icon-name';

interface NavItem {
  path: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
  permission?: string;
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
  readonly layout = inject(LayoutService);

  collapsed = false;
  hoveredPath: string | null = null;

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Panel de Control', icon: 'dashboard' },
    { path: '/usuarios-red/consultas', label: 'Usuarios de Red/AD', icon: 'usuarios-red', permission: 'usuarios-red' },
    { path: '/correos', label: 'Correos Institucionales', icon: 'correos', permission: 'correos' },
    { path: '/equipos', label: 'Inventario de Equipos', icon: 'equipos', permission: 'equipos' },
    { path: '/vpn', label: 'VPN', icon: 'vpn', permission: 'vpn' },
    { path: '/impresoras', label: 'Impresoras', icon: 'impresoras', permission: 'impresoras' },
    { path: '/wifi', label: 'Claves WiFi', icon: 'wifi', permission: 'wifi' },
    { path: '/licencias', label: 'Licencias', icon: 'licencias', permission: 'licencias' },
    { path: '/auditoria', label: 'Movimientos', icon: 'auditoria', permission: 'auditoria' },
    { path: '/herramientas', label: 'Aplicaciones', icon: 'herramientas', permission: 'herramientas' },
    { path: '/usuarios-sistema', label: 'Usuarios del Sistema', icon: 'usuarios-sistema', adminOnly: true },
    { path: '/candidatos-persona', label: 'Candidatos a Persona', icon: 'candidatos-persona', adminOnly: true },
    { path: '/catalogos', label: 'Configuración', icon: 'catalogos', permission: 'catalogos' },
  ];

  iconActive(item: NavItem, routeIsActive: boolean): boolean {
    return routeIsActive || this.hoveredPath === item.path;
  }

  canShow(item: NavItem): boolean {
    if (item.adminOnly) {
      return this.authService.isAdmin();
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

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    this.layout.close();
  }
}
