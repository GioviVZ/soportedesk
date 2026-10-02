import { Dependencia, Sede, Subdependencia } from '@soportedesk/core';

export type TipoTelefonoFijo = 'IP' | 'ANALOGICO' | 'INALAMBRICO';
export type EstadoTelefonoFijo = 'Operativo' | 'En revisión' | 'Inactivo' | 'De baja';

export interface TelefonoFijo {
  id: number;
  tipo: TipoTelefonoFijo;
  sede: Sede | null;
  dependencia: Dependencia | null;
  subdependencia: Subdependencia | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  edificio: string | null;
  piso: string | null;
  marca: string;
  modelo: string;
  serie: string | null;
  mac: string | null;
  ip: string | null;
  host: string | null;
  codigoPatrimonial: string | null;
  codigoInventario: string | null;
  estado: EstadoTelefonoFijo;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TelefonoFijoRequest {
  tipo: TipoTelefonoFijo;
  sedeId: number | null;
  dependenciaId: number | null;
  subdependenciaId: number | null;
  referencia: string;
  latitud: number | null;
  longitud: number | null;
  edificio: string;
  piso: string;
  marca: string;
  modelo: string;
  serie: string;
  mac: string;
  ip: string;
  host: string;
  codigoPatrimonial: string;
  codigoInventario: string;
  estado: EstadoTelefonoFijo;
  observaciones: string;
}

export interface TelefonoFijoResumen {
  total: number;
  operativos: number;
  enRevision: number;
  sinAsignar: number;
}
