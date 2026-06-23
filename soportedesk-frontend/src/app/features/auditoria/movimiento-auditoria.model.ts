export interface MovimientoAuditoria {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  modulo: string;
  metodo: string;
  ruta: string;
  entidadId: string | null;
  estadoHttp: number | null;
  ip: string | null;
  detalle: string | null;
}

export interface MovimientoAuditoriaFilters {
  modulo?: string;
  accion?: string;
  search?: string;
  desde?: string;
  hasta?: string;
  limit?: number;
}
