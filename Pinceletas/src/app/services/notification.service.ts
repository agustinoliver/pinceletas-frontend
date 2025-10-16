import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notificacion } from '../models/notification.model';
import { notificationEnvironment } from '../enviroment/notification-enviroment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private apiNotifications = notificationEnvironment.apiNotifications;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las notificaciones de un usuario
   */
  getNotificacionesPorUsuario(usuarioId: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiNotifications}/usuario/${usuarioId}`);
  }

  /**
   * Obtiene solo las notificaciones no leídas de un usuario
   */
  getNotificacionesNoLeidas(usuarioId: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiNotifications}/usuario/${usuarioId}/no-leidas`);
  }

  /**
   * Obtiene el contador de notificaciones no leídas
   */
  getContadorNoLeidas(usuarioId: number): Observable<number> {
    return this.http.get<number>(`${this.apiNotifications}/usuario/${usuarioId}/contador-no-leidas`);
  }

  /**
   * Marca una notificación como leída
   */
  marcarComoLeida(id: number, usuarioId: number): Observable<void> {
    return this.http.put<void>(`${this.apiNotifications}/${id}/usuario/${usuarioId}/leer`, {});
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  marcarTodasComoLeidas(usuarioId: number): Observable<void> {
    return this.http.put<void>(`${this.apiNotifications}/usuario/${usuarioId}/leer-todas`, {});
  }

  /**
   * Elimina una notificación
   */
  eliminarNotificacion(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiNotifications}/${id}/usuario/${usuarioId}`);
  }
}