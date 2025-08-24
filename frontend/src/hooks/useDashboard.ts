import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

// Types for dashboard data
export interface DashboardStats {
  totalRevenue: number;
  totalAppointments: number;
  totalPatient: number;
  totalEmployee: number;
  newPatient: number;
  newInvoice?: {
    data: string;
    time: string;
  };
  newPatientAppointment?: {
    data: string;
    time: string;
  };
  newAppointment?: {
    data: string;
    time: string;
  };
  unpaidInvoice?: {
    data: string;
    time: string;
  };
  unapprovedTransaction?: {
    data: string;
    time: string;
  };
  underMaintenance?: {
    data: string;
    time: string;
  };
}

export interface ColumnChartData {
  data: Array<{
    label: string;
    totalReceipt: number;
    totalPayment: number;
  }>;
}

export interface LineChartData {
  data: Array<{
    label: string;
    revenueInMillions: number;
    totalAppointments: number;
  }>;
}

export interface PieChartData {
  confirmed: number;
  attended: number;
  absented: number;
  canceled: number;
}

// Dashboard stats hook
export const useDashboardStats = (filter: string = 'week') => {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', filter],
    queryFn: async () => {
      const response = await axiosInstance.get(`/owner/dashboard?filter=${filter}`);
      return response.data;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, 
  });
};

// Column chart hook
export const useColumnChart = (filter: string = 'month') => {
  return useQuery<ColumnChartData>({
    queryKey: ['column-chart', filter],
    queryFn: async () => {
      const response = await axiosInstance.get(`/owner/column-chart?filter=${filter}`);
      return response.data;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

// Line chart hook
export const useLineChart = (filter: string = 'week') => {
  return useQuery<LineChartData>({
    queryKey: ['line-chart', filter],
    queryFn: async () => {
      const response = await axiosInstance.get(`/owner/line-chart?filter=${filter}`);
      return response.data;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};

// Pie chart hook
export const usePieChart = (filter: string = 'week') => {
  return useQuery<PieChartData>({
    queryKey: ['pie-chart', filter],
    queryFn: async () => {
      const response = await axiosInstance.get(`/owner/pie-chart?filter=${filter}`);
      return response.data;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
};