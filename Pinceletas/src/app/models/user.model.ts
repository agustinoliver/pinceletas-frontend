export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  role: 'USER' | 'ADMIN';
  activo: boolean;
  calle?: string;
  numero?: string;
  manzana?: string;
  lote?: string;
  piso?: string;
  barrio?: string;
  ciudad?: string;
  pais?: string;
  provincia?: string;
  codigoPostal?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateAddressRequest {
  calle?: string;
  numero?: string;
  manzana?: string;
  lote?: string;
  piso?: string;
  barrio?: string;
  ciudad?: string;
  pais?: string;
  provincia?: string;
  codigoPostal?: string;
  tipoDireccion?: 'calle' | 'manzana';
}

export interface UpdateUserRequest {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}