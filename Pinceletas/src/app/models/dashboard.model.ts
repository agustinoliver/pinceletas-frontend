export interface UserStatsReport {
  active: number;
  inactive: number;
  total: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  activePercentage: number;
}

export interface SystemMetrics {
  serviceStatus: string;
  totalRequests: number;
  uptimePercentage: number;
}

export interface ProductStatsDto {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
}

export interface ProductsByCategoryDto {
  categoryName: string;
  categoryId: number;
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
}

export interface TopSellingProductDto {
  productId: number;
  productName: string;
  categoryName: string;
  unitsSold: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface OrdersByDateDto {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
}

export interface OrdersByStatusDto {
  status: string;
  totalOrders: number;
  totalRevenue: number;
  percentage: number;
}

export interface DashboardResponse {
  userStats: UserStats;
  systemMetrics: SystemMetrics;
  timestamp: string;
  
  productStats: ProductStatsDto;
  productsByCategory: ProductsByCategoryDto[];
  topSellingProducts: TopSellingProductDto[];
  
  ordersByDate: OrdersByDateDto[];
  ordersByStatus: OrdersByStatusDto[];

  purchasesByUser: PurchasesByUserDto[];
}

export interface PurchasesByUserDto {
  userId: number;
  userName: string;
  userEmail: string;
  totalPurchases: number;
  totalAmountSpent: number;
  averageOrderAmount: number;
  lastPurchaseDate: string;
  lastOrderStatus: string;
  lastOrderNumber: string;
}