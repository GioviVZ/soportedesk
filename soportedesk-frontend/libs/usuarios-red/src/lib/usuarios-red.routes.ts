import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const usuariosRedRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
    loadComponent: () =>
      import('./usuarios-red-shell.component').then(
        (m) => m.UsuariosRedShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'consultas', pathMatch: 'full' },
      {
        path: 'consultas',
        canActivate: [moduloGuard('usuarios-red')],
        loadComponent: () =>
          import('./usuarios-red-consultas.component').then(
            (m) => m.UsuariosRedConsultasComponent,
          ),
      },
      {
        path: 'administracion',
        canActivate: [moduloGuard('usuarios-red', { write: true })],
        loadComponent: () =>
          import('./usuarios-red-administracion.component').then(
            (m) => m.UsuariosRedAdministracionComponent,
          ),
      },
      {
        path: 'dashboard',
        canActivate: [moduloGuard('usuarios-red', { write: true })],
        loadComponent: () =>
          import('./usuarios-red-dashboard.component').then(
            (m) => m.UsuariosRedDashboardComponent,
          ),
      },
    ],
  },
];
