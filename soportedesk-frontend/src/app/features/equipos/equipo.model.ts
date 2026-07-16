export interface EquipoResumen {
  computerID: number;
  nombreEquipo: string;
  usuarioContacto: string;
  sedeNombre: string;
  oficinaId: string;
  unidadId: string;
  tipoEquipo: string;
  fabricanteEquipo: string;
  modeloEquipo: string;
  cpuModelos: string;
  ramTotalGb: number;
  diskTotalGb: number;
  ipEquipo: string | null;
  numeroserie: string | null;
  codigoInterno: string | null;
}

export interface EquipoDetalle extends EquipoResumen {
  usuarioTelefono: string | null;
  sedeNombreCompleto: string | null;
  cpuConteo: number;
  cpuNucleos: number;
  cpuHilos: number;
  cpuFrecuenciaMax: number;
  cpuFabricantes: string | null;
  ramModulos: number;
  ramFrecuenciaMax: string;
  ramTipos: string;
  ramModelos: string | null;
  ramFabricantes: string | null;
  diskCantidad: number;
  diskTipos: string;
  diskInterfaces: string | null;
  diskModelos: string | null;
  monCantidad: number;
  monNombres: string | null;
  monModelos: string | null;
  monFabricantes: string | null;
  monSeriales: string | null;
  fechaCreacion: string | null;
  ultimaActualizacion: string | null;
  ultimoEncendido: string | null;
  eliminado: number;
  uuidEquipo: string | null;
}

export interface EquipoSoftware {
  software: string;
  version: string;
  fechaInstalacion: string | null;
}

export interface EquipoTeclado {
  marcafield: string;
  modelofield: string;
  nmerodeseriefield: string;
  cdigodeinventariofield: string;
  cdigopatrimonialfield: string;
}

export interface EquipoOficina {
  siglafield: string | null;
  reafield: string | null;
}

export interface EquipoEnrichmentDto {
  tipoOverride: string | null;
  fabricanteOverride: string | null;
  modeloOverride: string | null;
  codigoPatrimonial: string | null;
  codigoInternoOverride: string | null;
  nombreAsignadoOverride: string | null;
  usuarioAsignadoOverride: string | null;
  sedeId: number | null;
  sedeNombre: string | null;
  dependenciaId: number | null;
  dependenciaNombre: string | null;
  subdependenciaId: number | null;
  subdependenciaNombre: string | null;
  numeroSerieOverride: string | null;
  estadoDepuracion: string | null;
  observaciones: string | null;
  revisadoPor: string | null;
  fechaRevision: string | null;
}

export interface HistorialItem {
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  modificadoPor: string;
  fechaModificacion: string;
}

export interface EquipoSaludItem {
  computerID: number;
  nombreEquipo: string;
  sedeNombre: string | null;
  tipoEquipo: string | null;
  usuarioContacto: string | null;
  fechaCreacion: string | null;
  sinEncendidoMeses: number;
  sinActualizacionMeses: number;
  nivelAlerta: 'ROJO' | 'AMARILLO' | 'OK';
  sinCodigoPatrimonial: boolean;
  sinUsuario: boolean;
  sinSede: boolean;
  sinDependencia: boolean;
  sinSubdependencia: boolean;
  sinNumeroSerie: boolean;
  estadoDepuracion: string | null;
}

export interface EquipoDetalleResponse {
  equipo: EquipoDetalle;
  software: EquipoSoftware[];
  teclado: EquipoTeclado | null;
  oficina: EquipoOficina | null;
  tipoEfectivo: string | null;
}

export interface EquipoKpis {
  totalActivos: number;
  desktopCount: number;
  laptopCount: number;
  otrosCount: number;
  sedeCentralCount: number;
  eeasCount: number;
}

export interface EquipoFabricanteCount {
  fabricante: string;
  total: number;
}

export interface EquipoDependenciaCount {
  dependencia: string;
  total: number;
}

export interface EquipoSaludResumen {
  rojos: number;
  amarillos: number;
  ok: number;
  sinPatrimonial: number;
  sinUsuario: number;
  sinSede: number;
}

export interface EquipoDashboardCompleto {
  total: number;
  desktopCount: number;
  laptopCount: number;
  otrosCount: number;
  sedeCentralCount: number;
  eeasCount: number;
  recientes30Dias: number;
  distribucionPorFabricante: EquipoFabricanteCount[];
  topDependencias: EquipoDependenciaCount[];
  salud: EquipoSaludResumen;
}

export interface EquipoEvidencia {
  id: number;
  nombreOriginal: string;
  descripcion: string | null;
  subidoPor: string;
  fechaSubida: string;
}

export interface Equipo {
  id: number;
  numeroSerie: string | null;
  codigoPatrimonial: string | null;
  codigoInventario: string | null;
  tipo: string;
  marca: string;
  modelo: string;
  host: string | null;
  ip: string | null;
  usuarioRed: { id: number; nombre: string; usuario: string } | null;
  sede: { id: number; nombre: string } | null;
  dependencia: { id: number; nombre: string } | null;
  subdependencia: { id: number; nombre: string } | null;
  asignado: string | null;
  estado: string;
}
