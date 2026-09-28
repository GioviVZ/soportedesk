import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';

export const correosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./correos-shell.component').then(
        (m) => m.CorreosShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'consultas', pathMatch: 'full' },
      {
        path: 'consultas',
        canActivate: [moduloGuard('correos')],
        loadComponent: () =>
          import('./correos-consultas.component').then(
            (m) => m.CorreosConsultasComponent,
          ),
      },
      {
        path: 'dashboard',
        canActivate: [moduloGuard('correos')],
        loadComponent: () =>
          import('./correos-dashboard.component').then(
            (m) => m.CorreosDashboardComponent,
          ),
      },
    ],
  },
];
