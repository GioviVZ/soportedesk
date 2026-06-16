import { Dependencia, Sede, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';

export interface UsuarioRed {
  id: number;
  usuario: string;
  nombre: string;
  grupo: string;
  ultimoLogin: string | null;
  estado: string;
  sede: Sede;
  dependencia: Dependencia;
  subdependencia: Subdependencia;
  tipoContrato: TipoContrato;
  fechaFinContrato: string | null;
}

export interface UsuarioRedRequest {
  usuario: string;
  nombre: string;
  grupo: string;
  estado: string;
  sedeId: number;
  dependenciaId: number;
  subdependenciaId: number;
  tipoContratoId: number;
  fechaFinContrato: string | null;
}
