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
