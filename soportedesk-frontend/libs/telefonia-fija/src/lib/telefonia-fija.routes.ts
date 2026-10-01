import { Route, Routes } from '@angular/router';
import { moduloGuard } from '@soportedesk/core';
import type { ModulePlaceholderData } from '@soportedesk/ui';

function placeholder(path: string, data: ModulePlaceholderData): Route {
  return {
    path,
    canActivate: [moduloGuard('equipos')],
    data,
    loadComponent: () =>
      import('@soportedesk/ui').then((m) => m.ModulePlaceholderComponent),
  };
}

export const telefoniaFijaRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inventario' },
  placeholder('inventario', {
    eyebrow: 'Inventario de Equipos · Equipos de Telefonía Fija',
    titulo: 'Inventario',
    descripcion: 'Teléfonos IP, analógicos e inalámbricos por sede.',
    icono: 'ti-phone',
    acento: '--color-equipos',
  }),
  placeholder('asignacion-anexos', {
    eyebrow: 'Inventario de Equipos · Equipos de Telefonía Fija',
    titulo: 'Asignación de anexos',
    descripcion: 'Anexos y números asignados a cada equipo y responsable.',
    icono: 'ti-phone-call',
    acento: '--color-equipos',
  }),
];
