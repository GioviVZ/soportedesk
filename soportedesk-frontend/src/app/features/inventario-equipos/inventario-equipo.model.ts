export type InventarioMatchEstado =
  | 'SIN_MATCH'
  | 'CANDIDATO'
  | 'MATCH_CONFIRMADO'
  | 'CONFLICTO'
  | 'IGNORADO';

export interface InventarioPrograma {
  id: number;
  nombre: string;
  version?: string | null;
  fabricante?: string | null;
  fechaInstalacion?: string | null;
}

export interface InventarioDisco {
  id: number;
  letra?: string | null;
  nombre?: string | null;
  tipo?: string | null;
  totalBytes?: number | null;
  libreBytes?: number | null;
}

export interface InventarioRed {
  id: number;
  descripcion?: string | null;
  macAddress?: string | null;
  ipAddresses: string[];
}

export interface InventarioEquipo {
  id: number;
  agentId?: string | null;
  hostname?: string | null;
  serialEquipo?: string | null;
  fabricante?: string | null;
  modelo?: string | null;
  dominio?: string | null;
  ou?: string | null;
  usuarioActual?: string | null;
  sistemaOperativo?: string | null;
  versionSistema?: string | null;
  arquitectura?: string | null;
  procesador?: string | null;
  ramTotalBytes?: number | null;
  ipPrincipal?: string | null;
  macPrincipal?: string | null;
  ultimoReporte?: string | null;
  ipReporte?: string | null;
  estadoAgente?: string | null;
  origen?: string | null;
  equipoRelacionadoId?: number | null;
  equipoRelacionadoLabel?: string | null;
  usuarioRedRelacionadoId?: number | null;
  usuarioRedRelacionadoLabel?: string | null;
  vpnRelacionadoId?: number | null;
  vpnRelacionadoLabel?: string | null;
  matchEstado: InventarioMatchEstado;
  matchScore?: number | null;
  matchNotas?: string | null;
  matchFecha?: string | null;
  programas: InventarioPrograma[];
  discos: InventarioDisco[];
  redes: InventarioRed[];
}

export interface InventarioMatchManualRequest {
  equipoId?: number | null;
  usuarioRedId?: number | null;
  vpnId?: number | null;
  confirmar?: boolean;
  ignorar?: boolean;
  notas?: string | null;
}

export function inventarioMatchLabel(estado?: string | null): string {
  const labels: Record<string, string> = {
    SIN_MATCH: 'Sin match',
    CANDIDATO: 'Candidato',
    MATCH_CONFIRMADO: 'Confirmado',
    CONFLICTO: 'Conflicto',
    IGNORADO: 'Ignorado',
  };
  return labels[estado ?? ''] ?? 'Sin match';
}

export function inventarioMatchTone(estado?: string | null): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (estado) {
    case 'MATCH_CONFIRMADO':
      return 'success';
    case 'CANDIDATO':
      return 'info';
    case 'CONFLICTO':
      return 'danger';
    case 'IGNORADO':
      return 'warning';
    default:
      return 'neutral';
  }
}
