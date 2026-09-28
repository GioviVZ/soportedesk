import { Routes } from '@angular/router';
import { adminGuard } from '@soportedesk/core';
import { authGuard } from '@soportedesk/core';
import { moduloGuard } from '@soportedesk/core';
import { vpnAdminGuard } from '@soportedesk/core';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('@soportedesk/auth').then((m) => m.LoginComponent),
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
          import('@soportedesk/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'licencias',
        loadComponent: () =>
        import('@soportedesk/licencias').then((m) => m.LicenciasShellComponent),
        children: [
          { path: '', redirectTo: 'consultas', pathMatch: 'full' },
          { path: 'consultas', canActivate: [moduloGuard('licencias')], data: { mode: 'consultas' }, loadComponent: () => import('@soportedesk/licencias').then((m) => m.LicenciasListComponent) },
          { path: 'administracion', canActivate: [moduloGuard('licencias', { write: true })], data: { mode: 'administracion' }, loadComponent: () => import('@soportedesk/licencias').then((m) => m.LicenciasListComponent) },
          { path: 'dashboard', canActivate: [moduloGuard('licencias', { write: true })], loadComponent: () => import('@soportedesk/licencias').then((m) => m.LicenciasDashboardComponent) },
        ],
      },
      {
        path: 'wifi',
        loadComponent: () =>
          import('@soportedesk/wifi').then((m) => m.WifiShellComponent),
        children: [
          { path: '', redirectTo: 'consultas', pathMatch: 'full' },
          { path: 'consultas', canActivate: [moduloGuard('wifi')], data: { mode: 'consultas' }, loadComponent: () => import('@soportedesk/wifi').then((m) => m.WifiListComponent) },
          { path: 'administracion', canActivate: [moduloGuard('wifi', { write: true })], data: { mode: 'administracion' }, loadComponent: () => import('@soportedesk/wifi').then((m) => m.WifiListComponent) },
          { path: 'dashboard', canActivate: [moduloGuard('wifi', { write: true })], loadComponent: () => import('@soportedesk/wifi').then((m) => m.WifiDashboardComponent) },
        ],
      },
      {
        path: 'equipos',
        loadComponent: () =>
          import('@soportedesk/equipos').then((m) => m.EquiposShellComponent),
        children: [
          { path: '', redirectTo: 'inventario', pathMatch: 'full' },
          {
            path: 'inventario',
            canActivate: [moduloGuard('equipos')],
            loadComponent: () =>
              import('@soportedesk/equipos').then((m) => m.EquiposInventarioComponent),
          },
          {
            path: 'mantenimiento',
            canActivate: [moduloGuard('equipos', { write: true })],
            loadComponent: () =>
              import('@soportedesk/equipos').then((m) => m.EquiposMantenimientoComponent),
          },
          {
            path: 'dashboard',
            canActivate: [moduloGuard('equipos', { write: true })],
            loadComponent: () =>
              import('@soportedesk/equipos').then((m) => m.EquiposDashboardComponent),
          },
        ],
      },
      {
        path: 'equipos/:id',
        canActivate: [moduloGuard('equipos')],
        loadComponent: () =>
          import('@soportedesk/equipos').then((m) => m.EquipoDetailComponent),
      },
      {
        path: 'vpn',
        loadComponent: () =>
          import('@soportedesk/vpn').then((m) => m.VpnShellComponent),
        children: [
          { path: '', redirectTo: 'registros', pathMatch: 'full' },
          {
            path: 'registros',
            canActivate: [moduloGuard('vpn')],
            loadComponent: () =>
              import('@soportedesk/vpn').then((m) => m.VpnRegistrosComponent),
          },
          {
            path: 'administracion',
            canActivate: [vpnAdminGuard],
            loadComponent: () =>
              import('@soportedesk/vpn').then((m) => m.VpnAdministracionComponent),
          },
          {
            path: 'dashboard',
            canActivate: [moduloGuard('aprobar-vpn', { write: true })],
            loadComponent: () =>
              import('@soportedesk/vpn').then((m) => m.VpnDashboardComponent),
          },
        ],
      },
      {
        path: 'correos',
        loadComponent: () =>
          import('@soportedesk/correos').then((m) => m.CorreosShellComponent),
        children: [
          { path: '', redirectTo: 'consultas', pathMatch: 'full' },
          {
            path: 'consultas',
            canActivate: [moduloGuard('correos')],
            loadComponent: () =>
              import('@soportedesk/correos').then((m) => m.CorreosConsultasComponent),
          },
          {
            path: 'dashboard',
            canActivate: [moduloGuard('correos')],
            loadComponent: () =>
              import('@soportedesk/correos').then((m) => m.CorreosDashboardComponent),
          },
        ],
      },
      {
        path: 'usuarios-red',
        loadComponent: () =>
          import('@soportedesk/usuarios-red').then(
            (m) => m.UsuariosRedShellComponent,
          ),
        children: [
          { path: '', redirectTo: 'consultas', pathMatch: 'full' },
          {
            path: 'consultas',
            canActivate: [moduloGuard('usuarios-red')],
            loadComponent: () =>
              import('@soportedesk/usuarios-red').then(
                (m) => m.UsuariosRedConsultasComponent,
              ),
          },
          {
            path: 'administracion',
            canActivate: [moduloGuard('usuarios-red', { write: true })],
            loadComponent: () =>
              import('@soportedesk/usuarios-red').then(
                (m) => m.UsuariosRedAdministracionComponent,
              ),
          },
          {
            path: 'dashboard',
            canActivate: [moduloGuard('usuarios-red', { write: true })],
            loadComponent: () =>
              import('@soportedesk/usuarios-red').then(
                (m) => m.UsuariosRedDashboardComponent,
              ),
          },
        ],
      },
      {
        path: 'impresoras',
        loadComponent: () =>
          import('@soportedesk/impresoras').then((m) => m.ImpresorasShellComponent),
        children: [
          { path: '', redirectTo: 'consultas', pathMatch: 'full' },
          {
            path: 'consultas',
            canActivate: [moduloGuard('impresoras')],
            loadComponent: () =>
              import('@soportedesk/impresoras').then((m) => m.ImpresorasConsultasComponent),
          },
          {
            path: 'administracion',
            canActivate: [moduloGuard('impresoras', { write: true })],
            loadComponent: () =>
              import('@soportedesk/impresoras').then((m) => m.ImpresorasAdministracionComponent),
          },
          {
            path: 'dashboard',
            canActivate: [moduloGuard('impresoras', { write: true })],
            loadComponent: () =>
              import('@soportedesk/impresoras').then((m) => m.ImpresorasDashboardComponent),
          },
        ],
      },
      {
        path: 'usuarios-sistema',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('@soportedesk/usuarios-sistema').then(
            (m) => m.UsuariosSistemaComponent,
          ),
      },
      {
        path: 'auditoria',
        canActivate: [moduloGuard('auditoria')],
        loadComponent: () =>
          import('@soportedesk/auditoria').then((m) => m.AuditoriaComponent),
      },
      {
        path: 'herramientas',
        canActivate: [moduloGuard('herramientas')],
        loadComponent: () =>
          import('@soportedesk/herramientas').then(
            (m) => m.HerramientasComponent,
          ),
      },
      {
        path: 'catalogos',
        canActivate: [moduloGuard('catalogos')],
        loadComponent: () =>
          import('@soportedesk/catalogos').then((m) => m.CatalogosComponent),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
