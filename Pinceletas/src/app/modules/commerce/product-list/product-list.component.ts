import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommerceService } from '../../../services/commerce.service';
import { Categoria} from '../../../models/categoria.model';
import { calcularPrecioConDescuento, Producto } from '../../../models/producto.model';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserAuthService } from '../../../services/user-auth.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {
  categorias: Categoria[] = [];
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  productosPaginados: Producto[] = [];
  productosFavoritos: Set<number> = new Set();

  categoriaSeleccionada: string = 'todas';
  filtroNombre: string = '';
  
  // Paginación
  paginaActual: number = 1;
  productosPorPagina: number = 6;
  totalPaginas: number = 0;
  
  private backendUrl = 'https://pinceletas-commerce-service.onrender.com';
  private usuarioId: number = 1;

  constructor(
    private commerceService: CommerceService,
    private authService: UserAuthService,
    private router: Router
  ) {}

  getImagenUrl(imagenPath: string): string {
    if (!imagenPath) return '';
    if (imagenPath.startsWith('http')) return imagenPath;
    return `${this.backendUrl}${imagenPath}`;
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.usuarioId = currentUser.id;
    }
    
    this.cargarFavoritos();
    this.commerceService.getCategoriasConProductos().subscribe((data) => {
      this.categorias = data;
      this.actualizarProductos();
    });
  }

  cargarFavoritos(): void {
    this.commerceService.getFavoritos(this.usuarioId).subscribe({
      next: (favoritos) => {
        this.productosFavoritos = new Set(favoritos.map(f => f.producto.id));
      },
      error: (error) => {
        console.error('Error cargando favoritos:', error);
      }
    });
  }

  esFavorito(productoId: number): boolean {
    return this.productosFavoritos.has(productoId);
  }

  toggleFavorito(producto: Producto, event: Event): void {
    event.stopPropagation();
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.mostrarAlertaLogin('agregar productos a favoritos');
      return;
    }
    
    if (this.esFavorito(producto.id)) {
      this.commerceService.eliminarFavorito(this.usuarioId, producto.id).subscribe({
        next: () => {
          this.productosFavoritos.delete(producto.id);
          this.mostrarAlertaExito(`"${producto.nombre}" eliminado de favoritos`);
        },
        error: (error) => {
          console.error('Error eliminando favorito:', error);
          this.mostrarAlertaError('Error al eliminar de favoritos');
        }
      });
    } else {
      const favoritoData = {
        usuarioId: this.usuarioId,
        productoId: producto.id
      };
      
      this.commerceService.agregarFavorito(favoritoData).subscribe({
        next: () => {
          this.productosFavoritos.add(producto.id);
          this.mostrarAlertaExito(`"${producto.nombre}" agregado a favoritos`);
        },
        error: (error) => {
          console.error('Error agregando favorito:', error);
          this.mostrarAlertaError('Error al agregar a favoritos');
        }
      });
    }
  }

  actualizarProductos(): void {
    const productos = this.categorias.flatMap((c) => 
      c.productos ? c.productos.filter(p => p.activo) : []
    );
    this.productos = productos;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.productos];

    if (this.categoriaSeleccionada !== 'todas') {
      const categoria = this.categorias.find(
        (c) => c.nombre === this.categoriaSeleccionada
      );
      filtrados = categoria && categoria.productos 
        ? categoria.productos.filter(p => p.activo) 
        : [];
    }

    if (this.filtroNombre.trim() !== '') {
      filtrados = filtrados.filter((p) =>
        p.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase())
      );
    }

    this.productosFiltrados = filtrados;
    this.paginaActual = 1;
    this.calcularPaginacion();
    this.actualizarPaginacion();
  }

  limpiarFiltros(): void {
    this.categoriaSeleccionada = 'todas';
    this.filtroNombre = '';
    this.aplicarFiltros();
  }

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
    if (this.totalPaginas === 0) this.totalPaginas = 1;
  }

  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    const fin = inicio + this.productosPorPagina;
    this.productosPaginados = this.productosFiltrados.slice(inicio, fin);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
  }

  getPaginasArray(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;
    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginas - 1);
    
    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  verDetalleProducto(productoId: number): void {
    this.router.navigate(['/productdetail', productoId]);
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
  }
  
  calcularPrecio(producto: Producto) {
    return calcularPrecioConDescuento(
      producto.precio,
      producto.descuentoPorcentaje || 0
    );
  }

  tieneDescuento(producto: Producto): boolean {
    return (producto.descuentoPorcentaje || 0) > 0;
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

  private mostrarAlertaExito(mensaje: string): void {
    Swal.fire({
      title: '¡Éxito!',
      text: mensaje,
      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#28a745',
      timer: 2000,
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