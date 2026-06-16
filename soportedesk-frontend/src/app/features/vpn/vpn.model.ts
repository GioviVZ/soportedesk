export interface Vpn {
  id: number;
  usuario: string;
  nombre: string;
  tipo: string;
  ipAsignada: string;
  vence: string | null;
  estado: string;
}

export type VpnRequest = Omit<Vpn, 'id'>;
