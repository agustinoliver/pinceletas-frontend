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

  // ✅ Simplificado según el paso 3
  ngOnInit(): void {
    console.log('💰 PAYMENT SUCCESS - INICIANDO');
    
    // ✅ El guard ya debe haber restaurado la sesión si existía
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    
    console.log('🔍 Estado final de sesión:');
    console.log('   - Token:', !!token);
    console.log('   - UserData:', !!userData);
    console.log('   - CurrentUser:', this.authService.getCurrentUser());

    if (token && userData) {
      console.log('✅ SESIÓN ACTIVA - PROCESANDO PAGO...');
      this.procesarPagoExitoso();
    } else {
      console.error('❌ ERROR: SESIÓN NO DISPONIBLE');
      
      // ✅ Mostrar mensaje de pago exitoso, sin redirigir al login
      this.procesando = false;
      this.mensajeError = 'Tu pago fue exitoso. Puedes ver tu pedido en "Mis Pedidos".';
      
      // Limpiar cualquier backup residual
      localStorage.removeItem('mp_backup_token');
      localStorage.removeItem('mp_backup_user');
      localStorage.removeItem('mercadoPagoRedirect');
    }
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
   * Actualiza el pedido en backend y limpia el carrito
   */
  private actualizarYLimpiar(): void {
    console.log('🔄 Iniciando actualización y limpieza...');

    const paymentId = this.paymentId || 'simulated-' + Date.now();
    const status = this.status || 'approved';

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
        console.warn('⚠️ Continuando con limpieza de carrito a pesar del error');
        this.procesarPagoExitoso();
      }
    });
  }

  /**
   * Procesa el flujo de pago exitoso y limpia el carrito
   */
  private procesarPagoExitoso(): void {
    console.log('🔄 Procesando pago exitoso...');
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.error('❌ Usuario no disponible');
      this.procesando = false;
      return;
    }

    console.log('🧹 Limpiando carrito...');

    this.commerceService.getCarrito(currentUser.id).subscribe({
      next: (carrito) => {
        console.log(`🛒 Items en carrito: ${carrito.length}`);
        
        if (carrito.length === 0) {
          console.log('✅ Carrito ya está vacío');
          this.finalizarProceso();
          return;
        }

        const eliminaciones = carrito.map(item => 
          this.commerceService.eliminarDelCarrito(item.id)
        );

        Promise.all(eliminaciones.map(obs => obs.toPromise()))
          .then(() => {
            console.log('✅ Carrito limpiado completamente');
            this.finalizarProceso();
          })
          .catch(err => {
            console.error('❌ Error eliminando algunos items:', err);
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
    console.log('✅ Proceso completado. Redirigiendo en 3 segundos...');
    
    setTimeout(() => {
      this.router.navigate(['/mis-pedidos']);
    }, 3000);
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }

  verMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }
}
