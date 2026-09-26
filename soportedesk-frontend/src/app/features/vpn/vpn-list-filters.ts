import { Vpn } from './vpn.model';

type VpnEstadoFiltro = 'TODOS' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'OBSERVADO';
type VpnOrdenFiltro = 'nuevas' | 'recientes' | 'rechazados' | 'observados';

export interface VpnListFilters {
  query: string;
  sedeId: string;
  dependenciaId: string;
  subdependenciaId: string;
  cargo: string;
  estado: VpnEstadoFiltro;
  orden: VpnOrdenFiltro;
}

export const PENDIENTE = '__PENDIENTE__';

const ESTADO_PRIORITY: Record<Vpn['estadoSolicitud'], number> = {
  PENDIENTE: 0,
  OBSERVADO: 1,
  RECHAZADO: 2,
  APROBADO: 3,
};

const EMPTY_CARGO = 'Sin cargo';

export function defaultVpnFilters(): VpnListFilters {
  return {
    query: '',
    sedeId: '',
    dependenciaId: '',
    subdependenciaId: '',
    cargo: '',
    estado: 'TODOS',
    orden: 'nuevas',
  };
}

export function filterAndSortVpns(items: Vpn[], filters: VpnListFilters): Vpn[] {
  const query = normalize(filters.query);
  const cargo = normalize(filters.cargo);

  return items
    .filter((item) => {
      if (filters.estado !== 'TODOS' && item.estadoSolicitud !== filters.estado) return false;
      if (filters.sedeId) {
        if (filters.sedeId === PENDIENTE) {
          if (item.titularSedeId != null) return false;
        } else if (String(item.titularSedeId ?? '') !== filters.sedeId) {
          return false;
        }
      }
      if (filters.dependenciaId) {
        if (filters.dependenciaId === PENDIENTE) {
          if (item.titularDependenciaId != null) return false;
        } else if (String(item.titularDependenciaId ?? '') !== filters.dependenciaId) {
          return false;
        }
      }
      if (filters.subdependenciaId) {
        if (filters.subdependenciaId === PENDIENTE) {
          if (item.titularSubdependenciaId != null) return false;
        } else if (String(item.titularSubdependenciaId ?? '') !== filters.subdependenciaId) {
          return false;
        }
      }
      if (cargo && normalize(cargoLabel(item)) !== cargo) return false;
      if (!query) return true;
      return searchableText(item).includes(query);
    })
    .sort((a, b) => compareVpns(a, b, filters.orden));
}

export function cargoOptions(items: Vpn[]): string[] {
  return uniqueSorted(items.map(cargoLabel));
}

function cargoLabel(item: Vpn): string {
  return clean(item.titularCargo) || EMPTY_CARGO;
}

export function hasActiveVpnFilters(filters: VpnListFilters): boolean {
  return Boolean(
    filters.query.trim() ||
      filters.sedeId ||
      filters.dependenciaId ||
      filters.subdependenciaId ||
      filters.cargo ||
      filters.estado !== 'TODOS' ||
      filters.orden !== 'nuevas'
  );
}

function compareVpns(a: Vpn, b: Vpn, orden: VpnOrdenFiltro): number {
  if (orden === 'rechazados') {
    return stateFirst(a, b, 'RECHAZADO')
      || byFechaSolicitudDesc(a, b)
      || compareUbicacion(a, b);
  }
  if (orden === 'observados') {
    return stateFirst(a, b, 'OBSERVADO')
      || byFechaSolicitudDesc(a, b)
      || compareUbicacion(a, b);
  }
  if (orden === 'recientes') {
    return byFechaSolicitudDesc(a, b) || compareUbicacion(a, b);
  }
  return estadoPriority(a) - estadoPriority(b)
    || byFechaSolicitudDesc(a, b)
    || compareUbicacion(a, b);
}

function compareUbicacion(a: Vpn, b: Vpn): number {
  return compareConNullsAlFinal(a.titularSedeNombre, b.titularSedeNombre)
    || compareConNullsAlFinal(a.titularDependenciaNombre, b.titularDependenciaNombre)
    || compareConNullsAlFinal(a.titularSubdependenciaNombre, b.titularSubdependenciaNombre);
}

function compareConNullsAlFinal(a: string | null | undefined, b: string | null | undefined): number {
  const aVacio = !a;
  const bVacio = !b;
  if (aVacio && bVacio) return 0;
  if (aVacio) return 1;
  if (bVacio) return -1;
  return a!.localeCompare(b!, 'es', { sensitivity: 'base' });
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
      item.terceroNombre,
      item.numeroOrdenServicio,
      item.vencimientoOrdenServicio,
      item.ultimoContratoTipo,
      item.ultimoContratoNumero,
      item.ultimoContratoFechaFin,
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
