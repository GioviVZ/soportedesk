export interface Impresora {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  ip: string;
  sede: { id: number; nombre: string } | null;
  dependencia: { id: number; nombre: string } | null;
  subdependencia: { id: number; nombre: string } | null;
  estado: string;
  modeloTonerNegro: string | null;
  modeloTonerC: string | null;
  modeloTonerM: string | null;
  modeloTonerY: string | null;
  modeloCartucho: string | null;
  modeloDrum: string | null;
  modeloFusor: string | null;
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
}

export interface ImpresoraRequest {
  nombre: string;
  marca: string;
  modelo: string;
  ip: string;
  sedeId: number | null;
  dependenciaId: number | null;
  subdependenciaId: number | null;
  estado: string;
  modeloTonerNegro: string;
  modeloTonerC: string;
  modeloTonerM: string;
  modeloTonerY: string;
  modeloCartucho: string;
  modeloDrum: string;
  modeloFusor: string;
}
