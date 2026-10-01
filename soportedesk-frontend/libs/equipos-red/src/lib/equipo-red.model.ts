import { Dependencia, Sede, Subdependencia } from '@soportedesk/core';
import { BadgeTone } from '@soportedesk/ui';

export type TipoEquipoRed = 'SWITCH' | 'ROUTER' | 'ACCESS_POINT' | 'RADIOENLACE';
export type EstadoEquipoRed = 'Operativo' | 'En revisión' | 'Inactivo' | 'De baja';

export interface EquipoRed {
  id: number;
  tipo: TipoEquipoRed;
  sede: Sede | null;
  dependencia: Dependencia | null;
  subdependencia: Subdependencia | null;
  referencia: string | null;
  latitud: number | null;
  longitud: number | null;
  edificio: string | null;
  piso: string | null;
  gabinete: string | null;
  marca: string;
  modelo: string;
  serie: string | null;
  codigoPatrimonial: string | null;
  codigoInventario: string | null;
  etiqueta: string | null;
  mac: string | null;
  ip: string | null;
  ipPorDefecto: string | null;
  host: string | null;
  estado: EstadoEquipoRed;
  observaciones: string | null;
  remotoSede: Sede | null;
  remotoReferencia: string | null;
  frecuenciaGhz: number | null;
  anchoCanalMhz: number | null;
  ssidEnlace: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EquipoRedRequest {
  tipo: TipoEquipoRed;
  sedeId: number | null;
  dependenciaId: number | null;
  subdependenciaId: number | null;
  referencia: string;
  latitud: number | null;
  longitud: number | null;
  edificio: string;
  piso: string;
  gabinete: string;
  marca: string;
  modelo: string;
  serie: string;
  codigoPatrimonial: string;
  codigoInventario: string;
  etiqueta: string;
  mac: string;
  ip: string;
  ipPorDefecto: string;
  host: string;
  estado: EstadoEquipoRed;
  observaciones: string;
  remotoSedeId: number | null;
  remotoReferencia: string;
  frecuenciaGhz: number | null;
  anchoCanalMhz: number | null;
  ssidEnlace: string;
}

export interface EquipoRedResumen {
  total: number;
  operativos: number;
  enRevision: number;
  inactivos: number;
  deBaja: number;
  sedes: number;
}

export const EQUIPO_RED_ESTADOS: { value: EstadoEquipoRed; tone: BadgeTone }[] = [
  { value: 'Operativo', tone: 'success' },
  { value: 'En revisión', tone: 'warning' },
  { value: 'Inactivo', tone: 'neutral' },
  { value: 'De baja', tone: 'danger' },
];

export function equipoRedEstadoTone(estado: EstadoEquipoRed): BadgeTone {
  return EQUIPO_RED_ESTADOS.find((item) => item.value === estado)?.tone ?? 'neutral';
}

export const TIPO_EQUIPO_RED_META: Record<TipoEquipoRed, {
  label: string;
  plural: string;
  icon: string;
  nuevo: string;
}> = {
  SWITCH: { label: 'Switch', plural: 'Switches', icon: 'ti-server-2', nuevo: 'Nuevo switch' },
  ROUTER: { label: 'Router', plural: 'Routers', icon: 'ti-router', nuevo: 'Nuevo router' },
  ACCESS_POINT: {
    label: 'Access Point',
    plural: 'Access Points',
    icon: 'ti-access-point',
    nuevo: 'Nuevo access point',
  },
  RADIOENLACE: {
    label: 'Radioenlace',
    plural: 'Radioenlaces',
    icon: 'ti-antenna',
    nuevo: 'Nuevo radioenlace',
  },
};
