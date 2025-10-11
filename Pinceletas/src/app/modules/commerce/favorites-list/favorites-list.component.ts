import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Favorito } from '../../../models/favorito.model';
import { CommerceService } from '../../../services/commerce.service';
import { UserAuthService } from '../../../services/user-auth.service';
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
  
  // Filtros
  filtroNombre: string = '';
  categoriaSeleccionada: string = 'todas';
  categoriasUnicas: string[] = [];
  
  private backendUrl = 'http://localhost:8080';
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
        console.log('Favoritos recibidos:', data); // ✅ Para debug
        this.favoritos = data;
        this.favoritosFiltrados = [...data];
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

  extraerCategoriasUnicas(): void {
    const categorias = this.favoritos
      .map(f => f.producto?.categoria?.nombre)
      .filter(nombre => nombre && nombre.trim() !== '');
    
    this.categoriasUnicas = [...new Set(categorias)] as string[];
    console.log('Categorías únicas extraídas:', this.categoriasUnicas);
  }

  aplicarFiltros(): void {
    let filtrados = [...this.favoritos];

    // Filtro por categoría
    if (this.categoriaSeleccionada !== 'todas') {
      filtrados = filtrados.filter(f => {
        const categoriaNombre = typeof f.producto.categoria === 'string'
          ? f.producto.categoria
          : f.producto.categoria?.nombre;
        return categoriaNombre === this.categoriaSeleccionada;
      });
    }

    // Filtro por nombre
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

  verDetalleProducto(productoId: number): void {
    // ✅ Pasar correctamente la ruta de retorno
    this.router.navigate(['/productdetail', productoId], { 
      state: { returnUrl: '/favorites' } 
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
            // Remover de las listas locales
            this.favoritos = this.favoritos.filter(f => f.id !== favorito.id);
            this.favoritosFiltrados = this.favoritosFiltrados.filter(f => f.id !== favorito.id);
            this.extraerCategoriasUnicas();
            this.mostrarAlertaExito('Producto eliminado de favoritos');
          },
          error: (error) => {
            console.error('Error eliminando favorito:', error);
            // ✅ Mostrar mensaje de error más específico
            const mensajeError = error.error?.message || 'Error eliminando de favoritos';
            this.mostrarAlertaError(mensajeError);
          }
        });
      }
    });
  }

  agregarAlCarrito(favorito: Favorito, event: Event): void {
    event.stopPropagation();
    
    console.log('Agregando al carrito:', favorito.producto);
    this.mostrarAlertaExito(`"${favorito.producto.nombre}" agregado al carrito`);
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
}