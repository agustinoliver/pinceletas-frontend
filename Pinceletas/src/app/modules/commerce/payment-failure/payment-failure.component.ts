import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService } from '../../../services/pedido.service';

@Component({
  selector: 'app-payment-failure',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-failure.component.html',
  styleUrl: './payment-failure.component.css'
})
export class PaymentFailureComponent implements OnInit {
  procesando = true;
  preferenceId: string | null = null;
  paymentId: string | null = null;
  numeroPedido: string | null = null;
  mensajeError: string = 'Tu pago no pudo ser procesado';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    console.log(' Pago fallido o rechazado');
    
    this.route.queryParams.subscribe(params => {
      console.log(' Parámetros recibidos:', params);

      this.preferenceId = params['preference_id'] || params['pref_id'];
      this.paymentId = params['payment_id'];
      this.numeroPedido = params['external_reference'];
      const status = params['status'];

      console.log(' Datos extraídos:');
      console.log('  - Preference ID:', this.preferenceId);
      console.log('  - Payment ID:', this.paymentId);
      console.log('  - Status:', status);
      console.log('  - Número de Pedido:', this.numeroPedido);

      this.determinarMensajeError(status);

      if (this.paymentId) {
        this.notificarPagoFallido(status);
      } else {
        this.procesando = false;
      }
    });
  }

  /**
   * Determina el mensaje de error según el estado
   */
  private determinarMensajeError(status: string): void {
    switch(status?.toLowerCase()) {
      case 'rejected':
        this.mensajeError = 'Tu pago fue rechazado. Por favor, verifica los datos de tu tarjeta.';
        break;
      case 'cancelled':
        this.mensajeError = 'El pago fue cancelado.';
        break;
      case 'failure':
        this.mensajeError = 'Hubo un error procesando tu pago.';
        break;
      default:
        this.mensajeError = 'Tu pago no pudo ser procesado. Por favor, intenta nuevamente.';
    }
  }

  /**
   * Notifica al backend que el pago falló
   */
  private notificarPagoFallido(status: string): void {
    console.log('🔔 Notificando al backend sobre pago fallido...');

    const estadoPago = status || 'rejected';

    this.pedidoService.procesarWebhookPago(
      this.preferenceId || '', 
      this.paymentId || '', 
      estadoPago
    ).subscribe({
      next: () => {
        console.log(' Backend notificado sobre pago fallido');
        this.procesando = false;
      },
      error: (error) => {
        console.error(' Error notificando backend:', error);
        this.procesando = false;
      }
    });
  }

  reintentarPago(): void {
    console.log('🔄 Reintentando pago...');
    
    if (this.numeroPedido) {
      this.pedidoService.obtenerPedidoPorNumero(this.numeroPedido).subscribe({
        next: (pedido) => {
          console.log(' Pedido obtenido:', pedido);
          this.router.navigate(['/carrito']);
        },
        error: (error) => {
          console.error(' Error obteniendo pedido:', error);
          this.router.navigate(['/carrito']);
        }
      });
    } else {
      this.router.navigate(['/carrito']);
    }
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }

  verMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }

  /**
   * Contactar soporte
   */
  contactarSoporte(): void {
    console.log(' Contactando soporte...');
    
    const mensaje = `Hola, tuve un problema con mi pago.%0A` +
                   `Número de pedido: ${this.numeroPedido || 'No disponible'}%0A` +
                   `Payment ID: ${this.paymentId || 'No disponible'}%0A` +
                   `Preference ID: ${this.preferenceId || 'No disponible'}`;
    
    
    window.open(`https://wa.me/5493512711316?text=${mensaje}`, '_blank');
    
  
  }
}
