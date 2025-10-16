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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoService: PedidoService,
    private commerceService: CommerceService,
    private authService: UserAuthService
  ) {}

  ngOnInit(): void {
    // Obtener el preference_id de los parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.preferenceId = params['preference_id'];
      
      if (this.preferenceId) {
        this.procesarPagoExitoso();
      } else {
        this.procesando = false;
        this.mensajeError = 'No se recibió información del pago. Por favor contacta a soporte.';
      }
    });
  }

  private procesarPagoExitoso(): void {
    // Obtener el usuario actual
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.procesando = false;
      this.mensajeError = 'Usuario no autenticado. Por favor inicia sesión.';
      return;
    }

    // Limpiar el carrito del usuario ya que el pago fue exitoso
    this.commerceService.getCarrito(currentUser.id).subscribe({
      next: (carrito) => {
        // Eliminar todos los items del carrito
        carrito.forEach(item => {
          this.commerceService.eliminarDelCarrito(item.id).subscribe({
            error: (err) => console.error('Error eliminando item del carrito:', err)
          });
        });
        
        // Después de limpiar, navegar a mis pedidos
        this.procesando = false;
        setTimeout(() => {
          this.router.navigate(['/mis-pedidos']);
        }, 2000);
      },
      error: (err) => {
        console.error('Error obteniendo carrito:', err);
        this.procesando = false;
        // Aún así navegamos a mis pedidos aunque falle la limpieza del carrito
        setTimeout(() => {
          this.router.navigate(['/mis-pedidos']);
        }, 2000);
      }
    });
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }

  verMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }
}
