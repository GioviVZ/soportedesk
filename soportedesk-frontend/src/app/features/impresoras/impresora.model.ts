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
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
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
