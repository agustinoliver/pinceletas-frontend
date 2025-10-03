import { Categoria } from "./categoria.model";

export interface OpcionProducto {
  id: number;
  tipo: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  activo: boolean;
  opciones: OpcionProducto[];
  categoria?: Categoria; 
}

export interface ProductoCreateRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  activo: boolean;
  categoriaId: number;
  opcionesIds: number[];
  usuarioId: number;
  imagen: File | null;
}