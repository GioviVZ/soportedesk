import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { moduloGuard } from './core/auth/modulo.guard';
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
        canActivate: [moduloGuard('licencias')],
        loadComponent: () =>
          import('./features/licencias/licencias-list.component').then((m) => m.LicenciasListComponent),
      },
      {
        path: 'wifi',
        canActivate: [moduloGuard('wifi')],
        loadComponent: () =>
          import('./features/wifi/wifi-list.component').then((m) => m.WifiListComponent),
      },
      {
        path: 'equipos/:id',
        canActivate: [moduloGuard('equipos')],
        loadComponent: () =>
          import('./features/equipos/equipo-detail.component').then((m) => m.EquipoDetailComponent),
      },
      {
        path: 'equipos',
        canActivate: [moduloGuard('equipos')],
        loadComponent: () =>
          import('./features/equipos/equipos-list.component').then((m) => m.EquiposListComponent),
      },
      {
        path: 'vpn',
        canActivate: [moduloGuard('vpn')],
        loadComponent: () =>
          import('./features/vpn/vpn-list.component').then((m) => m.VpnListComponent),
      },
      {
        path: 'correos',
        canActivate: [moduloGuard('correos')],
        loadComponent: () =>
          import('./features/correos/correos-list.component').then((m) => m.CorreosListComponent),
      },
      {
        path: 'usuarios-red',
        canActivate: [moduloGuard('usuarios-red')],
        loadComponent: () =>
          import('./features/usuarios-red/usuarios-red-list.component').then(
            (m) => m.UsuariosRedListComponent,
          ),
      },
      {
        path: 'impresoras',
        canActivate: [moduloGuard('impresoras')],
        loadComponent: () =>
          import('./features/impresoras/impresoras-list.component').then(
            (m) => m.ImpresorasListComponent,
          ),
      },
      {
        path: 'usuarios-sistema',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/usuarios-sistema/usuarios-sistema.component').then(
            (m) => m.UsuariosSistemaComponent,
          ),
      },
      {
        path: 'auditoria',
        canActivate: [moduloGuard('auditoria')],
        loadComponent: () =>
          import('./features/auditoria/auditoria.component').then((m) => m.AuditoriaComponent),
      },
      {
        path: 'herramientas',
        canActivate: [moduloGuard('herramientas')],
        loadComponent: () =>
          import('./features/herramientas/herramientas.component').then(
            (m) => m.HerramientasComponent,
          ),
      },
      {
        path: 'inventario-equipos',
        canActivate: [moduloGuard('inventario-equipos')],
        loadComponent: () =>
          import('./features/inventario-equipos/inventario-equipos.component').then(
            (m) => m.InventarioEquiposComponent,
          ),
      },
      {
        path: 'catalogos',
        canActivate: [moduloGuard('catalogos')],
        loadComponent: () =>
          import('./features/catalogos/catalogos.component').then((m) => m.CatalogosComponent),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
