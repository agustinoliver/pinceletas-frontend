export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  estado: string;
  usuarioId: number;
  metadata: string;
  fechaCreacion: string;
  fechaLectura: string | null;
}

export interface NotificacionCreateRequest {
  titulo: string;
  mensaje: string;
  tipo: string;
  usuarioId: number;
  metadata: string;
}