import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OpcionProducto, Producto } from '../models/producto.model';
import { Categoria } from '../models/categoria.model';
import { commerceEnviroment } from '../enviroment/commerce-enviroment';
import { AuditoriaCategoria } from '../models/auditorias.model';
import { AuditoriaProducto } from '../models/auditorias.model';
import { Favorito } from '../models/favorito.model';

@Injectable({
  providedIn: 'root'
})
export class CommerceService {

  // --- URLs base de las API definidas en el entorno ---
  private apiProductos = commerceEnviroment.apiProductos;
  private apiCategorias = commerceEnviroment.apiCategorias;
  private apiOpciones = commerceEnviroment.apiOpciones;
  private apiFavoritos = commerceEnviroment.apiFavoritos;

  constructor(private http: HttpClient) {}

  // ===============================
  // PRODUCTOS
  // ===============================

  /**
   * Obtiene la lista de todos los productos.
   */
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiProductos);
  }

  /**
   * Obtiene un producto específico por su ID.
   * @param id - ID del producto
   */
  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiProductos}/${id}`);
  }

  /**
   * Crea un nuevo producto con imagen (multipart/form-data).
   * @param productoData - Datos del producto
   * @param imagen - Archivo de imagen del producto (opcional)
   */
  crearProducto(productoData: any, imagen: File | null): Observable<Producto> {
    const formData = new FormData();

    if (imagen) {
      formData.append('imagen', imagen);
    }

    // Parámetros de consulta
    let params = new HttpParams()
      .set('nombre', productoData.nombre)
      .set('descripcion', productoData.descripcion)
      .set('precio', productoData.precio.toString())
      .set('activo', productoData.activo.toString())
      .set('categoriaId', productoData.categoriaId.toString())
      .set('usuarioId', productoData.usuarioId.toString());

    // Agregar opcionesIds si existen
    if (productoData.opcionesIds && productoData.opcionesIds.length > 0) {
      params = params.set('opcionesIds', productoData.opcionesIds.join(','));
    }

    return this.http.post<Producto>(`${this.apiProductos}/productos`, formData, { params });
  }

  /**
   * Actualiza un producto SIN cambiar la imagen (usa JSON).
   * @param id - ID del producto
   * @param productoData - Datos del producto
   * @param usuarioId - ID del usuario que realiza la operación
   */
  actualizarProducto(id: number, productoData: any, usuarioId: number): Observable<Producto> {
    const body = {
      id: 0,
      nombre: productoData.nombre,
      descripcion: productoData.descripcion,
      precio: productoData.precio,
      imagen: productoData.imagenActual, // Imagen ya existente
      activo: productoData.activo,
      categoriaId: productoData.categoriaId,
      opcionesIds: productoData.opcionesIds || []
    };

    return this.http.put<Producto>(`${this.apiProductos}/${id}?usuarioId=${usuarioId}`, body);
  }

  /**
   * Actualiza un producto y reemplaza la imagen (usa multipart/form-data).
   * @param id - ID del producto
   * @param productoData - Nuevos datos del producto
   * @param imagen - Nueva imagen del producto
   * @param usuarioId - ID del usuario que realiza la operación
   */
  actualizarProductoConImagen(id: number, productoData: any, imagen: File, usuarioId: number): Observable<Producto> {
    const formData = new FormData();
    formData.append('imagen', imagen);

    let params = new HttpParams()
      .set('nombre', productoData.nombre)
      .set('descripcion', productoData.descripcion || '')
      .set('precio', productoData.precio.toString())
      .set('activo', productoData.activo.toString())
      .set('categoriaId', productoData.categoriaId.toString())
      .set('usuarioId', usuarioId.toString());

    if (productoData.opcionesIds && productoData.opcionesIds.length > 0) {
      params = params.set('opcionesIds', productoData.opcionesIds.join(','));
    }

    return this.http.put<Producto>(`${this.apiProductos}/${id}/con-imagen`, formData, { params });
  }

  /**
   * Elimina un producto por ID.
   * @param id - ID del producto
   * @param usuarioId - ID del usuario que realiza la operación
   */
  eliminarProducto(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiProductos}/${id}?usuarioId=${usuarioId}`);
  }

  // ===============================
  // CATEGORÍAS
  // ===============================

  /**
   * Obtiene todas las categorías.
   */
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiCategorias);
  }

  /**
   * Obtiene las categorías junto con los productos que contienen.
   */
  getCategoriasConProductos(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiCategorias}/all-con-products`);
  }

  /**
   * Crea una nueva categoría.
   * @param nombre - Nombre de la categoría
   * @param usuarioId - ID del usuario que realiza la operación
   */
  crearCategoria(nombre: string, usuarioId: number): Observable<Categoria> {
    const body = { id: 0, nombre };
    return this.http.post<Categoria>(`${this.apiCategorias}?usuarioId=${usuarioId}`, body);
  }

  /**
   * Elimina una categoría por ID.
   * @param id - ID de la categoría
   * @param usuarioId - ID del usuario que realiza la operación
   */
  eliminarCategoria(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiCategorias}/${id}?usuarioId=${usuarioId}`);
  }

  // ===============================
  // OPCIONES DE PRODUCTO
  // ===============================

  /**
   * Obtiene todas las opciones de productos.
   */
  getOpcionesProductos(): Observable<OpcionProducto[]> {
    return this.http.get<OpcionProducto[]>(this.apiOpciones);
  }

  /**
   * Crea una nueva opción de producto.
   * @param tipo - Tipo de la opción
   */
  crearOpcionProducto(tipo: string): Observable<OpcionProducto> {
    const body = { id: 0, tipo };
    return this.http.post<OpcionProducto>(this.apiOpciones, body);
  }

  /**
   * Elimina una opción de producto por ID.
   * @param id - ID de la opción
   */
  eliminarOpcionProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiOpciones}/${id}`);
  }


  // ===============================
  // MÉTODOS DE AUDITORÍA
  // ===============================

  /**
   * Obtiene todas las auditorías de productos
   */
  getAuditoriasProductos(): Observable<AuditoriaProducto[]> {
    return this.http.get<AuditoriaProducto[]>(`${this.apiProductos}/auditorias`);
  }

  /**
   * Obtiene todas las auditorías de categorías
   */
  getAuditoriasCategorias(): Observable<AuditoriaCategoria[]> {
    return this.http.get<AuditoriaCategoria[]>(`${this.apiCategorias}/auditoria`);
  }

  // ===============================
  // MÉTODOS DE FAVORITOS
  // ===============================

  getFavoritos(usuarioId: number): Observable<Favorito[]> {
    return this.http.get<Favorito[]>(`${this.apiFavoritos}/${usuarioId}`);
  }

  agregarFavorito(favoritoData: any): Observable<Favorito> {
    return this.http.post<Favorito>(this.apiFavoritos, favoritoData);
  }

  eliminarFavorito(usuarioId: number, productoId: number): Observable<void> {
  return this.http.delete<void>(`${this.apiFavoritos}?usuarioId=${usuarioId}&productoId=${productoId}`);
}
}
