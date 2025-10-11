export interface Favorito {
  id: number;
  usuarioId: number;
  producto: {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    imagen: string;
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
}