import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { commerceEnviroment } from '../enviroment/commerce-enviroment';
import { PedidoRequest, PedidoResponse, ActualizarEstadoPedido } from '../models/pedido.model';
import { AuditoriaPedido } from '../models/auditorias.model';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = commerceEnviroment.apiCarrito.replace('/carrito', '/pedidos');

  constructor(private http: HttpClient) {}

  /**
   * Crea un nuevo pedido
   * @param pedidoRequest - Datos del pedido con items
   */
  crearPedido(pedidoRequest: PedidoRequest): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(this.apiUrl, pedidoRequest);
  }

  /**
   * Obtiene todos los pedidos de un usuario específico
   * @param usuarioId - ID del usuario
   */
  obtenerPedidosPorUsuario(usuarioId: number): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  /**
   * Obtiene TODOS los pedidos (solo para admin)
   */
  obtenerTodosLosPedidos(): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(this.apiUrl);
  }

  /**
   * Obtiene un pedido específico por ID
   * @param id - ID del pedido
   */
  obtenerPedidoPorId(id: number): Observable<PedidoResponse> {
    return this.http.get<PedidoResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene un pedido por su número
   * @param numeroPedido - Número único del pedido
   */
  obtenerPedidoPorNumero(numeroPedido: string): Observable<PedidoResponse> {
    return this.http.get<PedidoResponse>(`${this.apiUrl}/numero/${numeroPedido}`);
  }

  /**
   * Actualiza el estado de un pedido (solo admin)
   * @param id - ID del pedido
   * @param estado - Nuevo estado del pedido
   */
  actualizarEstadoPedido(id: number, estado: ActualizarEstadoPedido): Observable<PedidoResponse> {
    return this.http.put<PedidoResponse>(`${this.apiUrl}/${id}/estado`, estado);
  }

  /**
   * Procesa el webhook de Mercado Pago
   * @param preference_id - ID de preferencia de MP
   * @param payment_id - ID de pago de MP
   * @param status - Estado del pago
   */
  procesarWebhookPago(preference_id: string, payment_id: string, status: string): Observable<void> {
    const params = {
      preference_id,
      payment_id,
      status
    };
    return this.http.post<void>(`${this.apiUrl}/webhook`, null, { params });
  }
  // En pedido.service.ts - Verificar que estos métodos existan
  obtenerAuditoriasPedidos(): Observable<AuditoriaPedido[]> {
    return this.http.get<AuditoriaPedido[]>(`${this.apiUrl}/auditoria`);
  }

  obtenerAuditoriasPorPedido(pedidoId: number): Observable<AuditoriaPedido[]> {
    return this.http.get<AuditoriaPedido[]>(`${this.apiUrl}/${pedidoId}/auditoria`);
  }
} 