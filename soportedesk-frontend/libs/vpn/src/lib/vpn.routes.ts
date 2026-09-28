import { Routes } from '@angular/router';
import { moduloGuard, vpnAdminGuard } from '@soportedesk/core';

export const vpnRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./vpn-shell.component').then((m) => m.VpnShellComponent),
    children: [
      { path: '', redirectTo: 'registros', pathMatch: 'full' },
      {
        path: 'registros',
        canActivate: [moduloGuard('vpn')],
        loadComponent: () =>
          import('./vpn-registros.component').then(
            (m) => m.VpnRegistrosComponent,
          ),
      },
      {
        path: 'administracion',
        canActivate: [vpnAdminGuard],
        loadComponent: () =>
          import('./vpn-administracion.component').then(
            (m) => m.VpnAdministracionComponent,
          ),
      },
      {
        path: 'dashboard',
        canActivate: [moduloGuard('aprobar-vpn', { write: true })],
        loadComponent: () =>
          import('./vpn-dashboard.component').then(
            (m) => m.VpnDashboardComponent,
          ),
      },
    ],
  },
];
