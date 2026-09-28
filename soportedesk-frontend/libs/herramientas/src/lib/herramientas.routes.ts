import { Routes } from '@angular/router';

export const herramientasRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./herramientas.component').then((m) => m.HerramientasComponent),
  },
];
