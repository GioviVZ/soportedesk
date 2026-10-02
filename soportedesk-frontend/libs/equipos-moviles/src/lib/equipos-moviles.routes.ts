import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';

export const equiposMovilesRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inventario' },
  {
    path: 'inventario',
    canActivate: [moduloGuard('equipos-moviles')],
    loadComponent: () => import('./equipos-moviles-inventario-page.component')
      .then((m) => m.EquiposMovilesInventarioPageComponent),
  },
  {
    path: 'asignacion-numero',
    canActivate: [moduloGuard('equipos-moviles')],
    loadComponent: () => import('./asignaciones-numero-movil-page.component')
      .then((m) => m.AsignacionesNumeroMovilPageComponent),
  },
  {
    path: 'actas',
    canActivate: [moduloGuard('equipos-moviles')],
    loadComponent: () => import('./actas-moviles-page.component')
      .then((m) => m.ActasMovilesPageComponent),
  },
];
