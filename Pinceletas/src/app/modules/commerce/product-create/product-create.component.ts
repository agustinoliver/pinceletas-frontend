import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Categoria } from '../../../models/categoria.model';
import { OpcionProducto } from '../../../models/producto.model';
import { CommerceService } from '../../../services/commerce.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-create.component.html',
  styleUrl: './product-create.component.css'
})
export class ProductCreateComponent implements OnInit {
  // Datos del formulario de producto
  producto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    activo: true,
    categoriaId: 0,
    opcionesIds: [] as number[],
    usuarioId: 1, // Por defecto, puedes hacerlo dinámico según el usuario logueado
    imagen: null as File | null
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
  opcionesSeleccionadas: number[] = [];

  // Estados
  cargando = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  imagenPrevia: string | null = null;

  // Estados para eliminación
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
        this.mostrarMensaje('Error cargando categorías', 'error');
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

  // NUEVO MÉTODO: Volver a la lista de productos
  volverALista(): void {
    this.router.navigate(['/admin/products']);
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
          
          // Si la categoría eliminada estaba seleccionada, resetear la selección
          if (this.producto.categoriaId === categoria.id) {
            this.producto.categoriaId = 0;
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
          
          // Remover la opción de las seleccionadas si estaba seleccionada
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
      this.producto.opcionesIds.push(opcionId);
    } else {
      this.producto.opcionesIds = this.producto.opcionesIds.filter(id => id !== opcionId);
    }
  }

  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.producto.imagen = file;
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPrevia = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  crearProducto(): void {
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
    this.commerceService.crearProducto(this.producto, this.producto.imagen)
      .subscribe({
        next: (productoCreado) => {
          this.mostrarMensaje('Producto creado exitosamente', 'success');
          this.cargando = false;
          
          // Redirigir después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/admin/products']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error creando producto:', error);
          this.mostrarMensaje('Error creando producto', 'error');
          this.cargando = false;
        }
      });
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = '';
      this.tipoMensaje = '';
    }, 5000);
  }

  limpiarFormulario(): void {
    this.producto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      activo: true,
      categoriaId: 0,
      opcionesIds: [],
      usuarioId: 1,
      imagen: null
    };
    this.imagenPrevia = null;
  }

  // Verificar si una categoría puede ser eliminada (no tiene productos)
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
}