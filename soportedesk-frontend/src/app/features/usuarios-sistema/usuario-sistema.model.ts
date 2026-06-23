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

export type PermisoKind = 'write' | 'view';

export interface ModuloPermiso {
  key: string;
  label: string;
  kind: PermisoKind;
  description?: string;
}

export const MODULOS: ModuloPermiso[] = [
  { key: 'usuarios-red', label: 'Usuarios de Red/AD', kind: 'write' },
  { key: 'correos', label: 'Correos Institucionales', kind: 'write' },
  { key: 'equipos', label: 'Equipos Asignados', kind: 'write' },
  { key: 'vpn', label: 'VPN', kind: 'write' },
  { key: 'credenciales-vpn', label: 'Credenciales VPN', kind: 'write' },
  { key: 'impresoras', label: 'Impresoras', kind: 'write' },
  { key: 'wifi', label: 'Claves WiFi', kind: 'write' },
  { key: 'licencias', label: 'Licencias', kind: 'write' },
  {
    key: 'auditoria',
    label: 'Vista de Movimientos',
    kind: 'view',
    description: 'Permite entrar al modulo Movimientos y revisar la auditoria del sistema.',
  },
];
