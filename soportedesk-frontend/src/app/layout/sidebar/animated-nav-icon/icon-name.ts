export const ICON_NAMES = [
  'dashboard',
  'usuarios-red',
  'correos',
  'equipos',
  'vpn',
  'impresoras',
  'wifi',
  'licencias',
  'auditoria',
  'herramientas',
  'usuarios-sistema',
  'candidatos-persona',
  'catalogos',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
