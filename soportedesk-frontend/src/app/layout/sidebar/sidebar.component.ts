import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IfAdminDirective } from '../../shared/directives/if-admin.directive';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IfAdminDirective],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  collapsed = false;

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/licencias', label: 'Licencias Office', icon: '🔑' },
    { path: '/correos', label: 'Correos Institucionales', icon: '✉️' },
    { path: '/usuarios-red', label: 'Usuarios de Red/AD', icon: '👤' },
    { path: '/vpn', label: 'VPN', icon: '🔒' },
    { path: '/wifi', label: 'Claves WiFi', icon: '📶' },
    { path: '/impresoras', label: 'Impresoras', icon: '🖨️' },
    { path: '/equipos', label: 'Equipos Asignados', icon: '💻' },
    { path: '/catalogos', label: 'Catálogos', icon: '🗂️', adminOnly: true },
  ];

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }
}
