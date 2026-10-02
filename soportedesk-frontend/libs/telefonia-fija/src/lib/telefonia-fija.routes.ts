import { Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';

export const telefoniaFijaRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inventario' },
  {
    path: 'inventario',
    canActivate: [moduloGuard('telefonia-fija')],
    loadComponent: () => import('./telefonia-fija-inventario-page.component')
      .then((m) => m.TelefoniaFijaInventarioPageComponent),
  },
  {
    path: 'asignacion-anexos',
    canActivate: [moduloGuard('telefonia-fija')],
    loadComponent: () => import('./asignaciones-anexo-page.component')
      .then((m) => m.AsignacionesAnexoPageComponent),
  },
];
