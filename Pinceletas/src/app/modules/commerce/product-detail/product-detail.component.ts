import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../models/producto.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommerceService } from '../../../services/commerce.service';
import { UserAuthService } from '../../../services/user-auth.service';
import Swal from 'sweetalert2';

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
  private backendUrl = 'http://localhost:8080';
  private usuarioId: number = 1;
  private returnUrl: string = '/productlist';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commerceService: CommerceService,
    private authService: UserAuthService
  ) {}

  ngOnInit(): void {
    // ✅ Obtener returnUrl del estado de navegación
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state && navigation.extras.state['returnUrl']) {
      this.returnUrl = navigation.extras.state['returnUrl'];
    }

    // ✅ También intentar obtenerlo del historial si no está en la navegación actual
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
        // Si solo hay una opción, seleccionarla automáticamente
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

  verificarFavorito(productoId: number): void {
    // Obtener usuario del servicio de autenticación
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

    if (this.esFavorito) {
      // Eliminar de favoritos
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
      // Agregar a favoritos
      const favoritoData = {
        usuarioId: this.usuarioId,
        productoId: this.producto.id
      };
      
      this.commerceService.agregarFavorito(favoritoData).subscribe({
        next: () => {
          this.esFavorito = true;
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
    if (!imagenPath) return '';
    if (imagenPath.startsWith('http')) return imagenPath;
    return `${this.backendUrl}${imagenPath}`;
  }

  seleccionarOpcion(event: any): void {
    this.opcionSeleccionada = event.target.value ? +event.target.value : null;
  }

  volverALista(): void {
    this.router.navigate([this.returnUrl]);
  }

  handleImageError(event: any): void {
    event.target.style.display = 'none';
  }

  agregarAlCarrito(): void {
    if (this.producto) {
      // Validar que si tiene opciones, esté seleccionada una
      if (this.producto.opciones.length > 0 && !this.opcionSeleccionada) {
        alert('Por favor selecciona una opción antes de agregar al carrito');
        return;
      }
      
      // Aquí iría la lógica para agregar al carrito
      console.log('Producto agregado al carrito:', {
        producto: this.producto,
        opcionSeleccionada: this.opcionSeleccionada
      });
      
      alert('Producto agregado al carrito');
    }
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