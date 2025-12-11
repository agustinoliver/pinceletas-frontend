import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { calcularPrecioConDescuento, Producto } from '../../../models/producto.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommerceService } from '../../../services/commerce.service';
import { UserAuthService } from '../../../services/user-auth.service';
import Swal from 'sweetalert2';
import { CarritoRequest } from '../../../models/carrito.model';
import { AnimationService } from '../../../services/animation.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  producto: Producto | null = null;
  opcionSeleccionada: number | null = null;
  esFavorito: boolean = false;
  imagenPrincipal: string = '';
  
  private backendUrl = 'https://pinceletas-commerce-service.onrender.com';
  private usuarioId: number = 1;
  private returnUrl: string = '/productlist';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commerceService: CommerceService,
    private authService: UserAuthService,
    private animationService: AnimationService
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state && navigation.extras.state['returnUrl']) {
      this.returnUrl = navigation.extras.state['returnUrl'];
    }

    const state = window.history.state;
    if (state && state.returnUrl) {
      this.returnUrl = state.returnUrl;
    }

    this.route.params.subscribe(params => {
      const productId = +params['id'];
      this.cargarProducto(productId);
      this.verificarFavorito(productId);
    });
  }

  cargarProducto(id: number): void {
    this.commerceService.getProductoById(id).subscribe({
      next: (producto) => {
        this.producto = producto;
        console.log(' Producto cargado:', producto);
        console.log(' Imágenes del producto:', producto.imagenes);
        
        if (producto.imagenes && producto.imagenes.length > 0) {
          this.imagenPrincipal = producto.imagenes[0];
        }
        
        if (producto.opciones && producto.opciones.length === 1) {
          this.opcionSeleccionada = producto.opciones[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar el producto:', error);
        this.router.navigate(['/productlist']);
      }
    });
  }

  cambiarImagenPrincipal(imagen: string): void {
    console.log(' Cambiando imagen principal a:', imagen);
    console.log(' URL completa nueva imagen:', this.getImagenUrl(imagen));
    this.imagenPrincipal = imagen;
  }

  handleThumbnailError(event: any): void {
    console.error(' Error cargando miniatura:', event);
    const target = event.target;
    target.style.display = 'none';
  }

  verificarFavorito(productoId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.usuarioId = currentUser.id;
      
      this.commerceService.getFavoritos(this.usuarioId).subscribe({
        next: (favoritos) => {
          this.esFavorito = favoritos.some(f => f.producto.id === productoId);
        },
        error: (error) => {
          console.error('Error verificando favorito:', error);
        }
      });
    }
  }

  toggleFavorito(): void {
  if (!this.producto) return;

  const currentUser = this.authService.getCurrentUser();
  if (!currentUser) {
    this.mostrarAlertaLogin('agregar productos a favoritos');
    return;
  }

  if (this.esFavorito) {
    this.commerceService.eliminarFavorito(this.usuarioId, this.producto.id).subscribe({
      next: () => {
        this.esFavorito = false;
        this.mostrarAlertaExito('Producto eliminado de favoritos');
      },
      error: (error) => {
        console.error('Error eliminando favorito:', error);
        this.mostrarAlertaError('Error eliminando de favoritos');
      }
    });
  } else {
    const favoritoData = {
      usuarioId: this.usuarioId,
      productoId: this.producto.id
    };
    
    this.commerceService.agregarFavorito(favoritoData).subscribe({
      next: () => {
        this.esFavorito = true;
        this.animationService.agregarAFavoritos(
          this.producto!.id,
          this.producto!.nombre,
          this.producto!.imagenes?.[0] ? this.getImagenUrl(this.producto!.imagenes[0]) : undefined
        );
        this.mostrarAlertaExito('Producto agregado a favoritos');
      },
      error: (error) => {
        console.error('Error agregando favorito:', error);
        this.mostrarAlertaError('Error agregando a favoritos');
      }
    });
  }
}

  getImagenUrl(imagenPath: string): string {
    if (!imagenPath) {
      console.warn(' imagenPath está vacío');
      return '';
    }
    if (imagenPath.startsWith('http')) {
      console.log(' URL ya es completa:', imagenPath);
      return imagenPath;
    }
    const urlCompleta = `${this.backendUrl}${imagenPath}`;
    console.log(' URL construida:', urlCompleta);
    return urlCompleta;
  }

  seleccionarOpcion(event: any): void {
    this.opcionSeleccionada = event.target.value ? +event.target.value : null;
  }

  volverALista(): void {
    this.router.navigate([this.returnUrl]);
  }

  handleImageError(event: any): void {
    console.error(' Error cargando imagen principal:', event);
    event.target.style.display = 'none';
  }

  agregarAlCarrito(): void {
  if (!this.producto) return;

  const currentUser = this.authService.getCurrentUser();
  if (!currentUser) {
    this.mostrarAlertaLogin('agregar productos al carrito');
    return;
  }

  if (this.producto.opciones && this.producto.opciones.length > 0 && !this.opcionSeleccionada) {
    this.mostrarAlertaError('Por favor selecciona una opción antes de agregar al carrito');
    return;
  }
  
  const carritoRequest: CarritoRequest = {
    productoId: this.producto.id,
    cantidad: 1,
    opcionSeleccionadaId: this.opcionSeleccionada || null
  };
  
  this.commerceService.agregarAlCarrito(this.usuarioId, carritoRequest).subscribe({
    next: () => {
      this.animationService.agregarAlCarrito(
        this.producto!.id,
        this.producto!.nombre,
        this.producto!.imagenes?.[0] ? this.getImagenUrl(this.producto!.imagenes[0]) : undefined
      );
      this.mostrarAlertaExito('Producto agregado al carrito exitosamente');
    },
    error: (error) => {
      console.error('Error agregando al carrito:', error);
      if (error.error?.message?.includes('ya está en el carrito')) {
        this.mostrarAlertaError('Este producto ya está en tu carrito con la misma opción');
      } else {
        this.mostrarAlertaError('Error al agregar el producto al carrito');
      }
    }
  });
}

private mostrarAlertaLogin(accion: string): void {
  Swal.fire({
    title: '¡Inicia sesión!',
    text: `Para ${accion}, necesitas iniciar sesión primero.`,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Ir a iniciar sesión',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ed620c',
    cancelButtonColor: '#6c757d',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
    }
  });
}

  calcularPrecio() {
    if (!this.producto) return null;
    return calcularPrecioConDescuento(
      this.producto.precio,
      this.producto.descuentoPorcentaje || 0
    );
  }

  tieneDescuento(): boolean {
    return this.producto ? (this.producto.descuentoPorcentaje || 0) > 0 : false;
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
}