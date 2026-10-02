import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { BadgeTone } from '@soportedesk/ui';
import { EstadoEquipoMovil, TipoEquipoMovil } from './equipo-movil.model';

export const MAC_PATTERN = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/;
export const NUMERO_MOVIL_PATTERN = /^9\d{8}$/;
export const DNI_PATTERN = /^\d{8}$/;
export const ICCID_PATTERN = /^\d{19,20}$/;

export const EQUIPO_MOVIL_ESTADOS: { value: EstadoEquipoMovil; tone: BadgeTone }[] = [
  { value: 'Operativo', tone: 'success' },
  { value: 'En revisión', tone: 'warning' },
  { value: 'Inactivo', tone: 'neutral' },
  { value: 'De baja', tone: 'danger' },
];

export const TIPO_EQUIPO_MOVIL_LABEL: Record<TipoEquipoMovil, string> = {
  SMARTPHONE: 'Smartphone',
  TABLET: 'Tablet',
  MODEM: 'Módem',
};

export function equipoMovilEstadoTone(estado: EstadoEquipoMovil): BadgeTone {
  return EQUIPO_MOVIL_ESTADOS.find((item) => item.value === estado)?.tone ?? 'neutral';
}

export function asignacionEstadoTone(estado: string): BadgeTone {
  return estado === 'Activa' ? 'success' : 'neutral';
}

export function imeiLuhnValid(value: string): boolean {
  if (!/^\d{15}$/.test(value)) return false;
  let sum = 0;
  for (let index = 0; index < value.length; index += 1) {
    let digit = Number(value[index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export const imeiValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  return !value || imeiLuhnValid(value) ? null : { imei: true };
};

export const imeisDistintosValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const imei1 = String(control.get('imei1')?.value ?? '').trim();
  const imei2 = String(control.get('imei2')?.value ?? '').trim();
  return imei1 && imei2 && imei1 === imei2 ? { imeisIguales: true } : null;
};

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function formatMobileNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 9
    ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    : value;
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

export function equipoIdentifier(equipo: EquipoMovilLike): string {
  return equipo.codigoInventario || equipo.codigoPatrimonial || equipo.serie || 'Sin código';
}

interface EquipoMovilLike {
  codigoInventario: string | null;
  codigoPatrimonial: string | null;
  serie: string | null;
}
