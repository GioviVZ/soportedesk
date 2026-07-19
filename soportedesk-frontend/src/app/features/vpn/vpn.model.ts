export interface Vpn {
  id: number;
  usuarioRed: { id: number; nombre: string; usuario: string } | null;
  adSamAccountName: string | null;
  adDisplayName: string | null;
  adMail: string | null;
  adOffice: string | null;
  adOrganizationalUnit: string | null;
  equipo: { id: number; marca: string; modelo: string; tipo: string; host: string | null; ip: string | null } | null;
  vence: string | null;
  vencimientoBaseVpn: string | null;
  vencimientoContrato: string | null;
  venceOrigen: 'CONTRATO' | 'INSTITUCIONAL' | 'ANTIVIRUS_PERSONAL' | null;
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
  sistemaOperativoActualizado: boolean | null;
  forticlientInstalado: boolean | null;
  hostActualizado: boolean | null;
  comentarioResponsable: string | null;
  solicitadoPor: string;
  solicitadoPorNombre: string | null;
  fechaSolicitud: string;
  aprobadoPor: string | null;
  aprobadoPorNombre: string | null;
  fechaResolucion: string | null;
  titularTipo: 'AD' | 'EXTERNO';
  titularNombre: string | null;
  titularApellidos: string | null;
  titularCorreo: string | null;
  titularEmpresa: string | null;
  titularMotivo: string | null;
  titularCargo: string;
  titularNombreCompleto: string;
  titularOrigenLabel: string;
}

export const CARGOS_VPN = [
  'Director',
  'Secretaria',
  'Profesional',
  'Gerente',
  'Presidente Ejecutivo',
  'Practicante',
] as const;

export const CARGOS_VPN_EXTERNO = [
  'Secretaria',
  'Profesional',
  'Otros',
] as const;

export interface VpnSolicitudRequest {
  usuarioRedSamAccountName: string | null;
  titularTipo: 'EXTERNO' | null;
  titularNombre: string | null;
  titularApellidos: string | null;
  titularCorreo: string | null;
  titularEmpresa: string | null;
  titularMotivo: string | null;
  titularCargo: string;
  tipoEquipo: 'INIA' | 'PERSONAL';
  glpiComputerId: number | null;
  antivirusVerificado: boolean;
  analisisAntivirusRealizado: boolean;
  sistemaOperativoActualizado: boolean;
  forticlientInstalado: boolean;
  hostActualizado: boolean | null;
  vencimientoAntivirus: string | null;
}

export interface VpnUsuarioRedOption {
  samAccountName: string;
  displayName: string | null;
  mail: string | null;
  office: string | null;
  organizationalUnit: string | null;
  enabled: boolean;
}

export interface VpnAprobarRequest {
  usuarioVpn: string;
  credencialVpn: string;
  estado: string;
}

export interface VpnResolucionRequest {
  comentarioResponsable: string;
}

export interface VpnAntivirusRequest {
  tieneAntivirus: boolean | null;
  vencimientoAntivirus: string | null;
}

export interface VpnKpis {
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  observadas: number;
}

export interface VpnConfigInstitucional {
  vencimientoAntivirus: string | null;
}

export interface VpnConfigInstitucionalRequest {
  vencimientoAntivirus: string;
}

export interface VpnTipoEquipoCount {
  tipoEquipo: string;
  total: number;
}

export interface VpnDependenciaCount {
  dependencia: string;
  total: number;
}

export interface VpnSubdependenciaCount {
  subdependencia: string;
  total: number;
}

export interface VpnVencimientoAlerta {
  vpnId: number;
  titular: string;
  tipoEquipo: string | null;
  vence: string;
  detalle: string;
}

export interface VpnDashboardCompleto {
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  observadas: number;
  total: number;
  distribucionPorTipoEquipo: VpnTipoEquipoCount[];
  distribucionPorDependencia: VpnDependenciaCount[];
  distribucionPorSubdependencia: VpnSubdependenciaCount[];
  antivirusVencidos: VpnVencimientoAlerta[];
  totalAntivirusVencidos: number;
  antivirusPorVencer: VpnVencimientoAlerta[];
  totalAntivirusPorVencer: number;
}
