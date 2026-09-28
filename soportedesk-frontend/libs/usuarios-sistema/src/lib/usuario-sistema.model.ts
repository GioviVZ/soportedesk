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

type PermisoKind = 'write' | 'view';

export interface ModuloPermiso {
  key: string;
  label: string;
  kind: PermisoKind;
  group: string;
  description?: string;
}

export const MODULOS: ModuloPermiso[] = [
  { key: 'usuarios-red', label: 'Usuarios de Red/AD', kind: 'write', group: 'Operaciones' },
  {
    key: 'correos',
    label: 'Correos Institucionales',
    kind: 'view',
    group: 'Operaciones',
    description: 'Permite consultar cuentas y ver el dashboard de Google Workspace.',
  },
  { key: 'equipos', label: 'Inventario de Equipos', kind: 'write', group: 'Operaciones' },
  {
    key: 'vpn',
    label: 'VPN Registros',
    kind: 'view',
    group: 'Redes y Accesos',
    description: 'Permite entrar a la vista de registros VPN en modo consulta.',
  },
  {
    key: 'credenciales-vpn',
    label: 'Credenciales VPN',
    kind: 'write',
    group: 'Redes y Accesos',
    description: 'Permite ver y gestionar usuario y clave VPN dentro de Administracion.',
  },
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
  { key: 'catalogos', label: 'Configuración', kind: 'write', group: 'Administracion' },
  {
    key: 'auditoria',
    label: 'Vista de Movimientos',
    kind: 'view',
    group: 'Administracion',
    description: 'Permite entrar al modulo Movimientos y revisar la auditoria del sistema.',
  },
  {
    key: 'herramientas',
    label: 'Aplicaciones',
    kind: 'write',
    group: 'Diagnostico',
    description: 'Ver permite usar diagnósticos; Editar también administra órdenes de servicio.',
  },
];
