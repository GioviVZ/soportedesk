import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const impresorasRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
    loadComponent: () =>
      import('./impresoras-shell.component').then(
        (m) => m.ImpresorasShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'consultas', pathMatch: 'full' },
      {
        path: 'consultas',
        canActivate: [moduloGuard('impresoras')],
        loadComponent: () =>
          import('./impresoras-consultas.component').then(
            (m) => m.ImpresorasConsultasComponent,
          ),
      },
      {
        path: 'administracion',
        canActivate: [moduloGuard('impresoras', { write: true })],
        loadComponent: () =>
          import('./impresoras-administracion.component').then(
            (m) => m.ImpresorasAdministracionComponent,
          ),
      },
      {
        path: 'dashboard',
        canActivate: [moduloGuard('impresoras', { write: true })],
        loadComponent: () =>
          import('./impresoras-dashboard.component').then(
            (m) => m.ImpresorasDashboardComponent,
          ),
      },
    ],
  },
];
