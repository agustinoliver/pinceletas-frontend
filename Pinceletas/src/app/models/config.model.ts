export interface Tienda {
  id?: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface TerminosCondiciones {
  id?: number;
  terminosServicio: string;
  politicaPrivacidad: string;
}

export interface ConfiguracionEnvio {
  id?: number;
  nombre: string;
  costo: number ;
  montoMinimoEnvioGratis: number;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface ConfiguracionEnvioRequest {
  nombre: string;
  costo: number;
  montoMinimoEnvioGratis: number;
  activo: boolean;
}