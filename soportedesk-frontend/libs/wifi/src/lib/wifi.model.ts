export interface Wifi {
  id: number;
  ssid: string;
  clave: string;
  ubicacion: string;
  tipo: string;
  estado: string;
}

export type WifiRequest = Omit<Wifi, 'id'>;
