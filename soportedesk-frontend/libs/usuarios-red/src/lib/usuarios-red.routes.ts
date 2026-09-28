import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';

export const usuariosRedRoutes: Routes = [
  {
    path: '',
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
