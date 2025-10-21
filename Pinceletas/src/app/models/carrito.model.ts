export interface CarritoItem {
  id: number;
  usuarioId: number;
  producto: {
    descuentoPorcentaje: number;
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    imagenes: string[];
    activo: boolean;
    categoria?: {
      id: number;
      nombre: string;
    };
    opciones: Array<{
      id: number;
      tipo: string;
    }>;
  };
  cantidad: number;
  opcionSeleccionada?: { // ✅ NUEVO: Opción específica seleccionada
    id: number;
    tipo: string;
  };
}

export interface CarritoRequest {
  productoId: number;
  cantidad: number;
  opcionSeleccionadaId?: number | null; // ✅ CORREGIDO: Permitir null
}

export interface ResumenCarrito {
  subtotal: number;
  envio: number;
  descuento: number;
  total: number;
  tipoEntrega: 'envio' | 'retiro';
}