import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../../models/producto.model';
import { Categoria } from '../../../models/categoria.model';
import { Router } from '@angular/router';
import { CommerceService } from '../../../services/commerce.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-list-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list-admin.component.html',
  styleUrl: './product-list-admin.component.css'
})
export class ProductListAdminComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  cargando = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  eliminandoProducto: number | null = null;

  private backendUrl = 'https://pinceletas-commerce-service.onrender.com';
  private usuarioId = 1; // Por defecto, puedes hacerlo dinámico

  constructor(
    private commerceService: CommerceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProductosConCategorias();
  }

  cargarProductosConCategorias(): void {
    this.cargando = true;
    this.commerceService.getCategoriasConProductos().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        // Extraer todos los productos de todas las categorías
        this.productos = this.extraerProductosDeCategorias(categorias);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.mostrarAlertaError('Error cargando productos');
        this.cargando = false;
      }
    });
  }

  private extraerProductosDeCategorias(categorias: Categoria[]): Producto[] {
    const todosLosProductos: Producto[] = [];
    
    categorias.forEach(categoria => {
      if (categoria.productos && categoria.productos.length > 0) {
        // Asignar la categoría a cada producto
        categoria.productos.forEach(producto => {
          producto.categoria = categoria;
          todosLosProductos.push(producto);
        });
      }
    });
    
    return todosLosProductos;
  }

  getImagenUrl(imagenPath: string): string {
    if (!imagenPath) return '';
    if (imagenPath.startsWith('http')) return imagenPath;
    return `${this.backendUrl}${imagenPath}`;
  }

  editarProducto(productoId: number): void {
    this.router.navigate(['/admin/products/edit', productoId]);
  }

  eliminarProducto(producto: Producto): void {
    this.mostrarConfirmacionEliminacion(
      `¿Estás seguro de que quieres eliminar el producto "${producto.nombre}"?`,
      'Esta acción no se puede deshacer. El producto será removido permanentemente del sistema.'
    ).then((result) => {
      if (result.isConfirmed) {
        this.eliminandoProducto = producto.id;
        this.commerceService.eliminarProducto(producto.id, this.usuarioId).subscribe({
          next: () => {
            // Remover el producto de la lista local
            this.productos = this.productos.filter(p => p.id !== producto.id);
            
            // También remover el producto de la categoría correspondiente
            this.categorias.forEach(categoria => {
              if (categoria.productos) {
                categoria.productos = categoria.productos.filter(p => p.id !== producto.id);
              }
            });
            
            this.mostrarAlertaExito('Producto eliminado exitosamente');
            this.eliminandoProducto = null;
          },
          error: (error) => {
            console.error('Error eliminando producto:', error);
            
            let mensajeError = 'Error eliminando producto';
            if (error?.status === 403) {
              mensajeError = 'No tienes permisos para eliminar este producto';
            } else if (error?.status === 404) {
              mensajeError = 'El producto no fue encontrado';
            } else if (error?.status === 500) {
              mensajeError = 'Error del servidor al eliminar el producto';
            }
            
            this.mostrarAlertaError(mensajeError);
            this.eliminandoProducto = null;
          }
        });
      }
    });
  }

  crearNuevoProducto(): void {
    this.router.navigate(['/productcreate']);
  }

  handleImageError(event: any): void {
    const target = event.target;
    target.style.display = 'none';
    
    // Buscar el siguiente elemento hermano de forma segura
    const nextSibling = target.nextElementSibling;
    if (nextSibling && nextSibling.classList.contains('image-placeholder-admin')) {
      nextSibling.style.display = 'flex';
    }
  }

  // Método auxiliar para obtener el nombre de la categoría de forma segura
  getCategoriaNombre(producto: Producto): string {
    return producto.categoria?.nombre || 'Sin categoría';
  }

  // MÉTODOS SWEETALERT2
  private mostrarAlertaExito(mensaje: string): void {
    Swal.fire({
      title: '¡Éxito!',
      text: mensaje,
      icon: 'success',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#28a745',
      timer: 3000,
      timerProgressBar: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  private mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      title: 'Error',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33',
      showClass: {
        popup: 'animate__animated animate__shakeX'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  private mostrarConfirmacionEliminacion(titulo: string, texto: string): Promise<any> {
    return Swal.fire({
      title: titulo,
      text: texto,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }
}