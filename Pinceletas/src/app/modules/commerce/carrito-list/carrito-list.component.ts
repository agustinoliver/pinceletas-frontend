
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
import { PedidoRequest } from '../../../models/pedido.model';
import { MercadoPagoService } from '../../../services/mercado-pago.service';
import { ConfigService } from '../../../services/config.service';
import { AnimationService } from '../../../services/animation.service';

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

  montoMinimoEnvioGratis: number = 0;
  
  private backendUrl = 'https://pinceletas-commerce-service.onrender.com';
  private usuarioId: number = 1;

  constructor(
    private commerceService: CommerceService,
    private authService: UserAuthService,
    private pedidoService: PedidoService,
    private mercadoPagoService: MercadoPagoService,
    private configService: ConfigService,
    private animationService: AnimationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.usuarioId = currentUser.id;
    }
    this.cargarCarrito();
    this.obtenerMontoMinimoEnvioGratis();
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

    this.carrito.forEach(item => {
      const precioOriginal = item.producto.precio;
      const cantidad = item.cantidad;
      const descuentoPorcentaje = item.producto.descuentoPorcentaje || 0;
      
      subtotalSinDescuento += precioOriginal * cantidad;
      
      const montoDescuentoProducto = precioOriginal * (descuentoPorcentaje / 100) * cantidad;
      totalDescuentos += montoDescuentoProducto;
      
      const precioConDescuento = calcularPrecioConDescuento(precioOriginal, descuentoPorcentaje);
      subtotalConDescuento += precioConDescuento.precioFinal * cantidad;
    });

    this.resumen.subtotal = subtotalSinDescuento;
    this.resumen.descuento = totalDescuentos;

    this.calcularEnvio(subtotalConDescuento);
    
    this.resumen.total = subtotalConDescuento + this.resumen.envio;
  }

  calcularEnvio(subtotalConDescuento: number): void {
    if (this.resumen.tipoEntrega === 'retiro') {
      this.resumen.envio = 0;
      this.actualizarTotal(subtotalConDescuento);
    } else {
      this.configService.calcularCostoEnvio(subtotalConDescuento).subscribe({
        next: (response) => {
          this.resumen.envio = response.costoEnvio;
          this.actualizarTotal(subtotalConDescuento);
        },
        error: (error) => {
          console.error('Error calculando costo de envío:', error);
          this.resumen.envio = subtotalConDescuento > 50000 ? 0 : 2500;
          this.actualizarTotal(subtotalConDescuento);
        }
      });
    }
  }

  actualizarTotal(subtotalConDescuento: number): void {
    this.resumen.total = subtotalConDescuento + this.resumen.envio;
  }


  actualizarResumen(): void {
    let subtotalConDescuento = 0;

    this.carrito.forEach(item => {
      const precioOriginal = item.producto.precio;
      const cantidad = item.cantidad;
      const descuentoPorcentaje = item.producto.descuentoPorcentaje || 0;
      
      const precioConDescuento = calcularPrecioConDescuento(precioOriginal, descuentoPorcentaje);
      subtotalConDescuento += precioConDescuento.precioFinal * cantidad;
    });

    this.calcularEnvio(subtotalConDescuento);
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
          
          this.animationService.decrementarCarritoCount();
          
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
    
    Swal.fire({
      title: 'Selecciona método de entrega',
      html: `
        <div style="text-align: left;">
          <p><strong>Producto:</strong> ${item.producto.nombre}</p>
          <p><strong>Cantidad:</strong> ${item.cantidad}</p>
          <div class="form-check mb-3">
            <input class="form-check-input" type="radio" name="tipoEntregaIndividual" id="envioIndividual" value="envio" checked>
            <label class="form-check-label" for="envioIndividual">
              <i class="fas fa-shipping-fast me-2"></i>
              Envío a domicilio
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="radio" name="tipoEntregaIndividual" id="retiroIndividual" value="retiro">
            <label class="form-check-label" for="retiroIndividual">
              <i class="fas fa-store me-2"></i>
              Retiro en local
            </label>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const selectedOption = document.querySelector('input[name="tipoEntregaIndividual"]:checked') as HTMLInputElement;
        return selectedOption ? selectedOption.value : null;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const tipoEntregaSeleccionado = result.value as 'envio' | 'retiro';
        this.confirmarCompraIndividual(item, tipoEntregaSeleccionado);
      }
    });
  }
  private confirmarCompraIndividual(item: CarritoItem, tipoEntrega: 'envio' | 'retiro'): void {
    const precioConDescuento = calcularPrecioConDescuento(
      item.producto.precio,
      item.producto.descuentoPorcentaje || 0
    );
    
    const subtotalProducto = precioConDescuento.precioFinal * item.cantidad;
    
    let envioProducto = 0;
    if (tipoEntrega === 'envio') {
      this.configService.calcularCostoEnvio(subtotalProducto).subscribe({
        next: (response) => {
          envioProducto = response.costoEnvio;
          this.procesarConfirmacionCompraIndividual(item, tipoEntrega, subtotalProducto, envioProducto);
        },
        error: (error) => {
          console.error('Error calculando envío individual:', error);
          envioProducto = subtotalProducto > 50000 ? 0 : 2500;
          this.procesarConfirmacionCompraIndividual(item, tipoEntrega, subtotalProducto, envioProducto);
        }
      });
    } else {
      this.procesarConfirmacionCompraIndividual(item, tipoEntrega, subtotalProducto, 0);
    }
  }

  private procesarConfirmacionCompraIndividual(
    item: CarritoItem, 
    tipoEntrega: 'envio' | 'retiro', 
    subtotalProducto: number, 
    envioProducto: number
  ): void {
    const totalProducto = subtotalProducto + envioProducto;

    Swal.fire({
      title: '¿Confirmar compra individual?',
      html: `
        <div style="text-align: left;">
          <p><strong>Producto:</strong> ${item.producto.nombre}</p>
          <p><strong>Cantidad:</strong> ${item.cantidad}</p>
          <p><strong>Método de entrega:</strong> ${tipoEntrega === 'envio' ? 'Envío a domicilio' : 'Retiro en local'}</p>
          <p><strong>Subtotal:</strong> $${subtotalProducto.toFixed(2)}</p>
          ${envioProducto > 0 ? `<p><strong>Envío:</strong> $${envioProducto.toFixed(2)}</p>` : '<p><strong>Envío:</strong> Gratis</p>'}
          <p><strong>Total:</strong> $${totalProducto.toFixed(2)}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, comprar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarPagoProductoIndividual(item, tipoEntrega);
      }
    });
  }

  private procesarPagoProductoIndividual(item: CarritoItem, tipoEntrega: 'envio' | 'retiro'): void {
    console.log(' INICIANDO PROCESO DE PAGO INDIVIDUAL');
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    console.log(' SESIÓN AL INICIAR PAGO INDIVIDUAL:');
    console.log('   - Token:', !!token);
    console.log('   - UserData:', !!userData);
    
    if (!token || !userData) {
      console.error(' ERROR: NO HAY SESIÓN AL INICIAR PAGO INDIVIDUAL');
      this.mostrarAlertaError('Debes estar logueado para realizar un pedido');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      this.mostrarAlertaError('Debes estar logueado para realizar un pedido');
      return;
    }

    const pedidoRequest: PedidoRequest = {
      emailContacto: currentUser.email,
      items: [{
        productoId: item.producto.id,
        opcionSeleccionadaId: item.opcionSeleccionada?.id || null,
        cantidad: item.cantidad
      }],
      tipoEntrega: tipoEntrega
    };

    Swal.fire({
      title: 'Procesando...',
      text: 'Creando tu pedido individual y preparando el pago',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    console.log(' LLAMANDO A crearPedido() (INDIVIDUAL)...');
    console.log(' Pedido request individual:', pedidoRequest);

    this.pedidoService.crearPedido(pedidoRequest).subscribe({
      next: (pedidoResponse) => {
        console.log(' RESPUESTA DE crearPedido RECIBIDA (INDIVIDUAL)');
        console.log(' Datos de respuesta individual:', pedidoResponse);
        Swal.close();
        
        Swal.fire({
          title: '¡Pedido individual creado!',
          html: `
            <p><strong>Número de pedido:</strong> ${pedidoResponse.numeroPedido}</p>
            <p><strong>Producto:</strong> ${item.producto.nombre}</p>
            <p><strong>Total:</strong> $${pedidoResponse.total.toFixed(2)}</p>
            <p><strong>Método:</strong> ${tipoEntrega === 'envio' ? 'Envío a domicilio' : 'Retiro en local'}</p>
            <p class="text-muted mt-3">Serás redirigido a Mercado Pago para completar el pago.</p>
          `,
          icon: 'success',
          confirmButtonText: 'Ir a pagar',
          confirmButtonColor: '#28a745',
          timer: 3000,
          timerProgressBar: true
        }).then(() => {
          try {
            console.log(' LLAMANDO A procesarCheckout() (INDIVIDUAL)...');
            console.log(' Respuesta del pedido individual:', pedidoResponse);
            
            if (!pedidoResponse.initPoint && !pedidoResponse.sandboxInitPoint) {
              throw new Error('El servidor no devolvió las URLs de pago');
            }
            
            this.mercadoPagoService.procesarCheckout(pedidoResponse);
          } catch (error: any) {
            console.error(' Error al procesar checkout individual:', error);
            this.mostrarAlertaError(error.message || 'Error al obtener el enlace de pago');
          }
        });
      },
      error: (error) => {
        console.error(' ERROR en crearPedido (INDIVIDUAL):', error);
        Swal.close();
        this.manejarErrorPedido(error);
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
    console.log(' INICIANDO PROCESO DE PAGO...');
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    
    console.log(' Verificación de sesión:', {
      token: !!token,
      userData: !!userData,
      tokenLength: token?.length,
      userDataLength: userData?.length
    });
    
    if (!token || !userData) {
      console.error(' ERROR CRÍTICO: No hay sesión');
      this.mostrarAlertaError('Debes estar logueado para realizar un pedido');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/carrito' }
      });
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      console.error(' Usuario no disponible en servicio');
      this.mostrarAlertaError('Debes estar logueado para realizar un pedido');
      return;
    }

    const pedidoRequest: PedidoRequest = {
      emailContacto: currentUser.email,
      items: this.carrito.map(item => ({
        productoId: item.producto.id,
        opcionSeleccionadaId: item.opcionSeleccionada?.id || null,
        cantidad: item.cantidad
      })),
      tipoEntrega: this.resumen.tipoEntrega
    };

    Swal.fire({
      title: 'Procesando...',
      text: 'Creando tu pedido',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    console.log(' Llamando a crearPedido()...');

    this.pedidoService.crearPedido(pedidoRequest).subscribe({
      next: (pedidoResponse) => {
        console.log(' Pedido creado:', pedidoResponse);
        
        if (!pedidoResponse.sandboxInitPoint && !pedidoResponse.initPoint) {
          console.error(' No hay URLs de pago');
          Swal.close();
          this.mostrarAlertaError('Error: No se generaron las URLs de pago');
          return;
        }
        
        Swal.close();
        
        Swal.fire({
          title: '¡Pedido creado!',
          html: `
            <p><strong>Número:</strong> ${pedidoResponse.numeroPedido}</p>
            <p><strong>Total:</strong> $${pedidoResponse.total.toFixed(2)}</p>
            <p class="text-muted mt-3">Serás redirigido a Mercado Pago</p>
          `,
          icon: 'success',
          confirmButtonText: 'Ir a pagar',
          confirmButtonColor: '#28a745',
          timer: 3000,
          timerProgressBar: true,
          allowOutsideClick: false
        }).then(() => {
          try {
            const tokenFinal = localStorage.getItem('token');
            const userFinal = localStorage.getItem('currentUser');
            
            if (!tokenFinal || !userFinal) {
              throw new Error('Sesión perdida antes de redirigir');
            }
            
            console.log(' Sesión confirmada, procesando checkout...');
            this.mercadoPagoService.procesarCheckout(pedidoResponse);
            
          } catch (error: any) {
            console.error(' Error en checkout:', error);
            this.mostrarAlertaError(error.message || 'Error al procesar el pago');
          }
        });
      },
      error: (error) => {
        console.error(' Error en crearPedido:', error);
        Swal.close();
        this.manejarErrorPedido(error);
      }
    });
  }

  private manejarErrorPedido(error: any): void {
    console.error('Error completo:', error);
    console.error('Error status:', error.status);
    console.error('Error.error:', error.error);
    console.error('Error.error type:', typeof error.error);
    
    let mensajeError = 'Error al procesar el pedido. Intente nuevamente.';
    let esDireccionIncompleta = false;

    if (error.status === 400) {
      if (error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (typeof error.error === 'string') {
        mensajeError = error.error;
      }
      
      esDireccionIncompleta = mensajeError.toLowerCase().includes('dirección') || 
                               mensajeError.toLowerCase().includes('direccion') ||
                               mensajeError.toLowerCase().includes('perfil');
    } 
    else if (error.status === 403) {
      if (error.error && error.error.message) {
        mensajeError = error.error.message;
      } else {
        mensajeError = 'No tienes permisos para realizar esta acción';
      }
    } 
    else if (error.status === 401) {
      mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
    }
    else {
      if (error.error) {
        if (typeof error.error === 'string') {
          mensajeError = error.error;
        } else if (error.error.message) {
          mensajeError = error.error.message;
        }
      }
    }

    if (esDireccionIncompleta) {
      Swal.fire({
        title: 'Dirección Incompleta',
        html: `
          <div style="text-align: left;">
            <p class="text-muted">
              <i class="fas fa-info-circle me-2"></i>
              Necesitas completar tu dirección de envío antes de realizar un pedido.
            </p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-user-edit me-2"></i>Completar Perfil',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ED620C',
        cancelButtonColor: '#6c757d'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/profile']);
        }
      });
    } else {
      this.mostrarAlertaError(mensajeError);
    }
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
  if (item.opcionSeleccionada) {
    return item.opcionSeleccionada.tipo;
  }
  
  if (item.producto.opciones && item.producto.opciones.length > 0) {
    return 'Sin opción seleccionada';
  }
  
  return '';
}

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

private obtenerMontoMinimoEnvioGratis(): void {
  this.configService.getConfiguracionEnvioActiva().subscribe({
    next: (config) => {
      this.montoMinimoEnvioGratis = config.montoMinimoEnvioGratis;
    },
    error: (error) => {
      console.error('Error obteniendo configuración de envío:', error);
      this.montoMinimoEnvioGratis = 50000;
    }
  });
}
}
