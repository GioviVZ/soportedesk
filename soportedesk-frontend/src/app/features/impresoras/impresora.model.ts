export interface Impresora {
  id: number;
  nombre: string;
  marca: string;
  modelo: string;
  tipoImpresora: { id: number; nombre: string } | null;
  serie: string | null;
  codigoInventario: string | null;
  codigoPatrimonial: string | null;
  tipoConexion: string;
  ip: string;
  sede: { id: number; nombre: string } | null;
  dependencia: { id: number; nombre: string } | null;
  subdependencia: { id: number; nombre: string } | null;
  estado: string;
  modeloTonerNegro: string | null;
  modeloTonerC: string | null;
  modeloTonerM: string | null;
  modeloTonerY: string | null;
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
}

export interface ImpresoraRequest {
  nombre: string;
  marca: string;
  modelo: string;
  tipoImpresoraId: number | null;
  serie: string;
  codigoInventario: string;
  codigoPatrimonial: string;
  tipoConexion: string;
  ip: string;
  sedeId: number | null;
  dependenciaId: number | null;
  subdependenciaId: number | null;
  estado: string;
  modeloTonerNegro: string;
  modeloTonerC: string;
  modeloTonerM: string;
  modeloTonerY: string;
}
