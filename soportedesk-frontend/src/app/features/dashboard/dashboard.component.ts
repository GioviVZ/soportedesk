import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { DashboardCounts } from './dashboard-counts.model';

interface DashboardCard {
  label: string;
  value: number;
  path: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  cards: DashboardCard[] = [];

  ngOnInit(): void {
    this.dashboardService.getCounts().subscribe((counts) => {
      this.cards = this.toCards(counts);
    });
  }

  private toCards(counts: DashboardCounts): DashboardCard[] {
    return [
      { label: 'Licencias Office', value: counts.licencias, path: '/licencias' },
      { label: 'Correos Institucionales', value: counts.correos, path: '/correos' },
      { label: 'Usuarios de Red/AD', value: counts.usuariosRed, path: '/usuarios-red' },
      { label: 'VPN', value: counts.vpn, path: '/vpn' },
      { label: 'Claves WiFi', value: counts.wifi, path: '/wifi' },
      { label: 'Impresoras', value: counts.impresoras, path: '/impresoras' },
      { label: 'Equipos Asignados', value: counts.equipos, path: '/equipos' },
    ];
  }
}
