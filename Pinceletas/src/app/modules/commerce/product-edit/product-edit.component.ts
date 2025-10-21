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
    imagenes: [] as File[], // ✅ CAMBIADO: para nuevas imágenes
    imagenesActuales: [] as string[], // ✅ NUEVO: imágenes existentes
    mantenerImagenes: true, // ✅ NUEVO: flag para mantener imágenes
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
  imagenPrevia: string[] = []; // ✅ CAMBIADO: array para previews
  imagenesCambiadas = false; // ✅ CAMBIADO

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
          imagenes: [], // ✅ CORREGIDO
          imagenesActuales: producto.imagenes || [], // ✅ NUEVO
          mantenerImagenes: true,
          descuentoPorcentaje: producto.descuentoPorcentaje || 0
        };
        
        // CORRECCIÓN: Forzar la detección de cambios
        this.cdr.detectChanges();
        
        // Cargar preview de imagen actual
        if (producto.imagenes && producto.imagenes.length > 0) {
          this.imagenPrevia = producto.imagenes.map(img => this.getImagenUrl(img));
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

   // ✅ CORREGIDO: Manejar múltiples imágenes
  onImagenSeleccionada(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Limitar a 5 imágenes máximo
      const maxFiles = Math.min(files.length, 5);
      
      for (let i = 0; i < maxFiles; i++) {
        const file = files[i];
        this.producto.imagenes.push(file);
        
        // Crear preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagenPrevia.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
      
      this.imagenesCambiadas = true;
    }
  }
  // ✅ NUEVO: Eliminar una imagen (nueva o existente)
  eliminarImagen(index: number, esImagenExistente: boolean = false): void {
    if (esImagenExistente) {
      // Eliminar imagen existente del servidor
      this.commerceService.eliminarImagenDeProducto(
        this.productoId, 
        index, 
        this.producto.usuarioId
      ).subscribe({
        next: () => {
          this.producto.imagenesActuales.splice(index, 1);
          this.imagenPrevia.splice(index, 1);
          this.mostrarAlertaExito('Imagen eliminada correctamente');
        },
        error: (error) => {
          console.error('Error eliminando imagen:', error);
          this.mostrarAlertaError('Error eliminando imagen');
        }
      });
    } else {
      // Eliminar imagen nueva (no subida aún)
      this.producto.imagenes.splice(index - this.producto.imagenesActuales.length, 1);
      this.imagenPrevia.splice(index, 1);
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
    if (!this.esDescuentoValido(this.producto.descuentoPorcentaje)) {
      this.mostrarAlertaError('El descuento debe ser un número entero entre 0 y 100');
      return;
    }

    this.mostrarConfirmacionActualizacion().then((result) => {
      if (result.isConfirmed) {
        this.cargando = true;

        if (this.imagenesCambiadas && this.producto.imagenes.length > 0) {
          // ✅ CORREGIDO: Usar nuevo método para múltiples imágenes
          this.actualizarConMultiplesImagenes();
        } else {
          // Actualizar sin cambiar imágenes
          this.actualizarSinImagen();
        }
      }
    });
  }
  private actualizarConMultiplesImagenes(): void {
    this.commerceService.actualizarProductoConMultiplesImagenes(
      this.productoId,
      this.producto,
      this.producto.imagenes,
      this.producto.mantenerImagenes,
      this.producto.usuarioId
    ).subscribe({
      next: (productoActualizado) => {
        this.procesarActualizacionExitosa(productoActualizado);
      },
      error: (error) => {
        console.error('Error actualizando producto con imágenes:', error);
        this.mostrarAlertaError('Error actualizando producto con imágenes');
        this.cargando = false;
      }
    });
  }
  private actualizarSinImagen(): void {
    this.commerceService.actualizarProducto(
      this.productoId,
      {
        ...this.producto,
        // ✅ CORREGIDO: Enviar datos correctos para actualización sin imágenes
        imagen: this.producto.imagenesActuales.length > 0 ? this.producto.imagenesActuales[0] : '', // Para compatibilidad
        imagenes: this.producto.imagenesActuales // ✅ NUEVO: Enviar array de imágenes
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
    this.producto.imagenesActuales = productoActualizado.imagenes || [];
    
    // ✅ CORREGIDO: Actualizar el preview de imágenes si se cambiaron
    if (this.imagenesCambiadas) {
      this.imagenPrevia = (productoActualizado.imagenes || []).map(img => this.getImagenUrl(img));
      this.imagenesCambiadas = false;
      this.producto.imagenes = []; // Limpiar imágenes nuevas
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

  limpiarImagenes(): void {
    this.mostrarConfirmacion(
      '¿Estás seguro de que quieres cancelar el cambio de imágenes?',
      'Las nuevas imágenes seleccionadas se descartarán'
    ).then((result) => {
      if (result.isConfirmed) {
        this.producto.imagenes = [];
        this.imagenesCambiadas = false;
        
        // ✅ CORREGIDO: Restaurar previews de imágenes existentes
        this.imagenPrevia = this.producto.imagenesActuales.map(img => this.getImagenUrl(img));
        
        // Resetear el input file
        const fileInput = document.getElementById('imagenes') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        this.mostrarAlertaExito('Cambio de imágenes cancelado');
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
      this.imagenesCambiadas || // ✅ CORREGIDO: usar imagenesCambiadas
      // ✅ NUEVO: Verificar si se eliminaron imágenes existentes
      JSON.stringify(this.producto.imagenesActuales) !== JSON.stringify(this.productoOriginal.imagenes || [])
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
  // Verifica si el descuento es válido (entero entre 1 y 100)
    esDescuentoValido(valor: any): boolean {
    const num = Number(valor);
    // Permite 0 como válido
    return Number.isInteger(num) && num >= 0 && num <= 100;
}

    // Corrige automáticamente valores inválidos al tipear
    validarDescuento(): void {
      const num = Number(this.producto.descuentoPorcentaje);

      // Si el usuario borra el campo, asumimos 0
      if (this.producto.descuentoPorcentaje === null || this.producto.descuentoPorcentaje === null) {
        this.producto.descuentoPorcentaje = 0;
        return;
      }

      // Si no es entero o está fuera de rango, marcarlo pero no corregir automáticamente
      if (!Number.isInteger(num) || num < 0 || num > 100) {
        // Solo mantiene el valor en memoria, se marcará visualmente en rojo por [ngClass]
      }
    }

}