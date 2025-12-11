import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Categoria } from '../../../models/categoria.model';
import { OpcionProducto } from '../../../models/producto.model';
import { CommerceService } from '../../../services/commerce.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-create.component.html',
  styleUrl: './product-create.component.css'
})
export class ProductCreateComponent implements OnInit {
  producto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    activo: true,
    categoriaId: 0,
    opcionesIds: [] as number[],
    usuarioId: 1,
    imagenes: [] as File[],
    descuentoPorcentaje: 0
  };
  
  nuevaCategoria = {
    nombre: ''
  };

  nuevaOpcion = {
    tipo: ''
  };

  categorias: Categoria[] = [];
  opciones: OpcionProducto[] = [];
  opcionesSeleccionadas: number[] = [];

  cargando = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  imagenPrevia: string[] = [];

  eliminandoCategoria: number | null = null;
  eliminandoOpcion: number | null = null;

  constructor(
    private commerceService: CommerceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargarCategorias();
    this.cargarOpciones();
  }

  cargarCategorias(): void {
    this.commerceService.getCategoriasConProductos().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.mostrarAlertaError('Error cargando categorías');
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

  volverALista(): void {
    this.router.navigate(['/admin/products']);
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
      this.producto.opcionesIds.push(opcionId);
    } else {
      this.producto.opcionesIds = this.producto.opcionesIds.filter(id => id !== opcionId);
    }
  }

  onImagenSeleccionada(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const maxFiles = Math.min(files.length, 5);
      
      for (let i = 0; i < maxFiles; i++) {
        const file = files[i];
        this.producto.imagenes.push(file);
        
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagenPrevia.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  eliminarImagen(index: number): void {
    this.producto.imagenes.splice(index, 1);
    this.imagenPrevia.splice(index, 1);
  }

  crearProducto(): void {
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

    this.cargando = true;
    this.commerceService.crearProducto(this.producto, this.producto.imagenes)
      .subscribe({
        next: (productoCreado) => {
          this.mostrarAlertaExito('Producto creado exitosamente')
            .then(() => {
              this.router.navigate(['/admin/products']);
            });
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error creando producto:', error);
          this.mostrarAlertaError('Error creando producto');
          this.cargando = false;
        }
      });
  }

  limpiarFormulario(): void {
    this.mostrarConfirmacion(
      '¿Estás seguro de que quieres limpiar el formulario?',
      'Se perderán todos los datos ingresados'
    ).then((result) => {
      if (result.isConfirmed) {
        this.producto = {
          nombre: '',
          descripcion: '',
          precio: 0,
          activo: true,
          categoriaId: 0,
          opcionesIds: [],
          usuarioId: 1,
          imagenes: [],
          descuentoPorcentaje: 0
        };
        this.imagenPrevia = [];
        this.nuevaCategoria.nombre = '';
        this.nuevaOpcion.tipo = '';
        this.mostrarAlertaExito('Formulario limpiado correctamente');
      }
    });
  }

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

  puedeEliminarCategoria(categoria: Categoria): boolean {
    return !categoria.productos || categoria.productos.length === 0;
  }

  getTooltipCategoria(categoria: Categoria): string {
    if (this.puedeEliminarCategoria(categoria)) {
      return 'Eliminar categoría';
    } else {
      return 'No se puede eliminar: La categoría tiene productos asociados';
    }
  }
  esDescuentoValido(valor: any): boolean {
    const num = Number(valor);

    if (num === 0) return true;

    return Number.isInteger(num) && num >= 1 && num <= 100;
  }

  validarDescuento(): void {
    const num = Number(this.producto.descuentoPorcentaje);
    if (!this.esDescuentoValido(num)) {
    }
  }

}