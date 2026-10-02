import { Dependencia } from '@soportedesk/core';
import { EquipoMovil } from './equipo-movil.model';

export type OperadorMovil = 'Claro' | 'Movistar' | 'Entel' | 'Bitel' | 'Otro';
export type EstadoAsignacionMovil = 'Activa' | 'Finalizada';

export interface AsignacionNumeroMovil {
  id: number;
  equipoMovil: EquipoMovil;
  numero: string;
  operador: OperadorMovil;
  plan: string | null;
  simIccid: string | null;
  personaNombre: string;
  personaDni: string | null;
  dependencia: Dependencia | null;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoAsignacionMovil;
  observaciones: string | null;
}

export interface AsignacionNumeroMovilRequest {
  equipoMovilId: number;
  numero: string;
  operador: OperadorMovil;
  plan: string;
  simIccid: string;
  personaNombre: string;
  personaDni: string;
  dependenciaId: number | null;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoAsignacionMovil;
  observaciones: string;
}

export interface AsignacionNumeroMovilResumen {
  total: number;
  activas: number;
  finalizadas: number;
  operadores: number;
}
