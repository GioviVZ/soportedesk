export interface PingResult {
  host: string;
  reachable: boolean;
  packetsSent?: number | null;
  packetsReceived?: number | null;
  packetsLost?: number | null;
  averageLatencyMs?: number | null;
  status: string;
  output: string[];
}

export interface EquipoDatosResult {
  host: string;
  ip: string;
  modelo: string;
  serie: string;
  fabricante: string;
  tipo: string;
  sede: string;
  usuarioContacto: string;
  fuente: string;
  capturadoEn: string;
}

export interface OrdenServicio {
  id: number;
  numeroOrden: string;
  descripcion: string;
  proveedor: string | null;
  fechaInicio: string;
  plazoDias: number;
  fechaVencimiento: string;
  diasRestantes: number;
  finalizada: boolean;
  registradoPor: string;
  fechaRegistro: string;
}

export interface OrdenServicioRequest {
  numeroOrden: string;
  descripcion: string;
  proveedor?: string;
  fechaInicio: string;
  plazoDias: number;
}
