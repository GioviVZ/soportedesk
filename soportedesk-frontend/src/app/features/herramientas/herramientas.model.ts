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
