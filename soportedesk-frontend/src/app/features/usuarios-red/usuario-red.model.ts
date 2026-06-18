import { Dependencia, Sede, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';

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
