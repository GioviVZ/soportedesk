export interface Impresora {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  ip: string;
  piso: string;
  area: string;
  estado: string;
  tonerNegro: number;
  tonerC: number;
  tonerM: number;
  tonerY: number;
  cartucho: number;
  drum: number;
  fusor: number;
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
}

export type ImpresoraRequest = Omit<
  Impresora,
  'id' | 'driverNombre' | 'driverVersion' | 'driverSo' | 'driverArchivoPath'
>;
