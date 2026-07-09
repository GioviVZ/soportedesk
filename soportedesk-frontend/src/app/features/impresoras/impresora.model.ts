import { BadgeTone } from '../../shared/status-badge/status-badge.component';
import { ModeloImpresora } from '../../core/models/catalogo.model';

export interface Impresora {
  id: number;
  modeloImpresora: ModeloImpresora;
  tipoImpresora: { id: number; nombre: string } | null;
  serie: string | null;
  codigoInventario: string | null;
  codigoPatrimonial: string | null;
  tipoConexion: string;
  ip: string;
  sede: { id: number; nombre: string } | null;
  dependencia: { id: number; nombre: string } | null;
  subdependencia: { id: number; nombre: string } | null;
  estado: string;
}

export interface ImpresoraRequest {
  modeloImpresoraId: number | null;
  tipoImpresoraId: number | null;
  serie: string;
  codigoInventario: string;
  codigoPatrimonial: string;
  tipoConexion: string;
  ip: string;
  sedeId: number | null;
  dependenciaId: number | null;
  subdependenciaId: number | null;
  estado: string;
}

export const IMPRESORA_ESTADOS: { value: string; tone: BadgeTone }[] = [
  { value: 'Activa', tone: 'success' },
  { value: 'En mantenimiento', tone: 'warning' },
  { value: 'De baja', tone: 'danger' },
];

export function impresoraEstadoTone(estado: string): BadgeTone {
  return IMPRESORA_ESTADOS.find((item) => item.value === estado)?.tone ?? 'neutral';
}

export interface ImpresoraMarcaCount {
  marca: string;
  total: number;
}

export interface ImpresoraSedeCount {
  sede: string;
  total: number;
}

export interface ImpresoraConsumibleCount {
  color: string;
  variante: string;
  codigo: string;
  cantidad: number;
}

export interface ImpresoraDashboardCompleto {
  total: number;
  activas: number;
  enMantenimiento: number;
  deBaja: number;
  distribucionPorMarca: ImpresoraMarcaCount[];
  distribucionPorSede: ImpresoraSedeCount[];
  topConsumibles: ImpresoraConsumibleCount[];
  totalConsumiblesDistintos: number;
}
