import { Component, OnInit } from '@angular/core';
import { OpcionProducto, Producto } from '../../../models/producto.model';
import { Categoria } from '../../../models/categoria.model';
import { CommerceService } from '../../../services/commerce.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.css'
})
export class ProductEditComponent implements OnInit {
  // Datos del producto a editar
  productoId: number = 0;
  productoOriginal: Producto | null = null;
  
  producto = {
    id: 0,
    nombre: '',
    descripcion: '',
    precio: 0,
    activo: true,
    categoriaId: 0,
    opcionesIds: [] as number[],
    usuarioId: 1,
    imagen: null as File | null,
    imagenActual: '', // Ruta de la imagen actual
    descuentoPorcentaje: 0
  };

  // Datos para nuevas categorías y opciones
  nuevaCategoria = {
    nombre: ''
  };

  nuevaOpcion = {
    tipo: ''
  };

  // Listas para selects
  categorias: Categoria[] = [];
  opciones: OpcionProducto[] = [];

  // Estados
  cargando = false;
  cargandoProducto = false;
  cargandoCategorias = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' | 'warning' | '' = '';
  imagenPrevia: string | null = null;
  imagenCambiada = false;

  // Estados para eliminación
  eliminandoCategoria: number | null = null;
  eliminandoOpcion: number | null = null;

