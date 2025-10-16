import { Injectable } from '@angular/core';
import { PedidoResponse } from '../models/pedido.model';
import { MercadoPagoResponse } from '../models/mercado-pago.model';

@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {

  constructor() {}

  // Método para redirigir a Mercado Pago
  redirectToMercadoPago(initPoint: string): void {
    if (initPoint) {
      window.location.href = initPoint;
    } else {
      console.error('No se pudo obtener el enlace de pago de Mercado Pago');
    }
  }

  // Método para procesar respuesta de pago exitoso
  procesarPagoExitoso(preferenceId: string): void {
    console.log('Pago exitoso para preferencia:', preferenceId);
    // Aquí puedes agregar lógica adicional para procesar pagos exitosos
  }

  // Método para procesar respuesta de pago fallido
  procesarPagoFallido(): void {
    console.log('Pago fallido');
    // Aquí puedes agregar lógica adicional para procesar pagos fallidos
  }

  // Método para procesar respuesta de pago pendiente
  procesarPagoPendiente(): void {
    console.log('Pago pendiente');
    // Aquí puedes agregar lógica adicional para procesar pagos pendientes
  }
}