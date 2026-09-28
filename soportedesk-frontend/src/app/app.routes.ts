import { Routes } from '@angular/router';
import { adminGuard, authGuard, moduloGuard } from '@soportedesk/core';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('@soportedesk/auth').then((m) => m.authRoutes),
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
        loadChildren: () =>
          import('@soportedesk/dashboard').then((m) => m.dashboardRoutes),
      },
      {
        path: 'licencias',
        loadChildren: () =>
          import('@soportedesk/licencias').then((m) => m.licenciasRoutes),
      },
      {
        path: 'wifi',
        loadChildren: () =>
          import('@soportedesk/wifi').then((m) => m.wifiRoutes),
      },
      {
        path: 'equipos',
        loadChildren: () =>
          import('@soportedesk/equipos').then((m) => m.equiposRoutes),
      },
      {
        path: 'vpn',
        loadChildren: () =>
          import('@soportedesk/vpn').then((m) => m.vpnRoutes),
      },
      {
        path: 'correos',
        loadChildren: () =>
          import('@soportedesk/correos').then((m) => m.correosRoutes),
      },
      {
        path: 'usuarios-red',
        loadChildren: () =>
          import('@soportedesk/usuarios-red').then(
            (m) => m.usuariosRedRoutes,
          ),
      },
      {
        path: 'impresoras',
        loadChildren: () =>
          import('@soportedesk/impresoras').then((m) => m.impresorasRoutes),
      },
      {
        path: 'usuarios-sistema',
        canActivate: [adminGuard],
        loadChildren: () =>
          import('@soportedesk/usuarios-sistema').then(
            (m) => m.usuariosSistemaRoutes,
          ),
      },
      {
        path: 'auditoria',
        canActivate: [moduloGuard('auditoria')],
        loadChildren: () =>
          import('@soportedesk/auditoria').then((m) => m.auditoriaRoutes),
      },
      {
        path: 'herramientas',
        canActivate: [moduloGuard('herramientas')],
        loadChildren: () =>
          import('@soportedesk/herramientas').then(
            (m) => m.herramientasRoutes,
          ),
      },
      {
        path: 'catalogos',
        canActivate: [moduloGuard('catalogos')],
        loadChildren: () =>
          import('@soportedesk/catalogos').then((m) => m.catalogosRoutes),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
