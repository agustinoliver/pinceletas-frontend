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
}