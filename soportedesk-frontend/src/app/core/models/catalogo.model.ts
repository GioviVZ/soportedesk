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
