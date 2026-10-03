import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const licenciasRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
    loadComponent: () =>
      import('./licencias-shell.component').then(
        (m) => m.LicenciasShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'consultas', pathMatch: 'full' },
      {
        path: 'consultas',
        canActivate: [moduloGuard('licencias')],
        data: { mode: 'consultas' },
        loadComponent: () =>
          import('./licencias-list.component').then(
            (m) => m.LicenciasListComponent,
          ),
      },
      {
        path: 'administracion',
        canActivate: [moduloGuard('licencias', { write: true })],
        data: { mode: 'administracion' },
        loadComponent: () =>
          import('./licencias-list.component').then(
            (m) => m.LicenciasListComponent,
          ),
      },
      {
        path: 'dashboard',
        canActivate: [moduloGuard('licencias', { write: true })],
        loadComponent: () =>
          import('./licencias-dashboard.component').then(
            (m) => m.LicenciasDashboardComponent,
          ),
      },
    ],
  },
];
