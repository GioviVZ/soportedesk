import { Vpn } from './vpn.model';

export type VpnEstadoFiltro = 'TODOS' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';
export type VpnOrdenFiltro = 'nuevas' | 'recientes' | 'rechazados' | 'observados';

export interface VpnListFilters {
  query: string;
  dependencia: string;
  subdependencia: string;
  cargo: string;
  estado: VpnEstadoFiltro;
  orden: VpnOrdenFiltro;
}

const ESTADO_PRIORITY: Record<Vpn['estadoSolicitud'], number> = {
  PENDIENTE: 0,
  OBSERVADO: 1,
  RECHAZADO: 2,
  APROBADO: 3,
};

const EMPTY_DEPENDENCIA = 'Sin dependencia';
const EMPTY_SUBDEPENDENCIA = 'Sin subdependencia';
const EMPTY_CARGO = 'Sin cargo';

export function defaultVpnFilters(): VpnListFilters {
  return {
    query: '',
    dependencia: '',
    subdependencia: '',
    cargo: '',
    estado: 'TODOS',
    orden: 'nuevas',
  };
}

export function filterAndSortVpns(items: Vpn[], filters: VpnListFilters): Vpn[] {
  const query = normalize(filters.query);
  const dependencia = normalize(filters.dependencia);
  const subdependencia = normalize(filters.subdependencia);
  const cargo = normalize(filters.cargo);

  return items
    .filter((item) => {
      if (filters.estado !== 'TODOS' && item.estadoSolicitud !== filters.estado) return false;
      if (dependencia && normalize(dependenciaLabel(item)) !== dependencia) return false;
      if (subdependencia && normalize(subdependenciaLabel(item)) !== subdependencia) return false;
      if (cargo && normalize(cargoLabel(item)) !== cargo) return false;
      if (!query) return true;
      return searchableText(item).includes(query);
    })
    .sort((a, b) => compareVpns(a, b, filters.orden));
}

export function dependenciaOptions(items: Vpn[]): string[] {
  return uniqueSorted(items.map(dependenciaLabel));
}

export function subdependenciaOptions(items: Vpn[]): string[] {
  return uniqueSorted(items.map(subdependenciaLabel));
}

export function cargoOptions(items: Vpn[]): string[] {
  return uniqueSorted(items.map(cargoLabel));
}

export function dependenciaLabel(item: Vpn): string {
  return clean(item.adOrganizationalUnit) || clean(item.titularEmpresa) || EMPTY_DEPENDENCIA;
}

export function subdependenciaLabel(item: Vpn): string {
  return clean(item.adOffice) || EMPTY_SUBDEPENDENCIA;
}

export function cargoLabel(item: Vpn): string {
  return clean(item.titularCargo) || EMPTY_CARGO;
}

export function hasActiveVpnFilters(filters: VpnListFilters): boolean {
  return Boolean(
    filters.query.trim() ||
      filters.dependencia ||
      filters.subdependencia ||
      filters.cargo ||
      filters.estado !== 'TODOS' ||
      filters.orden !== 'nuevas'
  );
}

function compareVpns(a: Vpn, b: Vpn, orden: VpnOrdenFiltro): number {
  if (orden === 'rechazados') {
    return stateFirst(a, b, 'RECHAZADO') || byFechaSolicitudDesc(a, b);
  }
  if (orden === 'observados') {
    return stateFirst(a, b, 'OBSERVADO') || byFechaSolicitudDesc(a, b);
  }
  if (orden === 'recientes') {
    return byFechaSolicitudDesc(a, b);
  }
  return estadoPriority(a) - estadoPriority(b) || byFechaSolicitudDesc(a, b);
}

function estadoPriority(item: Vpn): number {
  return ESTADO_PRIORITY[item.estadoSolicitud] ?? 99;
}

function stateFirst(a: Vpn, b: Vpn, estado: Vpn['estadoSolicitud']): number {
  return Number(b.estadoSolicitud === estado) - Number(a.estadoSolicitud === estado);
}

function byFechaSolicitudDesc(a: Vpn, b: Vpn): number {
  return toTime(b.fechaSolicitud) - toTime(a.fechaSolicitud);
}

function toTime(value: string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function searchableText(item: Vpn): string {
  return normalize(
    [
      item.titularNombreCompleto,
      item.adSamAccountName,
      item.adDisplayName,
      item.adMail,
      item.adOffice,
      item.adOrganizationalUnit,
      item.titularCargo,
      item.titularEmpresa,
      item.titularCorreo,
      item.glpiNombreEquipo,
      item.glpiIpEquipo,
      item.usuarioVpn,
      item.solicitadoPorNombre,
      item.estadoSolicitud,
      item.estado,
      item.tipoEquipo,
    ].filter(Boolean).join(' ')
  );
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

function clean(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
