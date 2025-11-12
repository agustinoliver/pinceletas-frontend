import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tienda, TerminosCondiciones, ConfiguracionEnvio, ConfiguracionEnvioRequest } from '../models/config.model';
import { configEnvironment } from '../enviroment/config-environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private apiTienda = configEnvironment.apiTienda;
  private apiTerminosCondiciones = configEnvironment.apiTerminosCondiciones;
  private apiConfiguracionesEnvio = 'http://localhost:8080/configuraciones-envio';

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

  // Términos y Condiciones endpoints
  getTerminosCondiciones(): Observable<TerminosCondiciones[]> {
    return this.http.get<TerminosCondiciones[]>(this.apiTerminosCondiciones);
  }

  getTerminoCondicion(id: number): Observable<TerminosCondiciones> {
    return this.http.get<TerminosCondiciones>(`${this.apiTerminosCondiciones}/${id}`);
  }

  createTerminosCondiciones(terminosCondiciones: TerminosCondiciones): Observable<TerminosCondiciones> {
    return this.http.post<TerminosCondiciones>(this.apiTerminosCondiciones, terminosCondiciones);
  }

  updateTerminosCondiciones(id: number, terminosCondiciones: TerminosCondiciones): Observable<TerminosCondiciones> {
    return this.http.put<TerminosCondiciones>(`${this.apiTerminosCondiciones}/${id}`, terminosCondiciones);
  }

  deleteTerminosCondiciones(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiTerminosCondiciones}/${id}`);
  }



  // Configuraciones de Envío
  getConfiguracionesEnvio(): Observable<ConfiguracionEnvio[]> {
    return this.http.get<ConfiguracionEnvio[]>(this.apiConfiguracionesEnvio);
  }

  getConfiguracionEnvio(id: number): Observable<ConfiguracionEnvio> {
    return this.http.get<ConfiguracionEnvio>(`${this.apiConfiguracionesEnvio}/${id}`);
  }

  getConfiguracionEnvioActiva(): Observable<ConfiguracionEnvio> {
    return this.http.get<ConfiguracionEnvio>(`${this.apiConfiguracionesEnvio}/activa`);
  }

  createConfiguracionEnvio(configuracion: ConfiguracionEnvioRequest): Observable<ConfiguracionEnvio> {
    return this.http.post<ConfiguracionEnvio>(this.apiConfiguracionesEnvio, configuracion);
  }

  updateConfiguracionEnvio(id: number, configuracion: ConfiguracionEnvioRequest): Observable<ConfiguracionEnvio> {
    return this.http.put<ConfiguracionEnvio>(`${this.apiConfiguracionesEnvio}/${id}`, configuracion);
  }

  deleteConfiguracionEnvio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiConfiguracionesEnvio}/${id}`);
  }

  calcularCostoEnvio(subtotal: number): Observable<{costoEnvio: number}> {
  // Convertir a string para evitar problemas de precisión con números grandes
  const subtotalString = subtotal.toFixed(2);
  return this.http.get<{costoEnvio: number}>(
    `${this.apiConfiguracionesEnvio}/calcular-costo?subtotal=${subtotalString}`
  );
}
}