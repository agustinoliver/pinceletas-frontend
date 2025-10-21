export interface Favorito {
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
    categoria: {
      id: number;
      nombre: string;
    };
    opciones: Array<{
      id: number;
      tipo: string;
    }>;
  };
  opcionSeleccionada?: number; // ✅ NUEVO: Para guardar la opción seleccionada
}