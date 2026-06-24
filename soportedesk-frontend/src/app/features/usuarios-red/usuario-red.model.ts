import { Dependencia, Sede, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';
import { BadgeTone } from '../../shared/status-badge/status-badge.component';

export interface UsuarioRed {
  id: number;
  usuario: string;
  nombre: string;
  apellidos: string;
  grupo: string;
  unidadOrganizativa: string | null;
  ultimoLogin: string | null;
  estado: string;
  sede: Sede;
  dependencia: Dependencia;
  subdependencia: Subdependencia;
  tipoContrato: TipoContrato;
  fechaFinContrato: string | null;
  fechaCreacion: string | null;
  numeroContrato: string | null;
}

export interface UsuarioRedRequest {
  usuario: string;
  nombre: string;
  apellidos: string;
  grupo: string;
  unidadOrganizativa: string | null;
  estado: string;
  sedeId: number;
  dependenciaId: number;
  subdependenciaId: number;
  tipoContratoId: number;
  fechaFinContrato: string | null;
  fechaCreacion: string | null;
  numeroContrato: string | null;
}

export const USUARIO_RED_ESTADOS: { value: string; tone: BadgeTone }[] = [
  { value: 'Activo', tone: 'success' },
  { value: 'Inactivo', tone: 'danger' },
];

export function usuarioRedEstadoTone(estado: string | null | undefined): BadgeTone {
  return USUARIO_RED_ESTADOS.find((e) => e.value === estado)?.tone ?? 'neutral';
}
