import { Dependencia, Sede, Subdependencia } from '@soportedesk/core';

export type TipoEquipoMovil = 'SMARTPHONE' | 'TABLET' | 'MODEM';
export type EstadoEquipoMovil = 'Operativo' | 'En revisión' | 'Inactivo' | 'De baja';

export interface EquipoMovil {
  id: number;
  tipo: TipoEquipoMovil;
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
  imei1: string | null;
  imei2: string | null;
  mac: string | null;
  sistemaOperativo: string | null;
  almacenamiento: string | null;
  codigoPatrimonial: string | null;
  codigoInventario: string | null;
  estado: EstadoEquipoMovil;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EquipoMovilRequest {
  tipo: TipoEquipoMovil;
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
  imei1: string;
  imei2: string;
  mac: string;
  sistemaOperativo: string;
  almacenamiento: string;
  codigoPatrimonial: string;
  codigoInventario: string;
  estado: EstadoEquipoMovil;
  observaciones: string;
}

export interface EquipoMovilResumen {
  total: number;
  operativos: number;
  enRevision: number;
  sinAsignar: number;
}
