import { Routes } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const dashboardRoutes: Routes = [
  {
    path: '',
    providers: [provideCharts(withDefaultRegisterables())],
    loadComponent: () =>
      import('./dashboard.component').then((m) => m.DashboardComponent),
  },
];
