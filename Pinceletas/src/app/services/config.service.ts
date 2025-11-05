import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tienda, Politicas } from '../models/config.model';
import { configEnvironment } from '../enviroment/config-environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private apiTienda = configEnvironment.apiTienda;
  private apiPoliticas = configEnvironment.apiPoliticas;

  constructor(private http: HttpClient) {}

  // Tienda endpoints
  getTiendas(): Observable<Tienda[]> {
    return this.http.get<Tienda[]>(this.apiTienda);
  }

  getTienda(id: number): Observable<Tienda> {
    return this.http.get<Tienda>(`${this.apiTienda}/${id}`);
  }

  createTienda(tienda: Tienda): Observable<Tienda> {
    return this.http.post<Tienda>(this.apiTienda, tienda);
  }

  updateTienda(id: number, tienda: Tienda): Observable<Tienda> {
    return this.http.put<Tienda>(`${this.apiTienda}/${id}`, tienda);
  }

  deleteTienda(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiTienda}/${id}`);
  }

  // Políticas endpoints
  getPoliticas(): Observable<Politicas[]> {
    return this.http.get<Politicas[]>(this.apiPoliticas);
  }

  getPolitica(id: number): Observable<Politicas> {
    return this.http.get<Politicas>(`${this.apiPoliticas}/${id}`);
  }

  createPoliticas(politicas: Politicas): Observable<Politicas> {
    return this.http.post<Politicas>(this.apiPoliticas, politicas);
  }

  updatePoliticas(id: number, politicas: Politicas): Observable<Politicas> {
    return this.http.put<Politicas>(`${this.apiPoliticas}/${id}`, politicas);
  }

  deletePoliticas(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiPoliticas}/${id}`);
  }
}