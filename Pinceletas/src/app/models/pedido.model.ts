import { ItemPedidoRequest, ItemPedidoResponse } from "./item-pedido.model";

export interface PedidoRequest {
  emailContacto: string;
  items: ItemPedidoRequest[];
  tipoEntrega: string; 
}

export interface PedidoResponse {
  id: number;
  numeroPedido: string;
  usuarioId: number;
  total: number;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  direccionEnvio: string;
  ciudadEnvio: string;
  provinciaEnvio: string;
  codigoPostalEnvio: string;
  paisEnvio: string;
  emailContacto: string;
  telefonoContacto: string;
  tipoEntrega: string;
  preferenciaIdMp: string;
  estadoPagoMp: string;
  items: ItemPedidoResponse[];
  // Agregar estas propiedades para Mercado Pago
  initPoint?: string;
  sandboxInitPoint?: string;
}

export interface ActualizarEstadoPedido {
  estado: string;
}