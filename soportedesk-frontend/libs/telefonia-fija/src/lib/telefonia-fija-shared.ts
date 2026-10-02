import { BadgeTone } from '@soportedesk/ui';
import { EstadoTelefonoFijo, TipoTelefonoFijo } from './telefono-fijo.model';

export const MAC_PATTERN = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
export const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
export const ANEXO_PATTERN = /^\d{3,6}$/;
export const NUMERO_DIRECTO_PATTERN = /^\d{6,9}$/;
export const DNI_PATTERN = /^\d{8}$/;

export const TELEFONO_FIJO_ESTADOS: { value: EstadoTelefonoFijo; tone: BadgeTone }[] = [
  { value: 'Operativo', tone: 'success' },
  { value: 'En revisión', tone: 'warning' },
  { value: 'Inactivo', tone: 'neutral' },
  { value: 'De baja', tone: 'danger' },
];

export const TIPO_TELEFONO_FIJO_LABEL: Record<TipoTelefonoFijo, string> = {
  IP: 'Teléfono IP',
  ANALOGICO: 'Analógico',
  INALAMBRICO: 'Inalámbrico',
};

export function telefonoFijoEstadoTone(estado: EstadoTelefonoFijo): BadgeTone {
  return TELEFONO_FIJO_ESTADOS.find((item) => item.value === estado)?.tone ?? 'neutral';
}

export function asignacionEstadoTone(estado: string): BadgeTone {
  return estado === 'Activa' ? 'success' : 'neutral';
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function todayIso(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function exportDate(): string {
  return todayIso();
}

export function telefonoIdentifier(telefono: TelefonoFijoLike): string {
  return telefono.codigoInventario || telefono.codigoPatrimonial || telefono.serie || 'Sin código';
}

interface TelefonoFijoLike {
  codigoInventario: string | null;
  codigoPatrimonial: string | null;
  serie: string | null;
}
