export interface UsuarioSistema {
  id: number;
  username: string;
  nombre: string;
  rol: string;
  activo: boolean;
  permisos: Record<string, NivelPermiso>;
}

export interface UsuarioSistemaRequest {
  username: string;
  nombre: string;
  password?: string;
  activo: boolean;
  permisos: Record<string, NivelPermiso>;
}

export type NivelPermiso = 'VIEW' | 'EDIT';

export type PermisoKind = 'write' | 'view';

export interface ModuloPermiso {
  key: string;
  label: string;
  kind: PermisoKind;
  group: string;
  description?: string;
}

export const MODULOS: ModuloPermiso[] = [
  { key: 'usuarios-red', label: 'Usuarios de Red/AD', kind: 'write', group: 'Operaciones' },
  { key: 'correos', label: 'Correos Institucionales', kind: 'write', group: 'Operaciones' },
  { key: 'equipos', label: 'Equipos Asignados', kind: 'write', group: 'Operaciones' },
  { key: 'vpn', label: 'VPN', kind: 'write', group: 'Redes y Accesos' },
  { key: 'credenciales-vpn', label: 'Credenciales VPN', kind: 'write', group: 'Redes y Accesos' },
  {
    key: 'solicitar-vpn',
    label: 'Solicitar VPN',
    kind: 'write',
    group: 'Redes y Accesos',
    description: 'Permite crear y reenviar solicitudes de acceso VPN (rol asistente).',
  },
  {
    key: 'aprobar-vpn',
    label: 'Aprobar VPN',
    kind: 'write',
    group: 'Redes y Accesos',
    description: 'Permite aprobar, rechazar u observar solicitudes de acceso VPN (rol responsable).',
  },
  { key: 'wifi', label: 'Claves WiFi', kind: 'write', group: 'Redes y Accesos' },
  { key: 'impresoras', label: 'Impresoras', kind: 'write', group: 'Inventario' },
  { key: 'licencias', label: 'Licencias', kind: 'write', group: 'Inventario' },
  { key: 'catalogos', label: 'Catalogos', kind: 'write', group: 'Administracion' },
  {
    key: 'auditoria',
    label: 'Vista de Movimientos',
    kind: 'view',
    group: 'Administracion',
    description: 'Permite entrar al modulo Movimientos y revisar la auditoria del sistema.',
  },
  {
    key: 'herramientas',
    label: 'Herramientas',
    kind: 'view',
    group: 'Diagnostico',
    description: 'Permite usar ping, inventario, GPU, RAM, teclado y mouse.',
  },
];
