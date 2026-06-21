import { TipoBien, TipoLicencia } from '../../core/models/catalogo.model';

export interface Licencia {
  id: number;
  tipoLicencia: TipoLicencia;
  tipoBien: TipoBien;
  descripcion: string;
  cuentaActivacion?: string;
  claveActivacion?: string;
  serialActivacion?: string;
  ordenCompra: string;
  anio: string;
  cantidad: number;
}

export interface LicenciaRequest {
  tipoLicenciaId: number;
  tipoBienId: number;
  descripcion: string;
  cuentaActivacion?: string;
  claveActivacion?: string;
  serialActivacion?: string;
  ordenCompra: string;
  anio: string;
  cantidad: number;
}
