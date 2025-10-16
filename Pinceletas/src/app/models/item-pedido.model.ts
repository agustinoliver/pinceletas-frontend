export interface ItemPedidoRequest {
  productoId: number;
  opcionSeleccionadaId?: number | null;
  cantidad: number;
}

export interface ItemPedidoResponse {
  id: number;
  productoId: number;
  nombreProducto: string;
  imagenProducto: string;
  opcionSeleccionadaId?: number;
  tipoOpcion?: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje: number;
  subtotal: number;
}