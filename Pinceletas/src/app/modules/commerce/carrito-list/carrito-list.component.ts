
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarritoItem, ResumenCarrito } from '../../../models/carrito.model';
import { CommerceService } from '../../../services/commerce.service';
import { UserAuthService } from '../../../services/user-auth.service';
import { calcularPrecioConDescuento } from '../../../models/producto.model';
import Swal from 'sweetalert2';
import { PedidoService } from '../../../services/pedido.service';
import { MercadoPagoService } from '../../../services/mercado-pago.service';
import { PedidoRequest } from '../../../models/pedido.model';

@Component({
  selector: 'app-carrito-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito-list.component.html',
  styleUrl: './carrito-list.component.css'
})
export class CarritoListComponent implements OnInit{
carrito: CarritoItem[] = [];
  cargando = false;
  resumen: ResumenCarrito = {
    subtotal: 0,
    envio: 0,
    descuento: 0,
    total: 0,
    tipoEntrega: 'envio'
  };
  
  private backendUrl = 'http://localhost:8080';
  private usuarioId: number = 1;

  constructor(
    private commerceService: CommerceService,
    private authService: UserAuthService,
    private pedidoService: PedidoService,
    private mercadoPagoService: MercadoPagoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.usuarioId = currentUser.id;
    }
    this.cargarCarrito();
  }

  cargarCarrito(): void {
    this.cargando = true;
    this.commerceService.getCarrito(this.usuarioId).subscribe({
      next: (data) => {
        console.log('Carrito recibido:', data);
        this.carrito = data;
        this.calcularResumen();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando carrito:', error);
        this.mostrarAlertaError('Error cargando el carrito');
        this.cargando = false;
      }
    });
  }

  calcularResumen(): void {
  let subtotalSinDescuento = 0;
  let totalDescuentos = 0;
  let subtotalConDescuento = 0;

  // Calcular subtotal sin descuento y total de descuentos
  this.carrito.forEach(item => {
    const precioOriginal = item.producto.precio;
    const cantidad = item.cantidad;
    const descuentoPorcentaje = item.producto.descuentoPorcentaje || 0;
    
    // Subtotal sin descuento
    subtotalSinDescuento += precioOriginal * cantidad;
    
    // Monto de descuento para este producto
    const montoDescuentoProducto = precioOriginal * (descuentoPorcentaje / 100) * cantidad;
    totalDescuentos += montoDescuentoProducto;
    
    // Subtotal con descuento
    const precioConDescuento = calcularPrecioConDescuento(precioOriginal, descuentoPorcentaje);
    subtotalConDescuento += precioConDescuento.precioFinal * cantidad;
  });

  // Asignar los valores al resumen
  this.resumen.subtotal = subtotalSinDescuento;
  this.resumen.descuento = totalDescuentos;

  // ✅ NUEVO: Calcular envío basado en tipo de entrega
  this.calcularEnvio(subtotalConDescuento);
  
  // Envío gratis si el subtotal con descuento es mayor a 50.000
  this.resumen.envio = subtotalConDescuento > 50000 ? 0 : 0; // Cambia el segundo 0 por el costo de envío si quieres

  // Calcular total (subtotal con descuento + envío)
  this.resumen.total = subtotalConDescuento + this.resumen.envio;
}

 // ✅ NUEVO: Método para calcular el costo de envío
  calcularEnvio(subtotalConDescuento: number): void {
    if (this.resumen.tipoEntrega === 'retiro') {
      this.resumen.envio = 0; // Retiro en local siempre es gratis
    } else {
      // Envío a domicilio: gratis si el subtotal es mayor a 50.000
      this.resumen.envio = subtotalConDescuento > 50000 ? 0 : 2500; // Cambia 2500 por tu costo de envío
    }
  }
