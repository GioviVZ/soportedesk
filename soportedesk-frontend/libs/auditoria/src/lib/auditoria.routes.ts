import { Routes } from '@angular/router';

export const auditoriaRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./auditoria.component').then((m) => m.AuditoriaComponent),
  },
];
