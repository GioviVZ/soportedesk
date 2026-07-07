export interface Vpn {
  id: number;
  usuarioRed: { id: number; nombre: string; usuario: string } | null;
  equipo: { id: number; marca: string; modelo: string; tipo: string; host: string | null; ip: string | null } | null;
  ipAsignada: string | null;
  vence: string | null;
  estado: string;
  tieneAntivirus: boolean | null;
  vencimientoAntivirus: string | null;
  usuarioVpn: string | null;
  credencialVpn: string | null;
  estadoSolicitud: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';
  tipoEquipo: 'INIA' | 'PERSONAL' | null;
  glpiComputerId: number | null;
  glpiNombreEquipo: string | null;
  glpiIpEquipo: string | null;
  antivirusVerificado: boolean | null;
  analisisAntivirusRealizado: boolean | null;
  hostActualizado: boolean | null;
  comentarioResponsable: string | null;
  solicitadoPor: string;
  solicitadoPorNombre: string | null;
  fechaSolicitud: string;
  aprobadoPor: string | null;
  aprobadoPorNombre: string | null;
  fechaResolucion: string | null;
}

export interface VpnSolicitudRequest {
  usuarioRedId: number;
  tipoEquipo: 'INIA' | 'PERSONAL';
  glpiComputerId: number | null;
  antivirusVerificado: boolean;
  analisisAntivirusRealizado: boolean;
  hostActualizado: boolean | null;
}

export interface VpnAprobarRequest {
  usuarioVpn: string;
  credencialVpn: string;
  ipAsignada: string;
  vence: string | null;
  estado: string;
}

export interface VpnResolucionRequest {
  comentarioResponsable: string;
}

export interface VpnAntivirusRequest {
  tieneAntivirus: boolean | null;
  vencimientoAntivirus: string | null;
}
