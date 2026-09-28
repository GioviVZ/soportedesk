import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';

export const wifiRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./wifi-shell.component').then((m) => m.WifiShellComponent),
    children: [
      { path: '', redirectTo: 'consultas', pathMatch: 'full' },
      {
        path: 'consultas',
        canActivate: [moduloGuard('wifi')],
        data: { mode: 'consultas' },
        loadComponent: () =>
          import('./wifi-list.component').then((m) => m.WifiListComponent),
      },
      {
        path: 'administracion',
        canActivate: [moduloGuard('wifi', { write: true })],
        data: { mode: 'administracion' },
        loadComponent: () =>
          import('./wifi-list.component').then((m) => m.WifiListComponent),
      },
      {
        path: 'dashboard',
        canActivate: [moduloGuard('wifi', { write: true })],
        loadComponent: () =>
          import('./wifi-dashboard.component').then(
            (m) => m.WifiDashboardComponent,
          ),
      },
    ],
  },
];
