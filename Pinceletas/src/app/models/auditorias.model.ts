export interface AuditoriaProducto {
  id: number;
  productoId: number;
  usuarioId: number;
  accion: string;
  valoresAnteriores: string | null;
  valoresNuevos: string | null;
  fechaAccion: string;
}

export interface AuditoriaCategoria {
  id: number;
  categoriaId: number;
  usuarioId: number;
  accion: string;
  valoresAnteriores: string | null;
  valoresNuevos: string | null;
  fechaAccion: string;
}
export interface AuditoriaPedido {
  id: number;
  pedidoId: number;
  usuarioId: number;
  accion: string;
  valoresAnteriores: string | null;
  valoresNuevos: string | null;
  fechaAccion: string;
}