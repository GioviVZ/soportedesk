import { Dependencia, Sede, Subdependencia, TipoContrato } from '../../core/models/catalogo.model';

export interface Correo {
  id: number;
  usuario: string;
  nombre: string;
  correo: string;
  estado: string;
  sede: Sede;
  dependencia: Dependencia;
  subdependencia: Subdependencia;
  tipoContrato: TipoContrato;
  fechaFinContrato: string | null;
  creado: string;
}

export interface CorreoRequest {
  usuario: string;
  nombre: string;
  correo: string;
  estado: string;
  sedeId: number;
  dependenciaId: number;
  subdependenciaId: number;
  tipoContratoId: number;
  fechaFinContrato: string | null;
}
