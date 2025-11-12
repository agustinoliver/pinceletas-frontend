import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard.service';
import { 
  DashboardResponse, 
  UserStats
} from '../../../models/dashboard.model';
import { ChartType, GoogleChartsModule } from 'angular-google-charts';

// 📦 Importaciones para exportar Excel y PDF
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // === CONFIGURACIONES DE GRÁFICOS ===
  pieChartData: any[][] = [];
  pieChartType: ChartType = ChartType.PieChart;
  pieChartOptions = {
    title: 'Distribución de Usuarios',
    titleTextStyle: { color: '#2c3e50', fontSize: 18, bold: true },
    colors: ['#28a745', '#dc3545'],
    backgroundColor: 'transparent',
    legend: { position: 'labeled', textStyle: { color: '#2c3e50', fontSize: 12 } },
    pieHole: 0.4,
    pieSliceText: 'value',
    tooltip: { text: 'percentage' },
    chartArea: { width: '90%', height: '80%' },
    width: 500,
    height: 400
  };

  // Gráficos de productos
  categoryChartData: any[][] = [];
  categoryChartType: ChartType = ChartType.ColumnChart;
  categoryChartOptions = {
    title: 'Productos por Categoría',
    titleTextStyle: { color: '#2c3e50', fontSize: 18, bold: true },
    colors: ['#28a745', '#17a2b8', '#6c757d'],
    backgroundColor: 'transparent',
    legend: { 
      position: 'top',
      textStyle: { color: '#2c3e50', fontSize: 12 }
    },
    hAxis: {
      title: 'Categorías',
      titleTextStyle: { color: '#2c3e50', italic: false },
      textStyle: { color: '#2c3e50' }
    },
    vAxis: {
      title: 'Cantidad de Productos',
      titleTextStyle: { color: '#2c3e50', italic: false },
      textStyle: { color: '#2c3e50' }
    },
    chartArea: { width: '85%', height: '70%' },
    width: 600,
    height: 400,
    isStacked: true
  };

  topProductsChartData: any[][] = [];
  topProductsChartType: ChartType = ChartType.BarChart;
  topProductsChartOptions = {
    title: 'Top 5 Productos Más Vendidos',
    titleTextStyle: { color: '#2c3e50', fontSize: 18, bold: true },
    colors: ['#ED620C'],
    backgroundColor: 'transparent',
    legend: { position: 'none' },
    hAxis: {
      title: 'Unidades Vendidas',
      titleTextStyle: { color: '#2c3e50', italic: false },
      textStyle: { color: '#2c3e50' }
    },
    vAxis: {
      title: 'Productos',
      titleTextStyle: { color: '#2c3e50', italic: false },
      textStyle: { color: '#2c3e50' }
    },
    chartArea: { width: '80%', height: '75%' },
    width: 600,
    height: 400
  };

  // Gráficos de pedidos
  ordersByDateChartData: any[][] = [];
  ordersByDateChartType: ChartType = ChartType.LineChart;
  ordersByDateChartOptions = {
    title: 'Pedidos por Fecha (Últimos 30 días)',
    titleTextStyle: { color: '#2c3e50', fontSize: 18, bold: true },
    colors: ['#ED620C', '#28a745', '#dc3545', '#ffc107'],
    backgroundColor: 'transparent',
    legend: { 
      position: 'top',
      textStyle: { color: '#2c3e50', fontSize: 12 }
    },
    hAxis: {
      title: 'Fecha',
      titleTextStyle: { color: '#2c3e50', italic: false },
      textStyle: { color: '#2c3e50' },
      format: 'dd/MM'
    },
    vAxis: {
      title: 'Cantidad de Pedidos',
      titleTextStyle: { color: '#2c3e50', italic: false },
      textStyle: { color: '#2c3e50' }
    },
    chartArea: { width: '85%', height: '70%' },
    width: 600,
    height: 400,
    curveType: 'function'
  };

  ordersByStatusChartData: any[][] = [];
  ordersByStatusChartType: ChartType = ChartType.PieChart;
  ordersByStatusChartOptions = {
    title: 'Distribución de Pedidos por Estado',
    titleTextStyle: { color: '#2c3e50', fontSize: 18, bold: true },
    colors: ['#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6c757d', '#ED620C'],
    backgroundColor: 'transparent',
    legend: {
      position: 'labeled',
      textStyle: { color: '#2c3e50', fontSize: 12 }
    },
    pieHole: 0.4,
    pieSliceText: 'value',
    tooltip: { text: 'percentage' },
    chartArea: { width: '90%', height: '80%' },
    width: 500,
    height: 400
  };

  // Gráficos de compras por usuario
  topSpendersChartData: any[][] = [];
  topSpendersChartType: ChartType = ChartType.BarChart;
  topSpendersChartOptions = {
    title: 'Top 10 Usuarios por Monto Gastado',
    titleTextStyle: { color: '#2c3e50', fontSize: 18, bold: true },
    colors: ['#ED620C'],
    backgroundColor: 'transparent',
    legend: { position: 'none' },
    hAxis: {
      title: 'Monto Gastado ($)',
      titleTextStyle: { color: '#2c3e50', italic: false },
      textStyle: { color: '#2c3e50' },
      format: 'currency'
    },
    vAxis: {
      title: 'Usuario',
      titleTextStyle: { color: '#2c3e50', italic: false },
      textStyle: { color: '#2c3e50' }
    },
    chartArea: { width: '80%', height: '75%' },
    width: 600,
    height: 500
  };

  // Columnas para los gráficos
  pieChartColumns = ['Estado', 'Cantidad'];
  categoryChartColumns = ['Categoría', 'Activos', 'Inactivos', 'Total'];
  topProductsChartColumns = ['Producto', 'Unidades Vendidas'];
  ordersByDateChartColumns = ['Fecha', 'Total', 'Completados', 'Cancelados', 'Pendientes'];
  ordersByStatusChartColumns = ['Estado', 'Cantidad'];
  topSpendersChartColumns = ['Usuario', 'Monto Gastado'];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  // === CARGA DE DATOS ===
  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.prepareUserChartData(data.userStats);
        this.prepareProductChartData();
        this.prepareOrdersChartData();
        this.preparePurchasesByUserChartData();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.error = 'Error al cargar el dashboard. Por favor, intente nuevamente.';
        this.loading = false;
      }
    });
  }

  // === PREPARACIÓN DE DATOS ===
  prepareUserChartData(userStats: UserStats): void {
    this.pieChartData = [
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
  }

  prepareOrdersChartData(): void {
    if (!this.dashboardData) return;

    // Datos para gráfico de pedidos por fecha
    this.ordersByDateChartData = this.dashboardData.ordersByDate
      .slice(0, 15)
      .map(order => [
        new Date(order.date),
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
  }

  preparePurchasesByUserChartData(): void {
    if (!this.dashboardData || !this.dashboardData.purchasesByUser) return;

    const purchasesByUser = this.dashboardData.purchasesByUser;

    // Datos para gráfico de top spenders
    this.topSpendersChartData = purchasesByUser
      .slice(0, 10)
      .map(user => [
        this.truncateUserName(user.userName),
        user.totalAmountSpent
      ]);
  }

  // === MÉTODOS DE DESCARGA DE REPORTES ===
  downloadReport(tipo: string, formato: 'excel' | 'pdf'): void {
    console.log(`Descargando reporte ${tipo} en formato ${formato}`);
    switch (tipo) {
      case 'usuarios': this.downloadUserReport(formato); break;
      case 'productos-vendidos': this.downloadTopProductsReport(formato); break;
      case 'productos-categoria': this.downloadProductsByCategoryReport(formato); break;
      case 'estado-pedidos': this.downloadOrdersByStatusReport(formato); break;
      case 'pedidos-fecha': this.downloadOrdersByDateReport(formato); break;
      case 'compras-usuario': this.downloadPurchasesByUserReport(formato); break;
    }
  }

  private downloadUserReport(formato: 'excel' | 'pdf'): void {
    const data = {
      title: 'Reporte de Usuarios Activos/Inactivos',
      headers: ['Estado', 'Cantidad', 'Porcentaje'],
      rows: [
        ['Activos', this.dashboardData?.userStats.activeUsers, this.dashboardData?.userStats.activePercentage + '%'],
        ['Inactivos', this.dashboardData?.userStats.inactiveUsers, 
         ((this.dashboardData!.userStats.inactiveUsers / this.dashboardData!.userStats.totalUsers) * 100).toFixed(1) + '%'],
        ['Total', this.dashboardData?.userStats.totalUsers, '100%']
      ]
    };
    this.generateFile(data, formato);
  }

  private downloadTopProductsReport(formato: 'excel' | 'pdf'): void {
    const headers = ['Producto', 'Categoría', 'Unidades Vendidas', 'Ingresos'];
    const rows = this.dashboardData!.topSellingProducts.map(product => [
      product.productName,
      product.categoryName,
      product.unitsSold.toString(),
      this.formatCurrency(product.totalRevenue)
    ]);

    this.generateFile({
      title: 'Reporte de Productos Más Vendidos',
      headers,
      rows
    }, formato);
  }

  private downloadProductsByCategoryReport(formato: 'excel' | 'pdf'): void {
    const headers = ['Categoría', 'Total Productos', 'Activos', 'Inactivos', '% Activos'];
    const rows = this.dashboardData!.productsByCategory.map(category => [
      category.categoryName,
      category.totalProducts.toString(),
      category.activeProducts.toString(),
      category.inactiveProducts.toString(),
      ((category.activeProducts / category.totalProducts) * 100).toFixed(1) + '%'
    ]);

    this.generateFile({
      title: 'Reporte de Productos por Categoría',
      headers,
      rows
    }, formato);
  }

  private downloadOrdersByStatusReport(formato: 'excel' | 'pdf'): void {
    const headers = ['Estado', 'Cantidad', 'Porcentaje', 'Ingresos'];
    const rows = this.dashboardData!.ordersByStatus.map(status => [
      this.translateStatus(status.status),
      status.totalOrders.toString(),
      status.percentage.toFixed(1) + '%',
      this.formatCurrency(status.totalRevenue)
    ]);

    this.generateFile({
      title: 'Reporte de Estado de Pedidos',
      headers,
      rows
    }, formato);
  }

  private downloadOrdersByDateReport(formato: 'excel' | 'pdf'): void {
    const headers = ['Fecha', 'Total Pedidos', 'Completados', 'Cancelados', 'Ingresos'];
    const rows = this.dashboardData!.ordersByDate.slice(0, 15).map(order => [
      this.formatDate(order.date),
      order.totalOrders.toString(),
      order.completedOrders.toString(),
      order.cancelledOrders.toString(),
      this.formatCurrency(order.totalRevenue)
    ]);

    this.generateFile({
      title: 'Reporte de Pedidos por Fecha',
      headers,
      rows
    }, formato);
  }

  private downloadPurchasesByUserReport(formato: 'excel' | 'pdf'): void {
    const headers = ['Usuario', 'Email', 'Total Compras', 'Monto Total', 'Promedio por Compra', 'Última Compra'];
    const rows = this.dashboardData!.purchasesByUser.map(user => [
      user.userName,
      user.userEmail,
      user.totalPurchases.toString(),
      this.formatCurrency(user.totalAmountSpent),
      this.formatCurrency(user.averageOrderAmount),
      this.formatLastPurchaseDate(user.lastPurchaseDate)
    ]);

    this.generateFile({
      title: 'Reporte de Compras por Usuario',
      headers,
      rows
    }, formato);
  }

  // === MÉTODO FINAL FUNCIONAL ===
  private generateFile(data: any, formato: 'excel' | 'pdf'): void {
    if (formato === 'excel') {
      // === Generar archivo Excel ===
      const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `${data.title}.xlsx`);
    } else {
      // === Generar archivo PDF ===
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(data.title, 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [data.headers],
        body: data.rows,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [237, 98, 12] } // naranja #ED620C
      });
      doc.save(`${data.title}.pdf`);
    }
  }

  // === MÉTODOS UTILITARIOS ===
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

  getPurchasesStats() {
    if (!this.dashboardData || !this.dashboardData.purchasesByUser) return null;

    const purchases = this.dashboardData.purchasesByUser;
    const totalUsers = purchases.length;
    const totalRevenue = purchases.reduce((sum, user) => sum + user.totalAmountSpent, 0);
    const totalPurchases = purchases.reduce((sum, user) => sum + user.totalPurchases, 0);
    const avgSpendingPerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const avgPurchasesPerUser = totalUsers > 0 ? totalPurchases / totalUsers : 0;

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

  getSpendingColor(amount: number): string {
    if (amount > 10000) return 'text-success';
    if (amount > 5000) return 'text-warning';
    if (amount > 1000) return 'text-info';
    return 'text-secondary';
  }

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

  truncateUserName(userName: string): string {
    return userName.length > 15 ? userName.substring(0, 15) + '...' : userName;
  }

  // === UTILIDADES ===
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-AR');
  }

  formatLastPurchaseDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

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

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  refreshDashboard(): void {
    this.loadDashboard();
  }
}