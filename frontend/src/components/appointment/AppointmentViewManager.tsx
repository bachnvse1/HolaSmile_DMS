import { useState, useEffect } from 'react';
import { List, Calendar, RotateCcw, AlertCircle } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { AppointmentListView } from './AppointmentListView';
import { AppointmentCalendarView } from './AppointmentCalendarView';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export const AppointmentViewManager = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { data: appointments, isLoading, error, refetch } = useAppointments();

  // Clear cache when user changes (not on first mount)
  useEffect(() => {
    if (userId) {
      if (lastUserId && lastUserId !== userId) {
        // User has changed, clear cache
        console.log('User changed, clearing cache:', lastUserId, '->', userId);
        queryClient.clear(); // Clear all cache
        
        // Force refetch after clearing cache
        setTimeout(() => {
          refetch();
        }, 50);
      }
      // Update last user ID
      setLastUserId(userId);
    }
  }, [userId, queryClient, refetch, lastUserId]);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải danh sách lịch hẹn...</span>
      </div>
    );
  }
  if (error) {
    // Kiểm tra xem có phải lỗi 400 (không có dữ liệu) không
    const errorWithResponse = error as { response?: { status?: number } };
    const isNoDataError = errorWithResponse?.response?.status === 400 || 
                          error?.message?.includes('400') ||
                          error?.message?.includes('No data found');
    
    if (isNoDataError) {
      return (
        <div className="text-center py-12">
          <Card className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <CardContent className="p-6">
              <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-blue-600 mb-4">Hiện tại chưa có lịch hẹn nào</p>
              <p className="text-sm text-gray-600 mb-4">Danh sách lịch hẹn trống hoặc chưa có dữ liệu</p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <Card className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <CardContent className="p-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Có lỗi xảy ra khi tải danh sách lịch hẹn</p>
            <Button
              onClick={handleRefresh}
              variant="destructive"
              className="w-full"
            >
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Kiểm tra nếu danh sách appointments rỗng
  if (appointments && appointments.length === 0) {
    return (
      <div className="text-center py-12">
        <Card className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
          <CardContent className="p-6">
            <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-blue-600 mb-4">Hiện tại chưa có lịch hẹn nào</p>
            <p className="text-sm text-gray-600 mb-4">Chưa có lịch hẹn nào được tạo trong hệ thống</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle & Actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center"
            >
              <List className="h-4 w-4 mr-2" />
              Danh sách
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="flex items-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Lịch
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Làm mới
            </Button>

            <Badge variant="secondary" className="text-sm">
              {appointments?.length || 0} lịch hẹn
            </Badge>
          </div>
        </div>
      </Card>

      {/* View Content */}
      {viewMode === 'list' ? (
        <AppointmentListView
          appointments={appointments || []}
        />
      ) : (
        <AppointmentCalendarView
          appointments={appointments || []}
        />
      )}

      {/* Detail Modal */}
      {/* <AppointmentDetailModal
        appointment={selectedAppointment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        dentists={dentists}
      /> */}
    </div>
  );
};