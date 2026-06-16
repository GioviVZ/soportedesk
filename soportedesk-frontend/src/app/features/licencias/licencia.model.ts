export interface Licencia {
  id: number;
  cantidad: number;
  licencia: string;
  correo: string;
  clave: string;
  ordenCompra: string;
  anio: string;
}

export type LicenciaRequest = Omit<Licencia, 'id'>;
