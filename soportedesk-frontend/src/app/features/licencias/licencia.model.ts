import { TipoBien, TipoLicencia } from '../../core/models/catalogo.model';

export interface Licencia {
  id: number;
  tipoLicencia: TipoLicencia;
  tipoBien: TipoBien;
  descripcion: string;
  cuentaActivacion?: string;
  claveActivacion?: string;
  activaciones?: LicenciaActivacion[];
  serialActivacion?: string;
  ordenCompra: string;
  anio: string;
  cantidad: number;
}

export interface LicenciaActivacion {
  id?: number;
  cuentaActivacion: string;
  claveActivacion: string;
}

export interface LicenciaRequest {
  tipoLicenciaId: number;
  tipoBienId: number;
  descripcion: string;
  cuentaActivacion?: string;
  claveActivacion?: string;
  activaciones?: LicenciaActivacion[];
  serialActivacion?: string;
  ordenCompra: string;
  anio: string;
  cantidad: number;
}
