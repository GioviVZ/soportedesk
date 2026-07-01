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
  ramModulos: number;
  ramFrecuenciaMax: string;
  ramTipos: string;
  diskCantidad: number;
  diskTipos: string;
  monCantidad: number;
  monNombres: string | null;
  monModelos: string | null;
  monFabricantes: string | null;
  monSeriales: string | null;
  ultimoEncendido: string | null;
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

export interface EquipoDetalleResponse {
  equipo: EquipoDetalle;
  software: EquipoSoftware[];
  teclado: EquipoTeclado | null;
}

export interface EquipoKpis {
  totalActivos: number;
  desktopCount: number;
  laptopCount: number;
  otrosCount: number;
  sedeCentralCount: number;
  eeasCount: number;
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
