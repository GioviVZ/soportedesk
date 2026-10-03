import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const correosRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
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
