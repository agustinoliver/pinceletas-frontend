import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService } from '../../../services/pedido.service';
import { CommerceService } from '../../../services/commerce.service';
import { UserAuthService } from '../../../services/user-auth.service';
import Swal from 'sweetalert2';

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
    console.log('💰 PAYMENT SUCCESS - INICIANDO');
    
    // ✅ SOLUCIÓN: Esperar un ciclo para que el guard termine
    setTimeout(() => {
      this.verificarSesionYProcesar();
    }, 100);
  }

  private verificarSesionYProcesar(): void {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    
    console.log('🔍 Estado de sesión después del guard:', {
      token: !!token,
      userData: !!userData,
      currentUser: this.authService.getCurrentUser()
    });

    if (!token || !userData) {
      console.error('❌ SESIÓN NO DISPONIBLE después del guard');
      this.procesando = false;
      this.mensajeError = 'Tu pago fue exitoso pero hubo un problema con la sesión. Por favor, inicia sesión para ver tu pedido.';
      
      Swal.fire({
        title: 'Pago Exitoso',
        html: `
          <p>Tu pago se procesó correctamente.</p>
          <p>Por favor, inicia sesión para ver tu pedido.</p>
        `,
        icon: 'success',
        confirmButtonText: 'Ir al Login',
        confirmButtonColor: '#28a745',
        allowOutsideClick: false
      }).then(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/mis-pedidos' }
        });
      });
      return;
    }

    console.log('✅ SESIÓN ACTIVA - Procesando pago...');
    this.capturarParametrosMercadoPago();
  }
  private capturarParametrosMercadoPago(): void {
    this.route.queryParams.subscribe(params => {
      console.log('📋 Parámetros de Mercado Pago:', params);

      this.preferenceId = params['preference_id'] || params['pref_id'];
      this.paymentId = params['payment_id'] || params['collection_id'];
      this.status = params['status'];
      this.numeroPedido = params['external_reference'];

      console.log('🔍 Datos extraídos:', {
        preferenceId: this.preferenceId,
        paymentId: this.paymentId,
        status: this.status,
        numeroPedido: this.numeroPedido
      });

      // Si tenemos info del pago, actualizar backend
      if (this.paymentId && this.preferenceId) {
        this.actualizarPagoEnBackend();
      } else {
        // Si no hay paymentId, buscar último pedido pendiente
        console.log('⚠️ No hay payment_id, buscando último pedido...');
        this.buscarUltimoPedido();
      }
    });
  }
  private actualizarPagoEnBackend(): void {
    console.log('🔄 Actualizando pago en backend...');

    const status = this.status || 'approved';

    this.pedidoService.procesarWebhookPago(
      this.preferenceId || '',
      this.paymentId || '',
      status
    ).subscribe({
      next: () => {
        console.log('✅ Pago actualizado en backend');
        this.limpiarCarritoYFinalizar();
      },
      error: (error) => {
        console.error('❌ Error actualizando pago:', error);
        // Continuar de todas formas con la limpieza
        this.limpiarCarritoYFinalizar();
      }
    });
  }

  /**
   * Busca el último pedido PENDIENTE_PAGO del usuario
   */
  private buscarUltimoPedido(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      console.error('❌ Usuario no disponible');
      this.procesando = false;
      this.mensajeError = 'Usuario no autenticado';
      return;
    }

    console.log('🔍 Buscando último pedido del usuario:', currentUser.id);

    this.pedidoService.obtenerPedidosPorUsuario(currentUser.id).subscribe({
      next: (pedidos) => {
        console.log('📦 Pedidos encontrados:', pedidos.length);
        
        const pedidoPendiente = pedidos
          .filter(p => p.estado === 'PENDIENTE_PAGO')
          .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())[0];

        if (pedidoPendiente) {
          console.log('✅ Pedido pendiente encontrado:', pedidoPendiente.numeroPedido);
          this.preferenceId = pedidoPendiente.preferenciaIdMp;
          this.numeroPedido = pedidoPendiente.numeroPedido;
          this.actualizarPagoEnBackend();
        } else {
          console.warn('⚠️ No se encontró pedido pendiente');
          this.limpiarCarritoYFinalizar();
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
   * Actualiza el pedido en backend y limpia el carrito
   */
  private limpiarCarritoYFinalizar(): void {
    console.log('🧹 Limpiando carrito...');
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      console.error('❌ Usuario no disponible para limpiar carrito');
      this.finalizarProceso();
      return;
    }

    this.commerceService.getCarrito(currentUser.id).subscribe({
      next: (carrito) => {
        console.log(`🛒 Items en carrito: ${carrito.length}`);
        
        if (carrito.length === 0) {
          console.log('✅ Carrito ya vacío');
          this.finalizarProceso();
          return;
        }

        const eliminaciones = carrito.map(item => 
          this.commerceService.eliminarDelCarrito(item.id)
        );

        Promise.all(eliminaciones.map(obs => obs.toPromise()))
          .then(() => {
            console.log('✅ Carrito limpiado');
            this.finalizarProceso();
          })
          .catch(err => {
            console.error('❌ Error limpiando carrito:', err);
            this.finalizarProceso();
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
    console.log('✅ Proceso completado');
    
    // Mostrar mensaje y redirigir
    setTimeout(() => {
      this.verMisPedidos();
    }, 3000);
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }

  verMisPedidos(): void {
    if (!this.authService.isLoggedIn()) {
      console.error('❌ Usuario no logueado, redirigiendo a login');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/mis-pedidos' }
      });
      return;
    }
    
    console.log('➡️ Navegando a mis pedidos');
    this.router.navigate(['/mis-pedidos']);
  }
}
