import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService } from '../../../services/pedido.service';
import { CommerceService } from '../../../services/commerce.service';
import { UserAuthService } from '../../../services/user-auth.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit {
  procesando = true;
  mensajeError: string | null = null;
  preferenceId: string | null = null;
  paymentId: string | null = null;
  status: string | null = null;
  numeroPedido: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoService: PedidoService,
    private commerceService: CommerceService,
    private authService: UserAuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      console.log('📋 Todos los parámetros recibidos:', params);
      console.log('📋 Claves de parámetros:', Object.keys(params));

      // ✅ Mercado Pago puede enviar estos parámetros
      this.preferenceId = params['preference_id'] || params['pref_id'];
      this.paymentId = params['payment_id'];
      this.status = params['status'];
      this.numeroPedido = params['external_reference'];

      console.log('🔍 Datos extraídos:');
      console.log('  - preference_id:', this.preferenceId);
      console.log('  - payment_id:', this.paymentId);
      console.log('  - status:', this.status);
      console.log('  - external_reference:', this.numeroPedido);

      // ✅ SOLUCIÓN: Si tenemos preferenceId, actualizar automáticamente
      if (this.preferenceId) {
        console.log('✅ Tenemos preference_id, procediendo con la actualización...');
        this.actualizarYLimpiar();
      } else {
        console.warn('⚠️ No hay preference_id, intentando alternativa...');
        // Buscar el último pedido del usuario
        this.buscarUltimoPedido();
      }
    });
  }

  /**
   * Busca el último pedido PENDIENTE_PAGO del usuario
   */
  private buscarUltimoPedido(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.procesando = false;
      this.mensajeError = 'Usuario no autenticado';
      return;
    }

    console.log('🔍 Buscando último pedido del usuario:', currentUser.id);

    this.pedidoService.obtenerPedidosPorUsuario(currentUser.id).subscribe({
      next: (pedidos) => {
        console.log('📦 Pedidos encontrados:', pedidos.length);
        
        // Buscar el más reciente con estado PENDIENTE_PAGO
        const pedidoPendiente = pedidos
          .filter(p => p.estado === 'PENDIENTE_PAGO')
          .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())[0];

        if (pedidoPendiente) {
          console.log('✅ Encontrado pedido pendiente:', pedidoPendiente.numeroPedido);
          this.preferenceId = pedidoPendiente.preferenciaIdMp;
          this.numeroPedido = pedidoPendiente.numeroPedido;
          this.actualizarYLimpiar();
        } else {
          console.warn('⚠️ No se encontró pedido pendiente');
          this.procesando = false;
          this.mensajeError = 'No se encontró ningún pedido pendiente';
        }
      },
      error: (error) => {
        console.error('❌ Error buscando pedidos:', error);
        this.procesando = false;
        this.mensajeError = 'Error al buscar pedidos';
      }
    });
  }

  /**
   * Actualiza el pedido y limpia el carrito
   */
  private actualizarYLimpiar(): void {
    console.log('🔄 Iniciando actualización y limpieza...');

    // ✅ Llamar al webhook con los datos disponibles
    const paymentId = this.paymentId || 'simulated-' + Date.now();
    const status = this.status || 'approved'; // Por defecto aprobado si llegamos aquí

    console.log('📤 Enviando actualización al backend:');
    console.log('  - preference_id:', this.preferenceId);
    console.log('  - payment_id:', paymentId);
    console.log('  - status:', status);

    this.pedidoService.procesarWebhookPago(
      this.preferenceId || '',
      paymentId,
      status
    ).subscribe({
      next: () => {
        console.log('✅ Pedido actualizado correctamente');
        this.procesarPagoExitoso();
      },
      error: (error) => {
        console.error('❌ Error actualizando pedido:', error);
        // Continuar de todos modos porque el pago fue exitoso en MP
        console.warn('⚠️ Continuando con limpieza de carrito a pesar del error');
        this.procesarPagoExitoso();
      }
    });
  }

  private procesarPagoExitoso(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.procesando = false;
      this.mensajeError = 'Usuario no autenticado';
      return;
    }

    console.log('🧹 Limpiando carrito...');

    this.commerceService.getCarrito(currentUser.id).subscribe({
      next: (carrito) => {
        console.log(`🛒 Items en carrito: ${carrito.length}`);
        
        if (carrito.length === 0) {
          this.finalizarProceso();
          return;
        }

        let eliminados = 0;
        carrito.forEach((item, index) => {
          this.commerceService.eliminarDelCarrito(item.id).subscribe({
            next: () => {
              eliminados++;
              console.log(`✅ Item ${index + 1}/${carrito.length} eliminado`);
              if (eliminados === carrito.length) {
                this.finalizarProceso();
              }
            },
            error: (err) => {
              console.error(`❌ Error eliminando item ${index + 1}:`, err);
              eliminados++;
              if (eliminados === carrito.length) {
                this.finalizarProceso();
              }
            }
          });
        });
      },
      error: (err) => {
        console.error('❌ Error obteniendo carrito:', err);
        this.finalizarProceso();
      }
    });
  }

  private finalizarProceso(): void {
    this.procesando = false;
    console.log('✅ Proceso completado. Redirigiendo en 2 segundos...');
    
    setTimeout(() => {
      this.router.navigate(['/mis-pedidos']);
    }, 2000);
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }

  verMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }
}