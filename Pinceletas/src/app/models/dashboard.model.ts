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

export interface DashboardResponse {
  userStats: UserStats;
  systemMetrics: SystemMetrics;
  timestamp: string;
}