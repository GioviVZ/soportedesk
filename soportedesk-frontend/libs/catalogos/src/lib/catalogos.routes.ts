import { Routes } from '@angular/router';

export const catalogosRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./catalogos.component').then((m) => m.CatalogosComponent),
  },
];
