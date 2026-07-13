export interface UsuarioRedContrato {
  id: number;
  usuario: string;
  tipoContratoId: number;
  tipoContratoNombre: string;
  fechaInicio: string;
  fechaFin: string | null;
  numeroContrato: string | null;
  personalNombre: string | null;
  personalApellidos: string | null;
  registradoPor: string | null;
  fechaRegistro: string | null;
  actualizadoPor: string | null;
  fechaActualizacion: string | null;
}

export interface UsuarioRedContratoRequest {
  usuario: string;
  tipoContratoId: number;
  fechaInicio: string;
  fechaFin: string | null;
  numeroContrato: string | null;
  personalNombre: string | null;
  personalApellidos: string | null;
}

export interface UsuarioRedConsultaResultado {
  usuario: string | null;
  displayName: string | null;
  mail: string | null;
  office: string | null;
  organizationalUnit: string | null;
  enabled: boolean | null;
  locked: boolean | null;
  vencimientoUsuarioRed: string | null;
  estadoVencimientoUsuarioRed: 'VENCIDO' | 'POR_VENCER' | 'VIGENTE' | 'SIN_FECHA' | null;
  contratos: UsuarioRedContrato[];
}

export function esTipoContratoOs(tipoContratoNombre: string | null | undefined): boolean {
  return (tipoContratoNombre ?? '').trim().toLowerCase() === 'os';
}
