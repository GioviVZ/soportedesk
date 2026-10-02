import { Dependencia } from '@soportedesk/core';
import { TelefonoFijo } from './telefono-fijo.model';

export type EstadoAsignacionAnexo = 'Activa' | 'Finalizada';

export interface AsignacionAnexo {
  id: number;
  telefonoFijo: TelefonoFijo;
  anexo: string;
  numeroDirecto: string | null;
  personaNombre: string;
  personaDni: string | null;
  dependencia: Dependencia | null;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoAsignacionAnexo;
  observaciones: string | null;
}

export interface AsignacionAnexoRequest {
  telefonoFijoId: number;
  anexo: string;
  numeroDirecto: string;
  personaNombre: string;
  personaDni: string;
  dependenciaId: number | null;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoAsignacionAnexo;
  observaciones: string;
}

export interface AsignacionAnexoResumen {
  total: number;
  activas: number;
  finalizadas: number;
  sedes: number;
}
