import { Component, OnInit } from '@angular/core';
import { OpcionProducto, Producto } from '../../../models/producto.model';
import { Categoria } from '../../../models/categoria.model';
import { CommerceService } from '../../../services/commerce.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core'; 

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
    imagenActual: '' // Ruta de la imagen actual
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
  // Cambia esta línea en las propiedades del componente:
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
        this.mostrarMensaje('Error cargando categorías', 'error');
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
          categoriaId: categoriaExiste ? categoriaId : 0, // Solo asignar si existe
          opcionesIds: producto.opciones.map(op => op.id),
          usuarioId: 1,
          imagen: null,
          imagenActual: producto.imagen
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
          this.mostrarMensaje('La categoría original de este producto ya no existe. Por favor seleccione una nueva categoría.', 'warning');
        }
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.mostrarMensaje('Error cargando producto', 'error');
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
        this.mostrarMensaje('Error cargando opciones de producto', 'error');
      }
    });
  }

  crearCategoria(): void {
    if (!this.nuevaCategoria.nombre.trim()) {
      this.mostrarMensaje('El nombre de la categoría es requerido', 'error');
      return;
    }

    this.cargando = true;
    this.commerceService.crearCategoria(this.nuevaCategoria.nombre, this.producto.usuarioId)
      .subscribe({
        next: (categoriaCreada) => {
          this.categorias.push(categoriaCreada);
          this.producto.categoriaId = categoriaCreada.id;
          this.nuevaCategoria.nombre = '';
          this.mostrarMensaje('Categoría creada exitosamente', 'success');
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error creando categoría:', error);
          this.mostrarMensaje('Error creando categoría', 'error');
          this.cargando = false;
        }
      });
  }

  eliminarCategoria(categoria: Categoria): void {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    this.eliminandoCategoria = categoria.id;
    this.commerceService.eliminarCategoria(categoria.id, this.producto.usuarioId)
      .subscribe({
        next: () => {
          this.categorias = this.categorias.filter(c => c.id !== categoria.id);
          
          if (this.producto.categoriaId === categoria.id) {
            this.producto.categoriaId = 0;
            this.mostrarMensaje('Categoría eliminada. El producto ahora no tiene categoría asignada.', 'warning');
          }
          
          this.mostrarMensaje('Categoría eliminada exitosamente', 'success');
          this.eliminandoCategoria = null;
        },
        error: (error) => {
          console.error('Error eliminando categoría:', error);
          this.mostrarMensaje('Error eliminando categoría', 'error');
          this.eliminandoCategoria = null;
        }
      });
  }

  crearOpcion(): void {
    if (!this.nuevaOpcion.tipo.trim()) {
      this.mostrarMensaje('El tipo de opción es requerido', 'error');
      return;
    }

    this.cargando = true;
    this.commerceService.crearOpcionProducto(this.nuevaOpcion.tipo)
      .subscribe({
        next: (opcionCreada) => {
          this.opciones.push(opcionCreada);
          this.nuevaOpcion.tipo = '';
          this.mostrarMensaje('Opción creada exitosamente', 'success');
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error creando opción:', error);
          this.mostrarMensaje('Error creando opción de producto', 'error');
          this.cargando = false;
        }
      });
  }

  eliminarOpcion(opcion: OpcionProducto): void {
    if (!confirm(`¿Estás seguro de que quieres eliminar la opción "${opcion.tipo}"?`)) {
      return;
    }

    this.eliminandoOpcion = opcion.id;
    this.commerceService.eliminarOpcionProducto(opcion.id)
      .subscribe({
        next: () => {
          this.opciones = this.opciones.filter(o => o.id !== opcion.id);
          this.producto.opcionesIds = this.producto.opcionesIds.filter(id => id !== opcion.id);
          this.mostrarMensaje('Opción eliminada exitosamente', 'success');
          this.eliminandoOpcion = null;
        },
        error: (error) => {
          console.error('Error eliminando opción:', error);
          this.mostrarMensaje('Error eliminando opción de producto', 'error');
          this.eliminandoOpcion = null;
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
      this.mostrarMensaje('El nombre del producto es requerido', 'error');
      return;
    }

    if (this.producto.precio <= 0) {
      this.mostrarMensaje('El precio debe ser mayor a 0', 'error');
      return;
    }

    if (this.producto.categoriaId === 0) {
      this.mostrarMensaje('Debe seleccionar una categoría', 'error');
      return;
    }

    this.cargando = true;

    if (this.imagenCambiada && this.producto.imagen) {
      // USAR EL NUEVO MÉTODO PARA ACTUALIZAR CON IMAGEN
      this.actualizarConImagen();
    } else {
      // Actualizar sin cambiar imagen
      this.actualizarSinImagen();
    }
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
          this.mostrarMensaje('Error de permisos. Verifica que estés autenticado correctamente.', 'error');
        } else if (error.status === 404) {
          this.mostrarMensaje('Producto no encontrado', 'error');
        } else {
          this.mostrarMensaje('Error actualizando producto con imagen. Verifica que el archivo sea válido.', 'error');
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
          this.mostrarMensaje('Error de permisos. Verifica que estés autenticado correctamente.', 'error');
        } else if (error.status === 404) {
          this.mostrarMensaje('Producto no encontrado', 'error');
        } else {
          this.mostrarMensaje('Error actualizando producto', 'error');
        }
        
        this.cargando = false;
      }
    });
  }

  private procesarActualizacionExitosa(productoActualizado: Producto): void {
    this.mostrarMensaje('Producto actualizado exitosamente', 'success');
    this.cargando = false;
    
    // Actualizar los datos locales
    this.productoOriginal = productoActualizado;
    this.producto.imagenActual = productoActualizado.imagen;
    
    // Actualizar el preview de imagen si se cambió
    if (this.imagenCambiada) {
      this.imagenPrevia = this.getImagenUrl(productoActualizado.imagen);
      this.imagenCambiada = false;
    }
    
    setTimeout(() => {
      this.router.navigate(['/admin/products']);
    }, 2000);
  }

  cancelarEdicion(): void {
    if (confirm('¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/admin/products']);
    }
  }

  getImagenUrl(imagenPath: string): string {
    if (!imagenPath) return '';
    if (imagenPath.startsWith('http')) return imagenPath;
    return `http://localhost:8080${imagenPath}`;
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
  this.mensaje = mensaje;
  this.tipoMensaje = tipo;
  setTimeout(() => {
    this.mensaje = '';
    this.tipoMensaje = '';
  }, 5000);
  }

  limpiarImagen(): void {
    this.producto.imagen = null;
    this.imagenCambiada = false;
    this.imagenPrevia = this.producto.imagenActual ? this.getImagenUrl(this.producto.imagenActual) : null;
    
    // Resetear el input file
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
      JSON.stringify(this.producto.opcionesIds) !== JSON.stringify(this.productoOriginal.opciones.map(op => op.id)) ||
      this.imagenCambiada
    );
  }
}