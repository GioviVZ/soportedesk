import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const equiposRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'computadoras' },
  { path: 'inventario', pathMatch: 'full', redirectTo: 'computadoras/inventario' },
  { path: 'mantenimiento', pathMatch: 'full', redirectTo: 'computadoras/mantenimiento' },
  { path: 'dashboard', pathMatch: 'full', redirectTo: 'computadoras/dashboard' },
  {
    path: 'computadoras',
    providers: [provideCharts(withDefaultRegisterables())],
    loadComponent: () =>
      import('./equipos-shell.component').then((m) => m.EquiposShellComponent),
    children: [
      { path: '', redirectTo: 'inventario', pathMatch: 'full' },
      {
        path: 'inventario',
        canActivate: [moduloGuard('equipos')],
        loadComponent: () =>
          import('./equipos-inventario.component').then(
            (m) => m.EquiposInventarioComponent,
          ),
      },
      {
        path: 'mantenimiento',
        canActivate: [moduloGuard('equipos', { write: true })],
        loadComponent: () =>
          import('./equipos-mantenimiento.component').then(
            (m) => m.EquiposMantenimientoComponent,
          ),
      },
      {
        path: 'dashboard',
        canActivate: [moduloGuard('equipos', { write: true })],
        loadComponent: () =>
          import('./equipos-dashboard.component').then(
            (m) => m.EquiposDashboardComponent,
          ),
      },
    ],
  },
  {
    path: ':id',
    canActivate: [moduloGuard('equipos')],
    loadComponent: () =>
      import('./equipo-detail.component').then((m) => m.EquipoDetailComponent),
  },
];
