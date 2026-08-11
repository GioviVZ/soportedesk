import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/services/layout.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
  permission?: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private authService = inject(AuthService);
  readonly layout = inject(LayoutService);

  collapsed = false;

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Panel de Control', icon: 'ti-layout-dashboard' },
    { path: '/usuarios-red/consultas', label: 'Usuarios de Red/AD', icon: 'ti-users-group', permission: 'usuarios-red' },
    { path: '/correos', label: 'Correos Institucionales', icon: 'ti-mail', permission: 'correos' },
    { path: '/equipos', label: 'Inventario de Equipos', icon: 'ti-device-desktop-analytics', permission: 'equipos' },
    { path: '/vpn', label: 'VPN', icon: 'ti-shield-lock', permission: 'vpn' },
    { path: '/impresoras', label: 'Impresoras', icon: 'ti-printer', permission: 'impresoras' },
    { path: '/wifi', label: 'Claves WiFi', icon: 'ti-wifi', permission: 'wifi' },
    { path: '/licencias', label: 'Licencias', icon: 'ti-key', permission: 'licencias' },
    { path: '/auditoria', label: 'Movimientos', icon: 'ti-history', permission: 'auditoria' },
    { path: '/herramientas', label: 'Aplicaciones', icon: 'ti-apps', permission: 'herramientas' },
    { path: '/usuarios-sistema', label: 'Usuarios del Sistema', icon: 'ti-user-shield', adminOnly: true },
    { path: '/candidatos-persona', label: 'Candidatos a Persona', icon: 'ti-user-search', adminOnly: true },
    { path: '/catalogos', label: 'Configuración', icon: 'ti-settings', permission: 'catalogos' },
  ];

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
