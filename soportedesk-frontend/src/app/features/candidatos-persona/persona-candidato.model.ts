export type ClasificacionCandidato = 'PERSONAL' | 'FUNCIONAL' | 'SERVICIO';

export type EstadoCandidato = 'PENDIENTE' | 'CONFIRMADO' | 'DESCARTADO';

export interface PersonaCandidato {
  id: number;
  samAccountName: string;
  nombres: string;
  apellidos: string;
  correoInstitucional: string | null;
  clasificacionSugerida: ClasificacionCandidato | null;
  estado: EstadoCandidato;
  fechaDeteccion: string;
  confirmadoPor: string | null;
  fechaResolucion: string | null;
  personaId: number | null;
}
