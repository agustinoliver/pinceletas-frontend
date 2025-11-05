import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResponse, PurchasesByUserDto, UserStatsReport } from '../models/dashboard.model';
import { dashboardEnvironment } from '../enviroment/dashboard-environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiDashboard = dashboardEnvironment.apiDashboard;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el dashboard completo con todas las métricas
   */
  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(this.apiDashboard);
  }

  /**
   * Obtiene solo las estadísticas de usuarios
   */
  getUserStats(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiDashboard}/users`);
  }

  /**
   * Obtiene el reporte de usuarios activos/inactivos
   */
  getUserStatsReport(): Observable<UserStatsReport> {
    return this.http.get<UserStatsReport>('http://localhost:8081/api/reports/users/active-inactive');
  }


  /**
   * Obtiene el reporte de compras por usuario con filtros opcionales
   */
  getPurchasesByUser(startDate?: string, endDate?: string): Observable<PurchasesByUserDto[]> {
    let url = `${this.apiDashboard}/purchases/by-user`;
    
    const params = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<PurchasesByUserDto[]>(url);
  }
}