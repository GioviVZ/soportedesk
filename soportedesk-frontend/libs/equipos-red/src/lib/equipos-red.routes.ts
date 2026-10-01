import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';

export const equiposRedRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'switches' },
  {
    path: 'switches',
    canActivate: [moduloGuard('equipos-red')],
    data: { tipo: 'SWITCH' },
    loadComponent: () => import('./equipos-red-page.component').then((m) => m.EquiposRedPageComponent),
  },
  {
    path: 'routers',
    canActivate: [moduloGuard('equipos-red')],
    data: { tipo: 'ROUTER' },
    loadComponent: () => import('./equipos-red-page.component').then((m) => m.EquiposRedPageComponent),
  },
  {
    path: 'access-points',
    canActivate: [moduloGuard('equipos-red')],
    data: { tipo: 'ACCESS_POINT' },
    loadComponent: () => import('./equipos-red-page.component').then((m) => m.EquiposRedPageComponent),
  },
  {
    path: 'radioenlaces',
    canActivate: [moduloGuard('equipos-red')],
    data: { tipo: 'RADIOENLACE' },
    loadComponent: () => import('./equipos-red-page.component').then((m) => m.EquiposRedPageComponent),
  },
];
