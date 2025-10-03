import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OpcionProducto, Producto } from '../models/producto.model';
import { Categoria } from '../models/categoria.model';
import { commerceEnviroment } from '../enviroment/commerce-enviroment';

@Injectable({
  providedIn: 'root'
})
export class CommerceService {

  private apiProductos = commerceEnviroment.apiProductos;
  private apiCategorias = commerceEnviroment.apiCategorias;
  private apiOpciones = commerceEnviroment.apiOpciones;

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiProductos);
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiProductos}/${id}`);
  }

  getCategoriasConProductos(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiCategorias}/all-con-products`);
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiCategorias);
  }

  getOpcionesProductos(): Observable<OpcionProducto[]> {
    return this.http.get<OpcionProducto[]>(this.apiOpciones);
  }

  crearCategoria(nombre: string, usuarioId: number): Observable<Categoria> {
    const body = { id: 0, nombre };
    return this.http.post<Categoria>(`${this.apiCategorias}?usuarioId=${usuarioId}`, body);
  }

  eliminarCategoria(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiCategorias}/${id}?usuarioId=${usuarioId}`);
  }

  crearOpcionProducto(tipo: string): Observable<OpcionProducto> {
    const body = { id: 0, tipo };
    return this.http.post<OpcionProducto>(this.apiOpciones, body);
  }

  eliminarOpcionProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiOpciones}/${id}`);
  }

  crearProducto(productoData: any, imagen: File | null): Observable<Producto> {
    const formData = new FormData();
    
    if (imagen) {
      formData.append('imagen', imagen);
    }

    let params = new HttpParams()
      .set('nombre', productoData.nombre)
      .set('descripcion', productoData.descripcion)
      .set('precio', productoData.precio.toString())
      .set('activo', productoData.activo.toString())
      .set('categoriaId', productoData.categoriaId.toString())
      .set('usuarioId', productoData.usuarioId.toString());

    if (productoData.opcionesIds && productoData.opcionesIds.length > 0) {
      params = params.set('opcionesIds', productoData.opcionesIds.join(','));
    }

    return this.http.post<Producto>(`${this.apiProductos}/productos`, formData, { params });
  }

  // ACTUALIZAR PRODUCTO SIN IMAGEN (JSON)
  actualizarProducto(id: number, productoData: any, usuarioId: number): Observable<Producto> {
    const body = {
      id: 0,
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      imagen: productoData.imagenActual, // Usar la imagen actual
      activo: productoData.activo,
      categoriaId: productoData.categoriaId,
      opcionesIds: productoData.opcionesIds || []
    };

    return this.http.put<Producto>(`${this.apiProductos}/${id}?usuarioId=${usuarioId}`, body);
  }

  // NUEVO MÉTODO: ACTUALIZAR PRODUCTO CON IMAGEN (multipart/form-data)
  actualizarProductoConImagen(id: number, productoData: any, imagen: File, usuarioId: number): Observable<Producto> {
    const formData = new FormData();
    
    // Agregar la imagen
    formData.append('imagen', imagen);

    // Crear parámetros de consulta para el nuevo endpoint
    let params = new HttpParams()
      .set('nombre', productoData.nombre)
      .set('descripcion', productoData.descripcion || '')
      .set('precio', productoData.precio.toString())
      .set('activo', productoData.activo.toString())
      .set('categoriaId', productoData.categoriaId.toString())
      .set('usuarioId', usuarioId.toString());

    // Agregar opcionesIds si existen
    if (productoData.opcionesIds && productoData.opcionesIds.length > 0) {
      params = params.set('opcionesIds', productoData.opcionesIds.join(','));
    }

    // Usar PUT con el nuevo endpoint específico para imagen
    return this.http.put<Producto>(`${this.apiProductos}/${id}/con-imagen`, formData, { 
      params: params 
    });
  }

  // ELIMINAR MÉTODOS OBSOLETOS:
  // - actualizarProductoConImagenPut (ya no es necesario)
  // - El método POST para actualización con imagen ya no se usa

  eliminarProducto(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiProductos}/${id}?usuarioId=${usuarioId}`);
  }

  
}