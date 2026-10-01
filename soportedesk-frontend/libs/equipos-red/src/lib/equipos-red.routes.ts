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

export const equiposRedRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'switches' },
  placeholder('switches', {
    eyebrow: 'Inventario de Equipos · Equipos de Conexión de Red',
    titulo: 'Switches',
    descripcion:
      'Inventario de switches por sede, con IP, MAC y ubicación del gabinete.',
    icono: 'ti-server-2',
    acento: '--color-equipos',
  }),
  placeholder('routers', {
    eyebrow: 'Inventario de Equipos · Equipos de Conexión de Red',
    titulo: 'Routers',
    descripcion: 'Inventario de routers y enlaces de salida por sede.',
    icono: 'ti-router',
    acento: '--color-equipos',
  }),
  placeholder('access-points', {
    eyebrow: 'Inventario de Equipos · Equipos de Conexión de Red',
    titulo: 'Access Points',
    descripcion:
      'Puntos de acceso inalámbrico, su ubicación y configuración de red.',
    icono: 'ti-access-point',
    acento: '--color-equipos',
  }),
  placeholder('radioenlaces', {
    eyebrow: 'Inventario de Equipos · Equipos de Conexión de Red',
    titulo: 'Radioenlaces',
    descripcion: 'Enlaces punto a punto entre sedes y sus equipos asociados.',
    icono: 'ti-antenna',
    acento: '--color-equipos',
  }),
];
