export interface Tienda {
  id?: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface Politicas {
  id?: number;
  politicaDevolucion: string;
  politicaPrivacidad: string;
}