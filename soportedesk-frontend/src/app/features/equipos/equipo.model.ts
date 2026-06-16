export interface Equipo {
  id: number;
  codigo: string;
  tipo: string;
  marca: string;
  modelo: string;
  usuario: string;
  area: string;
  asignado: string;
  estado: string;
}

export type EquipoRequest = Omit<Equipo, 'id'>;