// ✅ NUEVO: Método para actualizar el resumen cuando cambia el tipo de entrega
  actualizarResumen(): void {
    let subtotalConDescuento = 0;

    // Recalcular subtotal con descuento
    this.carrito.forEach(item => {
      const precioOriginal = item.producto.precio;
      const cantidad = item.cantidad;
      const descuentoPorcentaje = item.producto.descuentoPorcentaje || 0;
      
      const precioConDescuento = calcularPrecioConDescuento(precioOriginal, descuentoPorcentaje);
      subtotalConDescuento += precioConDescuento.precioFinal * cantidad;
    });

    // Recalcular envío
    this.calcularEnvio(subtotalConDescuento);
    
    // Recalcular total
    this.resumen.total = subtotalConDescuento + this.resumen.envio;
  }

  modificarCantidad(item: CarritoItem, nuevaCantidad: number): void {
    if (nuevaCantidad < 1) {
      this.mostrarAlertaError('La cantidad mínima es 1');
      return;
    }

    if (nuevaCantidad > 99) {
      this.mostrarAlertaError('La cantidad máxima es 99');
      return;
    }

    this.commerceService.modificarCantidadCarrito(item.id, nuevaCantidad).subscribe({
      next: (itemActualizado) => {
        const index = this.carrito.findIndex(i => i.id === item.id);
        if (index !== -1) {
          this.carrito[index].cantidad = nuevaCantidad;
        }
        this.calcularResumen();
        this.mostrarAlertaExito('Cantidad actualizada');
      },
      error: (error) => {
        console.error('Error modificando cantidad:', error);
        this.mostrarAlertaError('Error al actualizar la cantidad');
      }
    });
  }

  eliminarItem(item: CarritoItem, event: Event): void {
    event.stopPropagation();
    
    this.mostrarConfirmacionEliminacion(
      `¿Eliminar "${item.producto.nombre}" del carrito?`
    ).then((result) => {
      if (result.isConfirmed) {
        this.commerceService.eliminarDelCarrito(item.id).subscribe({
          next: () => {
            this.carrito = this.carrito.filter(i => i.id !== item.id);
            this.calcularResumen();
            this.mostrarAlertaExito('Producto eliminado del carrito');
          },
          error: (error) => {
            console.error('Error eliminando del carrito:', error);
            this.mostrarAlertaError('Error eliminando del carrito');
          }
        });
      }
    });
  }

  comprarSoloEsteProducto(item: CarritoItem, event: Event): void {
    event.stopPropagation();
    
    const precioConDescuento = calcularPrecioConDescuento(
      item.producto.precio,
      item.producto.descuentoPorcentaje || 0
    );
    const totalProducto = precioConDescuento.precioFinal * item.cantidad;

    Swal.fire({
      title: '¿Comprar solo este producto?',
      text: `${item.producto.nombre} - $${totalProducto.toFixed(2)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, comprar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Comprar solo este producto:', item);
        this.mostrarAlertaExito('Procesando compra individual...');
      }
    });
  }

  completarCompra(): void {
    if (this.carrito.length === 0) {
      this.mostrarAlertaError('El carrito está vacío');
      return;
    }

    Swal.fire({
      title: '¿Completar la compra?',
      html: `
        <div style="text-align: left;">
          <p><strong>Total a pagar:</strong> $${this.resumen.total.toFixed(2)}</p>
          <p><strong>Productos:</strong> ${this.carrito.length}</p>
          <p><strong>Método de entrega:</strong> ${this.resumen.tipoEntrega === 'envio' ? 'Envío a domicilio' : 'Retiro en local'}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, proceder al pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarPago();
      }
    });
  }
  private procesarPago(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      this.mostrarAlertaError('Debes estar logueado para realizar un pedido');
      return;
    }

    const pedidoRequest: PedidoRequest = {
      emailContacto: currentUser.email,
      items: this.carrito.map(item => ({
        productoId: item.producto.id,
        opcionSeleccionadaId: item.opcionSeleccionada?.id || null,
        cantidad: item.cantidad
      }))
    };

    // ✅ Mostrar loading mientras se procesa
    Swal.fire({
      title: 'Procesando...',
      text: 'Creando tu pedido y preparando el pago',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.pedidoService.crearPedido(pedidoRequest).subscribe({
      next: (pedidoResponse) => {
        Swal.close(); // Cerrar el loading
        
        // ✅ Usar sandboxInitPoint si está disponible, sino initPoint
        const mercadoPagoUrl = pedidoResponse.sandboxInitPoint || pedidoResponse.initPoint;
        
        if (mercadoPagoUrl) {
          // ✅ Mostrar confirmación antes de redirigir
          Swal.fire({
            title: '¡Pedido creado!',
            html: `
              <p><strong>Número de pedido:</strong> ${pedidoResponse.numeroPedido}</p>
              <p><strong>Total:</strong> $${pedidoResponse.total.toFixed(2)}</p>
              <p class="text-muted mt-3">Serás redirigido a Mercado Pago para completar el pago.</p>
            `,
            icon: 'success',
            confirmButtonText: 'Ir a pagar',
            confirmButtonColor: '#28a745',
            timer: 3000,
            timerProgressBar: true
          }).then(() => {
            this.mercadoPagoService.redirectToMercadoPago(mercadoPagoUrl);
          });
        } else {
          this.mostrarAlertaError('No se pudo obtener el enlace de pago');
        }
      },
      error: (error) => {
        Swal.close(); // Cerrar el loading
        console.error('Error creando pedido:', error);
        
        // ✅ Mensaje de error más específico
        let mensajeError = 'Error al procesar el pedido. Intente nuevamente.';
        
        if (error.error?.message) {
          mensajeError = error.error.message;
        } else if (error.status === 403) {
          mensajeError = 'No tienes permisos para realizar esta acción';
        } else if (error.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
        }
        
        this.mostrarAlertaError(mensajeError);
      }
    });
  }

  verDetalleProducto(productoId: number): void {
    this.router.navigate(['/productdetail', productoId], {
      state: { returnUrl: '/carrito' }
    });
  }

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }

  getImagenUrl(imagenPath: string): string {
    if (!imagenPath) return '';
    if (imagenPath.startsWith('http')) return imagenPath;
    const path = imagenPath.startsWith('/') ? imagenPath : `/${imagenPath}`;
    return `${this.backendUrl}${path}`;
  }

  handleImageError(event: any): void {
    const target = event.target;
    target.style.display = 'none';
    
    const nextSibling = target.nextElementSibling;
    if (nextSibling && nextSibling.classList.contains('image-placeholder')) {
      nextSibling.style.display = 'flex';
    }
  }

  getOpcionSeleccionada(item: CarritoItem): string {
  // ✅ NUEVO: Mostrar la opción específica seleccionada
  if (item.opcionSeleccionada) {
    return item.opcionSeleccionada.tipo;
  }
  
  // Si no hay opción seleccionada pero el producto tiene opciones
  if (item.producto.opciones && item.producto.opciones.length > 0) {
    return 'Sin opción seleccionada';
  }
  
  return '';
}

  // ✅ NUEVO: Métodos para calcular precios con descuento
  calcularPrecioProducto(item: CarritoItem) {
    return calcularPrecioConDescuento(
      item.producto.precio,
      item.producto.descuentoPorcentaje || 0
    );
  }

  tieneDescuento(item: CarritoItem): boolean {
    return (item.producto.descuentoPorcentaje || 0) > 0;
  }

  private mostrarAlertaExito(mensaje: string): void {
    Swal.fire({
      title: '¡Éxito!',
      text: mensaje,
      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true
    });
  }

  private mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      title: 'Error',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33'
    });
  }

  private mostrarConfirmacionEliminacion(titulo: string): Promise<any> {
    return Swal.fire({
      title: titulo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });
  }
}
