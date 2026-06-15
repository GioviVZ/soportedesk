export type Rol = 'ADMIN' | 'SOPORTE';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  nombre: string;
  rol: Rol;
}
