export interface ActiveDirectoryResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface ActiveDirectoryDashboard {
  usuariosHabilitados: number;
  usuariosBloqueados: number;
  usuariosDeshabilitados: number;
  controladoresDominio: number;
}

export interface AdUserSummary {
  samAccountName: string;
  displayName: string | null;
  mail: string | null;
  office: string | null;
  organizationalUnit: string | null;
  enabled: boolean;
  locked: boolean;
}

export interface AdUserSearchResult {
  items: AdUserSummary[];
  truncated: boolean;
}

export interface AdFilterOption {
  value: string;
  total: number;
}

export interface OuUsuariosCount {
  ou: string;
  activos: number;
}

export interface AdUserAlerta {
  samAccountName: string;
  displayName: string | null;
  detalle: string;
}

export interface ActiveDirectoryDashboardCompleto extends ActiveDirectoryDashboard {
  distribucionPorOu: OuUsuariosCount[];
  passwordsVencidas: AdUserAlerta[];
  totalPasswordsVencidas: number;
  cuentasInactivas: AdUserAlerta[];
  totalCuentasInactivas: number;
  cuentasBloqueadas: AdUserAlerta[];
  totalCuentasBloqueadas: number;
}

export interface AdSyncResponse {
  usuariosSincronizados: number;
  controladoresDominio: number;
  sincronizadoEn: string;
}

export interface AdSyncStatus {
  running: boolean;
  procesados: number;
  total: number;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  ultimoResultado: AdSyncResponse | null;
  error: string | null;
}

export interface AdUser {
  samAccountName: string;
  displayName: string | null;
  givenName: string | null;
  surname: string | null;
  mail: string | null;
  department: string | null;
  company: string | null;
  title: string | null;
  telephoneNumber: string | null;
  mobile: string | null;
  office: string | null;
  description: string | null;
  distinguishedName: string | null;
  userPrincipalName: string | null;
  enabled: boolean;
  locked: boolean;
  organizationalUnit: string | null;
  whenCreated: string | null;
  whenChanged: string | null;
  pwdLastSet: string | null;
  lastLogonTimestamp: string | null;
  accountExpires: string | null;
  badPwdCount: string | null;
  daysSincePasswordChange: number | null;
  groups: string[];
}

export interface ActiveDirectoryGroup {
  cn: string;
  dn: string;
  description: string | null;
}

export interface ActiveDirectoryOu {
  name: string;
  dn: string;
}

export interface CreateAdUserRequest {
  samAccountName: string;
  givenName: string;
  surname: string;
  displayName?: string | null;
  mail?: string | null;
  userPrincipalName?: string | null;
  temporaryPassword: string;
  ouDestinoDn: string;
  title?: string | null;
  department?: string | null;
  office?: string | null;
  telephoneNumber?: string | null;
  mobile?: string | null;
  description?: string | null;
  enabled: boolean;
  forceChange: boolean;
}

export interface UpdateUserInfoRequest {
  displayName?: string | null;
  title?: string | null;
  department?: string | null;
  office?: string | null;
  telephoneNumber?: string | null;
  mobile?: string | null;
  mail?: string | null;
  description?: string | null;
}
