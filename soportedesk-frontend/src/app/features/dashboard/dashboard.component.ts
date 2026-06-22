import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DashboardService } from './dashboard.service';
import { DashboardCounts } from './dashboard-counts.model';
import { UsuariosRedPorUbicacionChartComponent } from './usuarios-red-por-ubicacion-chart.component';
import { LicenciasPorTipoChartComponent } from './licencias-por-tipo-chart.component';

interface DashboardCard {
  label: string;
  value: number;
  path: string;
  color: string;
  bg: string;
  icon: SafeHtml;
  queryParams?: Record<string, string>;
}

const ICONS: Record<string, string> = {
  key:     `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/></svg>`,
  mail:    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  users:   `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  lock:    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  wifi:    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
  printer: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
  monitor: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  userX:   `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg>`,
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, UsuariosRedPorUbicacionChartComponent, LicenciasPorTipoChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private sanitizer = inject(DomSanitizer);

  cards: DashboardCard[] = [];
  totalRegistros = 0;

  ngOnInit(): void {
    this.dashboardService.getCounts().subscribe(counts => {
      this.cards = this.toCards(counts);
      this.totalRegistros = counts.licencias + counts.correos + counts.usuariosRed + counts.vpn
        + counts.wifi + counts.impresoras + counts.equipos;
    });
  }

  private svg(key: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[key]);
  }

  private toCards(counts: DashboardCounts): DashboardCard[] {
    return [
      { label: 'Licencias',       value: counts.licencias,    path: '/licencias',    color: '#3b82f6', bg: '#eff6ff', icon: this.svg('key') },
      { label: 'Correos Institucionales',value: counts.correos,      path: '/correos',      color: '#8b5cf6', bg: '#f5f3ff', icon: this.svg('mail') },
      { label: 'Usuarios de Red/AD',     value: counts.usuariosRed,  path: '/usuarios-red', color: '#f97316', bg: '#fff7ed', icon: this.svg('users') },
      { label: 'VPN',                    value: counts.vpn,          path: '/vpn',          color: '#ef4444', bg: '#fef2f2', icon: this.svg('lock') },
      { label: 'Claves WiFi',            value: counts.wifi,         path: '/wifi',         color: '#06b6d4', bg: '#ecfeff', icon: this.svg('wifi') },
      { label: 'Impresoras',             value: counts.impresoras,   path: '/impresoras',   color: '#64748b', bg: '#f8fafc', icon: this.svg('printer') },
      { label: 'Equipos Asignados',      value: counts.equipos,      path: '/equipos',      color: '#16a34a', bg: '#f0fdf4', icon: this.svg('monitor') },
      { label: 'Usuarios Desactivados',  value: counts.usuariosRedInactivos, path: '/usuarios-red', color: '#d97706', bg: '#fffbeb', icon: this.svg('userX'), queryParams: { search: 'Inactivo' } },
    ];
  }
}
