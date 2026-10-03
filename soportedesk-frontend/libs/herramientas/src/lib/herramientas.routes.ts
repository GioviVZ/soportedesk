import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const herramientasRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
    loadComponent: () =>
      import('./herramientas.component').then((m) => m.HerramientasComponent),
  },
];
