import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { Categoria } from '../models/categoria.model';
import { commerceEnviroment } from '../enviroment/commerce-enviroment';

@Injectable({
  providedIn: 'root'
})
export class CommerceService {

  private apiProductos = commerceEnviroment.apiProductos;
  private apiCategorias = commerceEnviroment.apiCategorias;

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiProductos);
  }

  getCategoriasConProductos(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiCategorias}/all-con-products`);
  }
}