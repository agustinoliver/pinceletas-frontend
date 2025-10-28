import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService } from '../../../services/pedido.service';

@Component({
  selector: 'app-payment-pending',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-pending.component.html',
  styleUrl: './payment-pending.component.css'
})
export class PaymentPendingComponent implements OnInit{
  procesando = true;
  preferenceId: string | null = null;
  paymentId: string | null = null;
  numeroPedido: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    console.log('⏳ Pago pendiente de confirmación');
    
    // Capturar parámetros de Mercado Pago
    this.route.queryParams.subscribe(params => {
      console.log('📋 Parámetros recibidos:', params);

      this.preferenceId = params['preference_id'] || params['pref_id'];
      this.paymentId = params['payment_id'];
      this.numeroPedido = params['external_reference'];

      console.log('🔍 Datos extraídos:');
      console.log('  - Preference ID:', this.preferenceId);
      console.log('  - Payment ID:', this.paymentId);
      console.log('  - Número de Pedido:', this.numeroPedido);

      if (this.paymentId) {
        // Notificar al backend que el pago está pendiente
        this.notificarPagoPendiente();
      } else {
        this.procesando = false;
      }
    });
  }

  /**
   * Notifica al backend que el pago está pendiente
   */
  private notificarPagoPendiente(): void {
    console.log('🔔 Notificando al backend sobre pago pendiente...');

    this.pedidoService.procesarWebhookPago(
      this.preferenceId || '', 
      this.paymentId || '', 
      'pending' // Estado pendiente
    ).subscribe({
      next: () => {
        console.log('✅ Backend notificado sobre pago pendiente');
        this.procesando = false;
      },
      error: (error) => {
        console.error('❌ Error notificando backend:', error);
        // Aunque falle, continuar mostrando la página
        this.procesando = false;
      }
    });
  }

  verMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }

  /**
   * Refresca el estado del pedido
   */
  verificarEstado(): void {
    if (!this.numeroPedido) {
      console.warn('⚠️ No hay número de pedido para verificar');
      this.verMisPedidos();
      return;
    }

    console.log('🔄 Verificando estado del pedido:', this.numeroPedido);
    
    this.pedidoService.obtenerPedidoPorNumero(this.numeroPedido).subscribe({
      next: (pedido) => {
        console.log('📦 Estado del pedido:', pedido.estado);
        
        if (pedido.estado === 'PAGADO') {
          console.log('✅ Pago confirmado, redirigiendo...');
          this.router.navigate(['/mis-pedidos']);
        } else if (pedido.estado === 'CANCELADO') {
          console.log('❌ Pago cancelado, redirigiendo...');
          this.router.navigate(['/payment/failure']);
        } else {
          console.log('⏳ Pago aún pendiente');
          alert('Tu pago aún está siendo procesado. Por favor verifica en unos minutos.');
        }
      },
      error: (error) => {
        console.error('❌ Error verificando estado:', error);
        alert('No se pudo verificar el estado del pedido. Por favor contacta a soporte.');
      }
    });
  }
}
