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
  diasTranscurridos: number;
  hitos: OrdenServicioHito[];
  finalizada: boolean;
  registradoPor: string;
  fechaRegistro: string;
}

export interface OrdenServicioHito {
  id: number;
  nombre: string;
  diaPlazo: number;
  fechaVencimiento: string;
  diasRestantes: number;
  completado: boolean;
  fechaCompletado: string | null;
}

export interface OrdenServicioHitoRequest {
  id?: number;
  nombre: string;
  diaPlazo: number;
}

export interface OrdenServicioRequest {
  numeroOrden: string;
  descripcion: string;
  proveedor?: string;
  fechaInicio: string;
  plazoDias: number;
  hitos: OrdenServicioHitoRequest[];
}

export type MonitorPingEstado = 'ACTIVO' | 'PAUSADO' | 'ARCHIVADO';
export type MonitorPingSalud = 'PENDIENTE' | 'DISPONIBLE' | 'LATENCIA_ALTA' | 'SIN_RESPUESTA' | 'PAUSADO' | 'ARCHIVADO';

export interface MonitorPing {
  id: number;
  nombre: string;
  host: string;
  intervaloSegundos: number;
  estado: MonitorPingEstado;
  salud: MonitorPingSalud;
  creadoPor: string;
  actualizadoPor: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  ultimaMedicion: string | null;
  proximaMedicion: string | null;
  ultimaDisponible: boolean | null;
  ultimaLatenciaMs: number | null;
  fallosConsecutivos: number;
  totalMuestras: number;
  totalFallidas: number;
  perdidaPorcentaje: number;
}

export interface MonitorPingRequest {
  nombre: string;
  host: string;
  intervaloSegundos: number;
}

export interface MonitorPingPunto {
  fecha: string;
  latenciaPromedioMs: number | null;
  latenciaMinimaMs: number | null;
  latenciaMaximaMs: number | null;
  disponibilidadPorcentaje: number;
  muestras: number;
  disponibles: number;
}

export interface MonitorPingEstadisticas {
  muestras: number;
  disponibles: number;
  latenciaPromedioMs: number | null;
  latenciaMinimaMs: number | null;
  latenciaMaximaMs: number | null;
  disponibilidadPorcentaje: number;
  perdidaPorcentaje: number;
}

export interface MonitorPingHistorial {
  monitorId: number;
  desde: string;
  hasta: string;
  resolucion: 'DETALLE' | 'HORARIA';
  puntos: MonitorPingPunto[];
  estadisticas: MonitorPingEstadisticas;
}

export interface MonitorPingEvent {
  monitorId: number;
  fecha: string;
  disponible: boolean;
  latenciaMs: number | null;
  salud: MonitorPingSalud;
  totalMuestras: number;
  totalFallidas: number;
  perdidaPorcentaje: number;
}
