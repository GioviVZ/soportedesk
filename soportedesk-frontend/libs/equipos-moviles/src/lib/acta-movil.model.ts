import { Dependencia } from '@soportedesk/core';
import { EquipoMovil } from './equipo-movil.model';

export type TipoActaMovil = 'Entrega' | 'Devolución' | 'Transferencia';

export interface ActaMovil {
  id: number;
  numeroActa: string;
  tipo: TipoActaMovil;
  fecha: string;
  personaNombre: string;
  personaDni: string | null;
  dependencia: Dependencia | null;
  equipos: EquipoMovil[];
  observaciones: string | null;
  archivoNombre: string | null;
  archivoContentType: string | null;
  archivoTamano: number | null;
  tieneArchivo: boolean;
}

export interface ActaMovilRequest {
  numeroActa: string;
  tipo: TipoActaMovil;
  fecha: string;
  personaNombre: string;
  personaDni: string;
  dependenciaId: number | null;
  equipoMovilIds: number[];
  observaciones: string;
}

export interface ActaMovilResumen {
  total: number;
  entregas: number;
  devoluciones: number;
  transferencias: number;
}
