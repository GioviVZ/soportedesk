export interface Correo {
  email: string;
  nombreCompleto: string | null;
  sede: string;
  oficinaPadre: string;
  oficina: string;
  modalidad: string;
  estado: string;
  verificacion2Pasos: string;
  ultimoInicioSesion: string | null;
  emailUsageMB: number | null;
  driveUsageMB: number | null;
  storageUsedMB: number | null;
  totalUsoMB: number | null;
  employeeId: string | null;
}

export interface CorreoKpis {
  licenciasTotales: number;
  licenciasAsignadas: number;
  licenciasDisponibles: number;
  activasCount: number;
  suspendidasCount: number;
  sedeCentralCount: number;
  eeasCount: number;
}

export interface CorreoFiltros {
  search?: string;
  sede?: string;
  dependencia?: string;
  subdependencia?: string;
  estado?: string;
  modalidad?: string;
  sinUso30Dias?: boolean;
}

export interface CorreoDependenciaCount {
  dependencia: string;
  total: number;
}

export interface CorreoInactividadAlerta {
  email: string;
  nombreCompleto: string | null;
  detalle: string;
}

export interface CorreoDashboardCompleto {
  kpis: CorreoKpis;
  distribucionPorDependencia: CorreoDependenciaCount[];
  cuentasCon2FA: number;
  totalCuentas: number;
  porcentaje2FA: number;
  sinUso: CorreoInactividadAlerta[];
  totalSinUso: number;
}
