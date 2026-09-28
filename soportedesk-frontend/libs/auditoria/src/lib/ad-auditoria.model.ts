export interface AdAuditoria {
  id: number;
  fechaRegistro: string;
  operadorUsuario: string;
  operadorNombre: string | null;
  usuarioAfectado: string;
  usuarioAfectadoDn: string | null;
  accion: string;
  resultado: string;
  mensaje: string | null;
  detalleError: string | null;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  recursoAfectado: string | null;
  endPoint: string | null;
  metodoHttp: string | null;
  ipOrigen: string | null;
  idTransaccion: string | null;
  duracionMs: number | null;
}

export interface AdAuditoriaFilters {
  usuarioAfectado?: string;
  accion?: string;
  resultado?: string;
  desde?: string;
  hasta?: string;
  limit?: number;
}
