import { Routes } from '@angular/router';

export const usuariosSistemaRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./usuarios-sistema.component').then(
        (m) => m.UsuariosSistemaComponent,
      ),
  },
];
