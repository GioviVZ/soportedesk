export interface Sede {
  id: number;
  nombre: string;
}

export interface Dependencia {
  id: number;
  nombre: string;
  sede: Sede;
}

export interface Subdependencia {
  id: number;
  nombre: string;
  dependencia: Dependencia;
}

export interface TipoContrato {
  id: number;
  nombre: string;
}

export interface TipoLicencia {
  id: number;
  nombre: string;
}

export interface TipoBien {
  id: number;
  nombre: string;
}

export interface TipoImpresora {
  id: number;
  nombre: string;
}

export interface CatalogoRequest {
  nombre: string;
}

export interface DependenciaRequest {
  nombre: string;
  sedeId: number;
}

export interface SubdependenciaRequest {
  nombre: string;
  dependenciaId: number;
}

export interface MarcaImpresora {
  id: number;
  nombre: string;
}

export interface ModeloImpresoraToner {
  id?: number;
  color: string;
  variante: string;
  codigo: string;
}

export interface ModeloImpresora {
  id: number;
  nombre: string;
  marca: MarcaImpresora;
  toners: ModeloImpresoraToner[];
  driverNombre: string | null;
  driverVersion: string | null;
  driverSo: string | null;
  driverArchivoPath: string | null;
}

export interface ModeloImpresoraRequest {
  marcaId: number;
  nombre: string;
  toners: ModeloImpresoraToner[];
}
