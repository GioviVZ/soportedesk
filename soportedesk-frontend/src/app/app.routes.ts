import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'licencias',
        loadComponent: () =>
          import('./features/licencias/licencias-list.component').then((m) => m.LicenciasListComponent),
      },
      {
        path: 'wifi',
        loadComponent: () =>
          import('./features/wifi/wifi-list.component').then((m) => m.WifiListComponent),
      },
      {
        path: 'equipos',
        loadComponent: () =>
          import('./features/equipos/equipos-list.component').then((m) => m.EquiposListComponent),
      },
      {
        path: 'vpn',
        loadComponent: () =>
          import('./features/vpn/vpn-list.component').then((m) => m.VpnListComponent),
      },
      {
        path: 'correos',
        loadComponent: () =>
          import('./features/correos/correos-list.component').then((m) => m.CorreosListComponent),
      },
      {
        path: 'usuarios-red',
        loadComponent: () =>
          import('./features/usuarios-red/usuarios-red-list.component').then(
            (m) => m.UsuariosRedListComponent,
          ),
      },
      {
        path: 'impresoras',
        loadComponent: () =>
          import('./features/impresoras/impresoras-list.component').then(
            (m) => m.ImpresorasListComponent,
          ),
      },
      {
        path: 'catalogos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/catalogos/catalogos.component').then((m) => m.CatalogosComponent),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
