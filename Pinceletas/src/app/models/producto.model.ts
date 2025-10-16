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
  descuentoPorcentaje?: number;
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
  descuentoPorcentaje?: number;
}
// ✅ NUEVO: Interfaz auxiliar para cálculos de precio
export interface PrecioCalculado {
  precioOriginal: number;
  descuentoPorcentaje: number;
  montoDescuento: number;
  precioFinal: number;
}

// Utilidad para calcular precios con descuento
export function calcularPrecioConDescuento(precio: number, descuentoPorcentaje: number = 0): PrecioCalculado {
  const descuento = Math.max(0, Math.min(descuentoPorcentaje || 0, 100));
  const montoDescuento = precio * (descuento / 100);
  const precioFinal = precio - montoDescuento;

  return {
    precioOriginal: precio,
    descuentoPorcentaje: descuento,
    montoDescuento,
    precioFinal
  };
}