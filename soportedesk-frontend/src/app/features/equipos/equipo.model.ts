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

export interface EquipoRequest {
  numeroSerie: string;
  codigoPatrimonial: string;
  codigoInventario: string;
  tipo: string;
  marca: string;
  modelo: string;
  host: string;
  ip: string;
  usuarioRedId: number | null;
  sedeId: number | null;
  dependenciaId: number | null;
  subdependenciaId: number | null;
  asignado: string;
  estado: string;
}