  constructor(
    private commerceService: CommerceService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.productoId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.productoId) {
      // Primero cargar categorías, luego el producto
      this.cargarCategoriasYProducto();
    }
  }

  // CORRECCIÓN: Cargar categorías primero y luego el producto
  cargarCategoriasYProducto(): void {
    this.cargandoCategorias = true;
    
    this.commerceService.getCategoriasConProductos().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.cargandoCategorias = false;
        
        // Una vez cargadas las categorías, cargar el producto
        this.cargarProducto();
        this.cargarOpciones();
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.mostrarAlertaError('Error cargando categorías');
        this.cargandoCategorias = false;
      }
    });
  }

  cargarProducto(): void {
    this.cargandoProducto = true;
    this.commerceService.getProductoById(this.productoId).subscribe({
      next: (producto) => {
        this.productoOriginal = producto;
        
        // CORRECCIÓN: Verificar si la categoría del producto existe en la lista
        const categoriaId = producto.categoria?.id || 0;
        const categoriaExiste = this.categorias.some(cat => cat.id === categoriaId);
        
        this.producto = {
          id: producto.id,
          nombre: producto.nombre,
          descripcion: producto.descripcion || '',
          precio: producto.precio,
          activo: producto.activo,
          categoriaId: categoriaExiste ? categoriaId : 0,
          opcionesIds: producto.opciones.map(op => op.id),
          usuarioId: 1,
          imagen: null,
          imagenActual: producto.imagen,
          descuentoPorcentaje: producto.descuentoPorcentaje || 0
        };
        
        // CORRECCIÓN: Forzar la detección de cambios
        this.cdr.detectChanges();
        
        // Cargar preview de imagen actual
        if (producto.imagen) {
          this.imagenPrevia = this.getImagenUrl(producto.imagen);
        }
        
        this.cargandoProducto = false;
        
        // Mostrar mensaje si la categoría no existe
        if (categoriaId > 0 && !categoriaExiste) {
          this.mostrarAlertaAdvertencia('La categoría original de este producto ya no existe. Por favor seleccione una nueva categoría.');
        }
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.mostrarAlertaError('Error cargando producto');
        this.cargandoProducto = false;
      }
    });
  }

  cargarOpciones(): void {
    this.commerceService.getOpcionesProductos().subscribe({
      next: (data) => {
        this.opciones = data;
      },
      error: (error) => {
        console.error('Error cargando opciones:', error);
        this.mostrarAlertaError('Error cargando opciones de producto');
      }
    });
  }

  crearCategoria(): void {
    if (!this.nuevaCategoria.nombre.trim()) {
      this.mostrarAlertaError('El nombre de la categoría es requerido');
      return;
    }

    this.cargando = true;
    this.commerceService.crearCategoria(this.nuevaCategoria.nombre, this.producto.usuarioId)
      .subscribe({
        next: (categoriaCreada) => {
          this.categorias.push(categoriaCreada);
          this.producto.categoriaId = categoriaCreada.id;
          this.nuevaCategoria.nombre = '';
          this.mostrarAlertaExito('Categoría creada exitosamente');
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error creando categoría:', error);
          this.mostrarAlertaError('Error creando categoría');
          this.cargando = false;
        }
      });
  }

  eliminarCategoria(categoria: Categoria): void {
    if (!this.puedeEliminarCategoria(categoria)) {
      this.mostrarAlertaError('No se puede eliminar: La categoría tiene productos asociados');
      return;
    }

    this.mostrarConfirmacionEliminacion(
      `¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`,
      'Esta acción no se puede deshacer'
    ).then((result) => {
      if (result.isConfirmed) {
        this.eliminandoCategoria = categoria.id;
        this.commerceService.eliminarCategoria(categoria.id, this.producto.usuarioId)
          .subscribe({
            next: () => {
              this.categorias = this.categorias.filter(c => c.id !== categoria.id);
              
              if (this.producto.categoriaId === categoria.id) {
                this.producto.categoriaId = 0;
                this.mostrarAlertaAdvertencia('Categoría eliminada. El producto ahora no tiene categoría asignada.');
              }
              
              this.mostrarAlertaExito('Categoría eliminada exitosamente');
              this.eliminandoCategoria = null;
            },
            error: (error) => {
              console.error('Error eliminando categoría:', error);
              this.mostrarAlertaError('Error eliminando categoría');
              this.eliminandoCategoria = null;
            }
          });
      }
    });
  }

  crearOpcion(): void {
    if (!this.nuevaOpcion.tipo.trim()) {
      this.mostrarAlertaError('El tipo de opción es requerido');
      return;
    }

    this.cargando = true;
    this.commerceService.crearOpcionProducto(this.nuevaOpcion.tipo)
      .subscribe({
        next: (opcionCreada) => {
          this.opciones.push(opcionCreada);
          this.nuevaOpcion.tipo = '';
          this.mostrarAlertaExito('Opción creada exitosamente');
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error creando opción:', error);
          this.mostrarAlertaError('Error creando opción de producto');
          this.cargando = false;
        }
      });
  }

  eliminarOpcion(opcion: OpcionProducto): void {
    this.mostrarConfirmacionEliminacion(
      `¿Estás seguro de que quieres eliminar la opción "${opcion.tipo}"?`,
      'Esta acción no se puede deshacer'
    ).then((result) => {
      if (result.isConfirmed) {
        this.eliminandoOpcion = opcion.id;
        this.commerceService.eliminarOpcionProducto(opcion.id)
          .subscribe({
            next: () => {
              this.opciones = this.opciones.filter(o => o.id !== opcion.id);
              this.producto.opcionesIds = this.producto.opcionesIds.filter(id => id !== opcion.id);
              this.mostrarAlertaExito('Opción eliminada exitosamente');
              this.eliminandoOpcion = null;
            },
            error: (error) => {
              console.error('Error eliminando opción:', error);
              this.mostrarAlertaError('Error eliminando opción de producto');
              this.eliminandoOpcion = null;
            }
          });
      }
    });
  }

  onOpcionSeleccionada(event: any, opcionId: number): void {
    if (event.target.checked) {
      if (!this.producto.opcionesIds.includes(opcionId)) {
        this.producto.opcionesIds.push(opcionId);
      }
    } else {
      this.producto.opcionesIds = this.producto.opcionesIds.filter(id => id !== opcionId);
    }
  }

  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.producto.imagen = file;
      this.imagenCambiada = true;
      
      // Crear preview de la nueva imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPrevia = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  actualizarProducto(): void {
    // Validaciones básicas
    if (!this.producto.nombre.trim()) {
      this.mostrarAlertaError('El nombre del producto es requerido');
      return;
    }

    if (this.producto.precio <= 0) {
      this.mostrarAlertaError('El precio debe ser mayor a 0');
      return;
    }

    if (this.producto.categoriaId === 0) {
      this.mostrarAlertaError('Debe seleccionar una categoría');
      return;
    }
    if (this.producto.descuentoPorcentaje < 0 || this.producto.descuentoPorcentaje > 100) {
      this.mostrarAlertaError('El descuento debe estar entre 0 y 100');
      return;
    }

    this.mostrarConfirmacionActualizacion().then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;

        if (this.imagenCambiada && this.producto.imagen) {
          // USAR EL NUEVO MÉTODO PARA ACTUALIZAR CON IMAGEN
          this.actualizarConImagen();
        } else {
          // Actualizar sin cambiar imagen
          this.actualizarSinImagen();
        }
      }
    });
  }

  private actualizarConImagen(): void {
    // USAR DIRECTAMENTE EL NUEVO ENDPOINT
    this.commerceService.actualizarProductoConImagen(
      this.productoId,
      this.producto,
      this.producto.imagen!,
      this.producto.usuarioId
    ).subscribe({
      next: (productoActualizado) => {
        this.procesarActualizacionExitosa(productoActualizado);
      },
      error: (error) => {
        console.error('Error actualizando producto con imagen:', error);
        
        if (error.status === 403) {
          this.mostrarAlertaError('Error de permisos. Verifica que estés autenticado correctamente.');
        } else if (error.status === 404) {
          this.mostrarAlertaError('Producto no encontrado');
        } else {
          this.mostrarAlertaError('Error actualizando producto con imagen. Verifica que el archivo sea válido.');
        }
        
        this.cargando = false;
      }
    });
  }

  private actualizarSinImagen(): void {
    this.commerceService.actualizarProducto(
      this.productoId,
      {
        ...this.producto,
        imagenActual: this.producto.imagenActual // Mantener imagen actual
      },
      this.producto.usuarioId
    ).subscribe({
      next: (productoActualizado) => {
        this.procesarActualizacionExitosa(productoActualizado);
      },
      error: (error) => {
        console.error('Error actualizando producto:', error);
        
        if (error.status === 403) {
          this.mostrarAlertaError('Error de permisos. Verifica que estés autenticado correctamente.');
        } else if (error.status === 404) {
          this.mostrarAlertaError('Producto no encontrado');
        } else {
          this.mostrarAlertaError('Error actualizando producto');
        }
        
        this.cargando = false;
      }
    });
  }

  private procesarActualizacionExitosa(productoActualizado: Producto): void {
    this.mostrarAlertaExito('Producto actualizado exitosamente')
      .then(() => {
        this.router.navigate(['/admin/products']);
      });
    
    this.cargando = false;
    
    // Actualizar los datos locales
    this.productoOriginal = productoActualizado;
    this.producto.imagenActual = productoActualizado.imagen;
    
    // Actualizar el preview de imagen si se cambió
    if (this.imagenCambiada) {
      this.imagenPrevia = this.getImagenUrl(productoActualizado.imagen);
      this.imagenCambiada = false;
    }
  }

  cancelarEdicion(): void {
    if (this.hayCambiosSinGuardar()) {
      this.mostrarConfirmacionCancelacion().then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/admin/products']);
        }
      });
    } else {
      this.router.navigate(['/admin/products']);
    }
  }

  getImagenUrl(imagenPath: string): string {
    if (!imagenPath) return '';
    if (imagenPath.startsWith('http')) return imagenPath;
    return `http://localhost:8080${imagenPath}`;
  }

  limpiarImagen(): void {
    this.mostrarConfirmacion(
      '¿Estás seguro de que quieres cancelar el cambio de imagen?',
      'La nueva imagen seleccionada se descartará'
    ).then((result) => {
      if (result.isConfirmed) {
        this.producto.imagen = null;
        this.imagenCambiada = false;
        this.imagenPrevia = this.producto.imagenActual ? this.getImagenUrl(this.producto.imagenActual) : null;
        
        // Resetear el input file
        const fileInput = document.getElementById('imagen') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        this.mostrarAlertaExito('Cambio de imagen cancelado');
      }
    });
  }

  // Verificar si una categoría puede ser eliminada
  puedeEliminarCategoria(categoria: Categoria): boolean {
    return !categoria.productos || categoria.productos.length === 0;
  }

  // Obtener el texto del tooltip para categorías
  getTooltipCategoria(categoria: Categoria): string {
    if (this.puedeEliminarCategoria(categoria)) {
      return 'Eliminar categoría';
    } else {
      return 'No se puede eliminar: La categoría tiene productos asociados';
    }
  }

  // Verificar si hay cambios sin guardar
  hayCambiosSinGuardar(): boolean {
    if (!this.productoOriginal) return false;

    return (
      this.producto.nombre !== this.productoOriginal.nombre ||
      this.producto.descripcion !== (this.productoOriginal.descripcion || '') ||
      this.producto.precio !== this.productoOriginal.precio ||
      this.producto.activo !== this.productoOriginal.activo ||
      this.producto.categoriaId !== (this.productoOriginal.categoria?.id || 0) ||
      this.producto.descuentoPorcentaje !== (this.productoOriginal.descuentoPorcentaje || 0) ||
      JSON.stringify(this.producto.opcionesIds) !== JSON.stringify(this.productoOriginal.opciones.map(op => op.id)) ||
      this.imagenCambiada
    );
  }

  // MÉTODOS SWEETALERT2
  private mostrarAlertaExito(mensaje: string): Promise<any> {
    return Swal.fire({
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

  private mostrarAlertaAdvertencia(mensaje: string): void {
    Swal.fire({
      title: 'Advertencia',
      text: mensaje,
      icon: 'warning',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#ffc107',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
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

  private mostrarConfirmacionActualizacion(): Promise<any> {
    return Swal.fire({
      title: '¿Actualizar producto?',
      text: 'Se guardarán los cambios realizados en el producto',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffc107',
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

  private mostrarConfirmacionCancelacion(): Promise<any> {
    return Swal.fire({
      title: '¿Cancelar edición?',
      text: 'Los cambios no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Seguir editando',
      confirmButtonColor: '#6c757d',
      cancelButtonColor: '#ffc107',
      reverseButtons: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  private mostrarConfirmacion(titulo: string, texto: string): Promise<any> {
    return Swal.fire({
      title: titulo,
      text: texto,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
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