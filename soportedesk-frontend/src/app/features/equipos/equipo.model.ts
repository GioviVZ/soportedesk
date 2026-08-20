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
  fechaCreacion: string | null;
  ultimaActualizacion: string | null;
  ultimoEncendido: string | null;
  anydeskId: string | null;
  rustdeskId: string | null;
  codigoPatrimonial: string | null;
  monCantidad: number;
  monNombres: string | null;
  monModelos: string | null;
  monFabricantes: string | null;
  monSeriales: string | null;
  monitorFabricanteOverride: string | null;
  monitorModeloOverride: string | null;
  monitorNumeroSerieOverride: string | null;
  monitorCodigoPatrimonial: string | null;
  monitorCodigoInternoOverride: string | null;
  monitor1Nombre: string | null;
  monitor1Marca: string | null;
  monitor1Modelo: string | null;
  monitor1Serie: string | null;
  monitor2Nombre: string | null;
  monitor2Marca: string | null;
  monitor2Modelo: string | null;
  monitor2Serie: string | null;
  monitor2FabricanteOverride: string | null;
  monitor2ModeloOverride: string | null;
  monitor2NumeroSerieOverride: string | null;
  monitor2CodigoPatrimonial: string | null;
  monitor2CodigoInternoOverride: string | null;
  tecladoMarca: string | null;
  tecladoModelo: string | null;
  tecladoNumeroSerie: string | null;
  tecladoCodigoInventario: string | null;
  tecladoCodigoPatrimonial: string | null;
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

export interface TecladoInput {
  marca: string;
  modelo: string;
  numeroSerie: string;
  codigoInventario: string | null;
  codigoPatrimonial: string | null;
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
  monitorFabricanteOverride: string | null;
  monitorModeloOverride: string | null;
  monitorNumeroSerieOverride: string | null;
  monitorCodigoPatrimonial: string | null;
  monitorCodigoInternoOverride: string | null;
  monitor2FabricanteOverride: string | null;
  monitor2ModeloOverride: string | null;
  monitor2NumeroSerieOverride: string | null;
  monitor2CodigoPatrimonial: string | null;
  monitor2CodigoInternoOverride: string | null;
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
  dependenciaNombre: string | null;
  subdependenciaNombre: string | null;
  tipoEquipo: string | null;
  fabricanteEquipo: string | null;
  modeloEquipo: string | null;
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
  allInOneCount: number;
  sedeCentralCount: number;
  eeasCount: number;
}

interface EquipoFabricanteCount {
  fabricante: string;
  total: number;
}

interface EquipoDependenciaCount {
  dependencia: string;
  total: number;
}

export interface EquipoSoftwareExport extends EquipoSoftware {
  computerId: number;
}

interface EquipoSubdependenciaCount {
  subdependencia: string;
  total: number;
}

interface EquipoSaludResumen {
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
  allInOneCount: number;
  sedeCentralCount: number;
  eeasCount: number;
  recientes30Dias: number;
  sinActualizarMasTresMeses: number;
  distribucionPorFabricante: EquipoFabricanteCount[];
  topDependencias: EquipoDependenciaCount[];
  topSubdependencias: EquipoSubdependenciaCount[];
  salud: EquipoSaludResumen;
}

export interface EquipoEvidencia {
  id: number;
  nombreOriginal: string;
  descripcion: string | null;
  subidoPor: string;
  fechaSubida: string;
}
