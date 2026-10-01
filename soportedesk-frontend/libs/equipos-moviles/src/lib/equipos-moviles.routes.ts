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

export const equiposMovilesRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inventario' },
  placeholder('inventario', {
    eyebrow: 'Inventario de Equipos · Equipos Móviles',
    titulo: 'Inventario',
    descripcion:
      'Smartphones, tablets y módems institucionales con IMEI y códigos patrimoniales.',
    icono: 'ti-device-mobile',
    acento: '--color-equipos',
  }),
  placeholder('asignacion-numero', {
    eyebrow: 'Inventario de Equipos · Equipos Móviles',
    titulo: 'Asignación de número',
    descripcion: 'Líneas móviles asignadas a cada equipo y responsable.',
    icono: 'ti-device-sim',
    acento: '--color-equipos',
  }),
  placeholder('actas', {
    eyebrow: 'Inventario de Equipos · Equipos Móviles',
    titulo: 'Actas',
    descripcion:
      'Actas de entrega, devolución y transferencia de equipos móviles.',
    icono: 'ti-file-text',
    acento: '--color-equipos',
  }),
];
