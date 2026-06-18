export interface UsuarioSistema {
  id: number;
  username: string;
  nombre: string;
  rol: string;
  activo: boolean;
  permisos: string[];
}

export interface UsuarioSistemaRequest {
  username: string;
  nombre: string;
  password?: string;
  activo: boolean;
  permisos: string[];
}

export const MODULOS: { key: string; label: string }[] = [
  { key: 'usuarios-red', label: 'Usuarios de Red/AD' },
  { key: 'correos',      label: 'Correos Institucionales' },
  { key: 'equipos',      label: 'Equipos Asignados' },
  { key: 'vpn',                label: 'VPN' },
  { key: 'credenciales-vpn',  label: 'Credenciales VPN' },
  { key: 'impresoras',   label: 'Impresoras' },
  { key: 'wifi',         label: 'Claves WiFi' },
  { key: 'licencias',    label: 'Licencias Office' },
];
