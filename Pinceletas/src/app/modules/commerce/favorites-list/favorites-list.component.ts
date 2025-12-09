import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Favorito } from '../../../models/favorito.model';
import { CommerceService } from '../../../services/commerce.service';
import { UserAuthService } from '../../../services/user-auth.service';
import { calcularPrecioConDescuento } from '../../../models/producto.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-favorites-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './favorites-list.component.html',
  styleUrl: './favorites-list.component.css'
})
export class FavoritesListComponent implements OnInit{
 favoritos: Favorito[] = [];
  favoritosFiltrados: Favorito[] = [];
  cargando = false;
  
  filtroNombre: string = '';
  categoriaSeleccionada: string = 'todas';
  categoriasUnicas: string[] = [];
  
  private backendUrl = 'https://pinceletas-commerce-service.onrender.com';
  private usuarioId: number = 1;

  constructor(
    private commerceService: CommerceService,
    private authService: UserAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.usuarioId = currentUser.id;
    }
    this.cargarFavoritos();
  }

  cargarFavoritos(): void {
    this.cargando = true;
    this.commerceService.getFavoritos(this.usuarioId).subscribe({
      next: (data) => {
        console.log('Favoritos recibidos:', data);
        this.favoritos = data.map(favorito => ({
          ...favorito,
          opcionSeleccionada: undefined
        }));
        this.favoritosFiltrados = [...this.favoritos];
        this.extraerCategoriasUnicas();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando favoritos:', error);
        this.mostrarAlertaError('Error cargando productos favoritos');
        this.cargando = false;
      }
    });
  }
  onOpcionChange(favorito: Favorito): void {
    console.log('Opción seleccionada:', favorito.opcionSeleccionada);
  }

  extraerCategoriasUnicas(): void {
    const categorias = this.favoritos
      .map(f => f.producto?.categoria?.nombre)
      .filter(nombre => nombre && nombre.trim() !== '');
    
    this.categoriasUnicas = [...new Set(categorias)] as string[];
    console.log('Categorías únicas extraídas:', this.categoriasUnicas);
  }

  aplicarFiltros(): void {
    let filtrados = [...this.favoritos];

    if (this.categoriaSeleccionada !== 'todas') {
      filtrados = filtrados.filter(f => {
        const categoriaNombre = typeof f.producto.categoria === 'string'
          ? f.producto.categoria
          : f.producto.categoria?.nombre;
        return categoriaNombre === this.categoriaSeleccionada;
      });
    }

    if (this.filtroNombre.trim() !== '') {
      filtrados = filtrados.filter(f =>
        f.producto.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase())
      );
    }

    this.favoritosFiltrados = filtrados;
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.categoriaSeleccionada = 'todas';
    this.favoritosFiltrados = [...this.favoritos];
  }

  verDetalleProducto(productoId: number, opciones?: any): void {
    this.router.navigate(['/productdetail', productoId], { 
      state: { 
        returnUrl: '/favorites',
        opciones: opciones
      } 
    });
  }

  eliminarFavorito(favorito: Favorito, event: Event): void {
    event.stopPropagation();
    
    this.mostrarConfirmacionEliminacion(
      `¿Eliminar "${favorito.producto.nombre}" de favoritos?`
    ).then((result) => {
      if (result.isConfirmed) {
        this.commerceService.eliminarFavorito(this.usuarioId, favorito.producto.id).subscribe({
          next: () => {
            this.favoritos = this.favoritos.filter(f => f.id !== favorito.id);
            this.favoritosFiltrados = this.favoritosFiltrados.filter(f => f.id !== favorito.id);
            this.extraerCategoriasUnicas();
            this.mostrarAlertaExito('Producto eliminado de favoritos');
          },
          error: (error) => {
            console.error('Error eliminando favorito:', error);
            const mensajeError = error.error?.message || 'Error eliminando de favoritos';
            this.mostrarAlertaError(mensajeError);
          }
        });
      }
    });
  }

  agregarAlCarrito(favorito: Favorito, event: Event): void {
    event.stopPropagation();
    
    if (favorito.producto.opciones && favorito.producto.opciones.length > 0 && !favorito.opcionSeleccionada) {
      this.mostrarAlertaError('Por favor selecciona una opción antes de agregar al carrito');
      return;
    }
    
    const carritoRequest = {
      productoId: favorito.producto.id,
      cantidad: 1,
      opcionSeleccionadaId: favorito.opcionSeleccionada || null
    };
    
    this.commerceService.agregarAlCarrito(this.usuarioId, carritoRequest).subscribe({
      next: () => {
        this.mostrarAlertaExito(`"${favorito.producto.nombre}" agregado al carrito`);
        // ✅ OPCIONAL: Limpiar la selección después de agregar
        favorito.opcionSeleccionada = undefined;
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

  volverAProductos(): void {
    this.router.navigate(['/productlist']);
  }

  calcularPrecioProducto(favorito: Favorito) {
    return calcularPrecioConDescuento(
      favorito.producto.precio,
      favorito.producto.descuentoPorcentaje || 0
    );
  }

  tieneDescuento(favorito: Favorito): boolean {
    return (favorito.producto.descuentoPorcentaje || 0) > 0;
  }

  // Métodos SweetAlert
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

  getCategoriaNombre(favorito: Favorito): string {
  // Si categoria es null/undefined o nombre es null/undefined, retorna 'Sin categoría'
  if (!favorito.producto.categoria || !favorito.producto.categoria.nombre) {
    return 'Sin categoría';
  }
  return favorito.producto.categoria.nombre;
  }
}