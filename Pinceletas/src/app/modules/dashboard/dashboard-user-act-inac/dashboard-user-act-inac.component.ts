import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard.service';
import { 
  DashboardResponse, 
  UserStats,
  ProductStatsDto,
  ProductsByCategoryDto, 
  TopSellingProductDto,
  OrdersByDateDto,
  OrdersByStatusDto,
  PurchasesByUserDto
} from '../../../models/dashboard.model';
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
  activeTab: string = 'usuarios'; // 'usuarios', 'productos', 'pedidos' o 'compras-usuarios'

  // GRÁFICOS DE USUARIOS
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
    width: 500,
    height: 400
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
    width: 500,
    height: 400
  };

  // GRÁFICOS DE PRODUCTOS
  categoryChartData: any[][] = [];
  categoryChartType: ChartType = ChartType.ColumnChart;
  categoryChartOptions = {
    title: 'Productos por Categoría',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#28a745', '#17a2b8', '#6c757d'],
    backgroundColor: 'transparent',
    legend: { 
      position: 'top',
      textStyle: {
        color: '#2c3e50',
        fontSize: 12
      }
    },
    hAxis: {
      title: 'Categorías',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      }
    },
    vAxis: {
      title: 'Cantidad de Productos',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      }
    },
    chartArea: {
      width: '85%',
      height: '70%'
    },
    width: 600,
    height: 400,
    isStacked: true
  };

  topProductsChartData: any[][] = [];
  topProductsChartType: ChartType = ChartType.BarChart;
  topProductsChartOptions = {
    title: 'Top 5 Productos Más Vendidos',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#ED620C'],
    backgroundColor: 'transparent',
    legend: { position: 'none' },
    hAxis: {
      title: 'Unidades Vendidas',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      }
    },
    vAxis: {
      title: 'Productos',
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
      height: '75%'
    },
    width: 600,
    height: 400
  };

  productDistributionChartData: any[][] = [];
  productDistributionChartType: ChartType = ChartType.PieChart;
  productDistributionChartOptions = {
    title: 'Distribución de Productos',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#28a745', '#ffc107', '#dc3545'],
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
    width: 500,
    height: 400
  };

  // GRÁFICOS DE PEDIDOS
  ordersByDateChartData: any[][] = [];
  ordersByDateChartType: ChartType = ChartType.LineChart;
  ordersByDateChartOptions = {
    title: 'Pedidos por Fecha (Últimos 30 días)',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#ED620C', '#28a745', '#dc3545', '#ffc107'],
    backgroundColor: 'transparent',
    legend: { 
      position: 'top',
      textStyle: {
        color: '#2c3e50',
        fontSize: 12
      }
    },
    hAxis: {
      title: 'Fecha',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      },
      format: 'dd/MM'
    },
    vAxis: {
      title: 'Cantidad de Pedidos',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      }
    },
    chartArea: {
      width: '85%',
      height: '70%'
    },
    width: 600,
    height: 400,
    curveType: 'function'
  };

  ordersByStatusChartData: any[][] = [];
  ordersByStatusChartType: ChartType = ChartType.PieChart;
  ordersByStatusChartOptions = {
    title: 'Distribución de Pedidos por Estado',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6c757d', '#ED620C'],
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
    width: 500,
    height: 400
  };

  revenueByDateChartData: any[][] = [];
  revenueByDateChartType: ChartType = ChartType.ColumnChart;
  revenueByDateChartOptions = {
    title: 'Ingresos por Fecha',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#28a745'],
    backgroundColor: 'transparent',
    legend: { position: 'none' },
    hAxis: {
      title: 'Fecha',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      },
      format: 'dd/MM'
    },
    vAxis: {
      title: 'Ingresos ($)',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      },
      format: 'currency'
    },
    chartArea: {
      width: '85%',
      height: '70%'
    },
    width: 600,
    height: 400
  };

  // 🆕 GRÁFICOS PARA COMPRAS POR USUARIO
  topSpendersChartData: any[][] = [];
  topSpendersChartType: ChartType = ChartType.BarChart;
  topSpendersChartOptions = {
    title: 'Top 10 Usuarios por Monto Gastado',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#ED620C'],
    backgroundColor: 'transparent',
    legend: { position: 'none' },
    hAxis: {
      title: 'Monto Gastado ($)',
      titleTextStyle: {
        color: '#2c3e50',
        italic: false
      },
      textStyle: {
        color: '#2c3e50'
      },
      format: 'currency'
    },
    vAxis: {
      title: 'Usuario',
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
      height: '75%'
    },
    width: 600,
    height: 500
  };

  purchasesDistributionChartData: any[][] = [];
  purchasesDistributionChartType: ChartType = ChartType.PieChart;
  purchasesDistributionChartOptions = {
    title: 'Distribución de Compras por Usuario',
    titleTextStyle: {
      color: '#2c3e50',
      fontSize: 18,
      bold: true
    },
    colors: ['#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6c757d', '#ED620C'],
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
    width: 500,
    height: 400
  };

  // Columnas para los gráficos
  pieChartColumns = ['Estado', 'Cantidad'];
  barChartColumns = ['Categoría', 'Cantidad'];
  categoryChartColumns = ['Categoría', 'Activos', 'Inactivos', 'Total'];
  topProductsChartColumns = ['Producto', 'Unidades Vendidas'];
  distributionChartColumns = ['Estado', 'Cantidad'];
  
  // Columnas para gráficos de pedidos
  ordersByDateChartColumns = ['Fecha', 'Total', 'Completados', 'Cancelados', 'Pendientes'];
  ordersByStatusChartColumns = ['Estado', 'Cantidad'];
  revenueByDateChartColumns = ['Fecha', 'Ingresos'];

  // 🆕 Columnas para gráficos de compras por usuario
  topSpendersChartColumns = ['Usuario', 'Monto Gastado'];
  purchasesDistributionChartColumns = ['Usuario', 'Total Compras'];

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
        this.prepareUserChartData(data.userStats);
        this.prepareProductChartData();
        this.prepareOrdersChartData();
        this.preparePurchasesByUserChartData(); // 🆕 Preparar datos de compras por usuario
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.error = 'Error al cargar el dashboard. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  prepareUserChartData(userStats: UserStats): void {
    this.pieChartData = [
      ['Activos', userStats.activeUsers],
      ['Inactivos', userStats.inactiveUsers]
    ];

    this.barChartData = [
      ['Total', userStats.totalUsers],
      ['Activos', userStats.activeUsers],
      ['Inactivos', userStats.inactiveUsers]
    ];
  }

  prepareProductChartData(): void {
    if (!this.dashboardData) return;

    // Datos para gráfico de productos por categoría
    this.categoryChartData = this.dashboardData.productsByCategory.map(category => [
      category.categoryName,
      category.activeProducts,
      category.inactiveProducts,
      category.totalProducts
    ]);

    // Datos para gráfico de productos más vendidos (top 5)
    this.topProductsChartData = this.dashboardData.topSellingProducts
      .slice(0, 5)
      .map(product => [
        product.productName,
        product.unitsSold
      ]);

    // Datos para gráfico de distribución general de productos
    this.productDistributionChartData = [
      ['Activos', this.dashboardData.productStats.activeProducts],
      ['Inactivos', this.dashboardData.productStats.inactiveProducts],
      ['Total', this.dashboardData.productStats.totalProducts]
    ];
  }

  // MÉTODO PARA PREPARAR DATOS DE PEDIDOS
  prepareOrdersChartData(): void {
    if (!this.dashboardData) return;

    // Datos para gráfico de pedidos por fecha
    this.ordersByDateChartData = this.dashboardData.ordersByDate
      .slice(0, 15) // Últimos 15 días para mejor visualización
      .map(order => [
        new Date(order.date), // Convertir string a Date
        order.totalOrders,
        order.completedOrders,
        order.cancelledOrders,
        order.pendingOrders
      ]);

    // Datos para gráfico de pedidos por estado
    this.ordersByStatusChartData = this.dashboardData.ordersByStatus.map(status => [
      this.translateStatus(status.status),
      status.totalOrders
    ]);

    // Datos para gráfico de ingresos por fecha
    this.revenueByDateChartData = this.dashboardData.ordersByDate
      .slice(0, 15)
      .map(order => [
        new Date(order.date),
        order.totalRevenue
      ]);
  }

  // 🆕 MÉTODO PARA PREPARAR DATOS DE COMPRAS POR USUARIO
  preparePurchasesByUserChartData(): void {
    if (!this.dashboardData || !this.dashboardData.purchasesByUser) return;

    const purchasesByUser = this.dashboardData.purchasesByUser;

    // Datos para gráfico de top spenders
    this.topSpendersChartData = purchasesByUser
      .slice(0, 10) // Top 10 usuarios
      .map(user => [
        this.truncateUserName(user.userName),
        user.totalAmountSpent
      ]);

    // Datos para gráfico de distribución de compras
    this.purchasesDistributionChartData = purchasesByUser
      .slice(0, 6) // Top 6 usuarios para mejor visualización
      .map(user => [
        this.truncateUserName(user.userName),
        user.totalPurchases
      ]);
  }

  // 🆕 Método para truncar nombres largos
  truncateUserName(userName: string): string {
    return userName.length > 15 ? userName.substring(0, 15) + '...' : userName;
  }

  // Método para traducir estados de pedidos
  translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'PENDIENTE_PAGO': 'Pendiente Pago',
      'PAGADO': 'Pagado',
      'PROCESANDO': 'Procesando',
      'ENVIADO': 'Enviado',
      'ENTREGADO': 'Entregado',
      'CANCELADO': 'Cancelado',
      'REEMBOLSADO': 'Reembolsado'
    };
    return statusMap[status] || status;
  }

  // Método para calcular estadísticas de pedidos
  getOrdersStats() {
    if (!this.dashboardData) return null;

    const ordersByDate = this.dashboardData.ordersByDate;
    const totalRevenue = ordersByDate.reduce((sum, order) => sum + order.totalRevenue, 0);
    const totalOrders = ordersByDate.reduce((sum, order) => sum + order.totalOrders, 0);
    const avgOrdersPerDay = totalOrders / (ordersByDate.length || 1);
    const completedOrders = ordersByDate.reduce((sum, order) => sum + order.completedOrders, 0);
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      avgOrdersPerDay: Math.round(avgOrdersPerDay),
      completionRate: Math.round(completionRate * 100) / 100
    };
  }

  // 🆕 Método para calcular estadísticas de compras por usuario
  getPurchasesStats() {
    if (!this.dashboardData || !this.dashboardData.purchasesByUser) return null;

    const purchases = this.dashboardData.purchasesByUser;
    const totalUsers = purchases.length;
    const totalRevenue = purchases.reduce((sum, user) => sum + user.totalAmountSpent, 0);
    const totalPurchases = purchases.reduce((sum, user) => sum + user.totalPurchases, 0);
    const avgSpendingPerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const avgPurchasesPerUser = totalUsers > 0 ? totalPurchases / totalUsers : 0;

    // Encontrar el usuario que más gastó
    const topSpender = purchases.length > 0 ? 
      purchases.reduce((max, user) => user.totalAmountSpent > max.totalAmountSpent ? user : max) 
      : null;

    return {
      totalUsers,
      totalRevenue,
      totalPurchases,
      avgSpendingPerUser: Math.round(avgSpendingPerUser * 100) / 100,
      avgPurchasesPerUser: Math.round(avgPurchasesPerUser * 100) / 100,
      topSpender: topSpender ? {
        name: topSpender.userName,
        amount: topSpender.totalAmountSpent
      } : null
    };
  }

  // 🆕 Método para obtener color según el monto gastado
  getSpendingColor(amount: number): string {
    if (amount > 10000) return 'text-success';
    if (amount > 5000) return 'text-warning';
    if (amount > 1000) return 'text-info';
    return 'text-secondary';
  }

  // 🆕 Método para formatear fechas de última compra
  formatLastPurchaseDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-AR');
  }

  refreshDashboard(): void {
    this.loadDashboard();
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

  getRevenueColor(revenue: number): string {
    if (revenue > 10000) return 'text-success';
    if (revenue > 5000) return 'text-warning';
    return 'text-info';
  }

  // Método para obtener color según estado del pedido
  getOrderStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'ENTREGADO': 'bg-success',
      'PAGADO': 'bg-primary',
      'PROCESANDO': 'bg-info',
      'ENVIADO': 'bg-warning',
      'PENDIENTE': 'bg-secondary',
      'PENDIENTE_PAGO': 'bg-light text-dark',
      'CANCELADO': 'bg-danger',
      'REEMBOLSADO': 'bg-dark'
    };
    return statusColors[status] || 'bg-secondary';
  }
}