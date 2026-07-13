import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../../core/services/layout.service';

interface NavItem {
  path: string;
  label: string;
  icon: SafeHtml;
  adminOnly?: boolean;
  permission?: string;
}

const SVG_ICONS: Record<string, string> = {
  home: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  key: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  wifi: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  printer: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
  monitor: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  server: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01"/><path d="M7 17h.01"/><path d="M11 7h6"/><path d="M11 17h6"/></svg>`,
  grid: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  activity: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  wrench: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4.5 4.5 0 0 0-5.9 5.9L3 18v3h3l5.8-5.8a4.5 4.5 0 0 0 5.9-5.9l-3.1 3.1-3-3 3.1-3.1z"/></svg>`,
  chevL: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevR: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  readonly layout = inject(LayoutService);

  collapsed = false;

  readonly chevL: SafeHtml;
  readonly chevR: SafeHtml;
  readonly navItems: NavItem[];

  constructor() {
    const s = this.sanitizer;
    this.chevL = s.bypassSecurityTrustHtml(SVG_ICONS['chevL']);
    this.chevR = s.bypassSecurityTrustHtml(SVG_ICONS['chevR']);

    this.navItems = [
      { path: '/dashboard', label: 'Panel de Control', icon: s.bypassSecurityTrustHtml(SVG_ICONS['home']) },
      { path: '/usuarios-red/consultas', label: 'Usuarios de Red/AD', icon: s.bypassSecurityTrustHtml(SVG_ICONS['users']), permission: 'usuarios-red' },
      { path: '/correos', label: 'Correos Institucionales', icon: s.bypassSecurityTrustHtml(SVG_ICONS['mail']), permission: 'correos' },
      { path: '/equipos', label: 'Inventario de Equipos', icon: s.bypassSecurityTrustHtml(SVG_ICONS['monitor']), permission: 'equipos' },
      { path: '/vpn', label: 'VPN', icon: s.bypassSecurityTrustHtml(SVG_ICONS['lock']), permission: 'vpn' },
      { path: '/impresoras', label: 'Impresoras', icon: s.bypassSecurityTrustHtml(SVG_ICONS['printer']), permission: 'impresoras' },
      { path: '/wifi', label: 'Claves WiFi', icon: s.bypassSecurityTrustHtml(SVG_ICONS['wifi']), permission: 'wifi' },
      { path: '/licencias', label: 'Licencias', icon: s.bypassSecurityTrustHtml(SVG_ICONS['key']), permission: 'licencias' },
      { path: '/auditoria', label: 'Movimientos', icon: s.bypassSecurityTrustHtml(SVG_ICONS['activity']), permission: 'auditoria' },
      { path: '/herramientas', label: 'Aplicaciones', icon: s.bypassSecurityTrustHtml(SVG_ICONS['grid']), permission: 'herramientas' },
      { path: '/usuarios-sistema', label: 'Usuarios del Sistema', icon: s.bypassSecurityTrustHtml(SVG_ICONS['shield']), adminOnly: true },
      { path: '/catalogos', label: 'Configuración', icon: s.bypassSecurityTrustHtml(SVG_ICONS['wrench']), permission: 'catalogos' },
    ];
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
