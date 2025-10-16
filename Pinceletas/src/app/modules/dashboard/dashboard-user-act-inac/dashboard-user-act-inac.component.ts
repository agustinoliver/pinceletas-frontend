import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard.service';
import { DashboardResponse, UserStats } from '../../../models/dashboard.model';
import { ChartType, GoogleChartsModule } from 'angular-google-charts';

@Component({
  selector: 'app-dashboard-user-act-inac',
  standalone: true,
  imports: [CommonModule, GoogleChartsModule],
  templateUrl: './dashboard-user-act-inac.component.html',
  styleUrl: './dashboard-user-act-inac.component.css'
})
export class DashboardUserActInacComponent implements OnInit {
  dashboardData: DashboardResponse | null = null;
  loading = true;
  error = '';

  // Configuración para Google Charts - CORREGIDO
  pieChartData: any[][] = [];
  pieChartType: ChartType = ChartType.PieChart;
  pieChartOptions = {
    title: 'Distribución de Usuarios',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#28a745', '#dc3545'],
    backgroundColor: 'transparent',
    legend: {
      position: 'labeled',
      textStyle: {
        color: '#2c3e50',
        fontSize: 12
      }
    },
    pieHole: 0.4,
    pieSliceText: 'value',
    tooltip: {
      text: 'percentage'
    },
    chartArea: {
      width: '90%',
      height: '80%'
    },
    width: 500, // CORREGIDO: número en lugar de string
    height: 400 // CORREGIDO: número en lugar de string
  };

  barChartData: any[][] = [];
  barChartType: ChartType = ChartType.BarChart;
  barChartOptions = {
    title: 'Estadísticas de Usuarios',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#ED620C'],
    backgroundColor: 'transparent',
    legend: { position: 'none' },
    hAxis: {
      title: 'Cantidad',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      }
    },
    vAxis: {
      title: 'Categoría',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      }
    },
    chartArea: {
      width: '80%',
      height: '70%'
    },
    width: 500, // CORREGIDO: número en lugar de string
    height: 400 // CORREGIDO: número en lugar de string
  };

  pieChartColumns = ['Estado', 'Cantidad'];
  barChartColumns = ['Categoría', 'Cantidad'];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.prepareChartData(data.userStats);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.error = 'Error al cargar el dashboard. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  prepareChartData(userStats: UserStats): void {
    // Datos para el gráfico de torta
    this.pieChartData = [
      ['Activos', userStats.activeUsers],
      ['Inactivos', userStats.inactiveUsers]
    ];

    // Datos para el gráfico de barras
    this.barChartData = [
      ['Total', userStats.totalUsers],
      ['Activos', userStats.activeUsers],
      ['Inactivos', userStats.inactiveUsers]
    ];
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'OPERATIONAL':
        return 'badge bg-success';
      case 'DEGRADED':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'OPERATIONAL':
        return 'Operacional';
      case 'DEGRADED':
        return 'Degradado';
      default:
        return status;
    }
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }
}