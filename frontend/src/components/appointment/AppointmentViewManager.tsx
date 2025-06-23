import { useState } from 'react';
import { List, Calendar, RotateCcw, AlertCircle } from 'lucide-react';
import { useAppointments } from '../../hooks/useAppointments';
import { AppointmentListView } from './AppointmentListView';
import { AppointmentCalendarView } from './AppointmentCalendarView';
import { AppointmentDetailModal } from './AppointmentDetailModal';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { AppointmentDTO } from '../../types/appointment';

export const AppointmentViewManager = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: appointments, isLoading, error, refetch } = useAppointments();
  const handleAppointmentClick = (appointment: AppointmentDTO) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    refetch();
  };

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
          onAppointmentClick={handleAppointmentClick}
        />
      ) : (
        <AppointmentCalendarView 
          appointments={appointments || []} 
          onAppointmentClick={handleAppointmentClick}
        />
      )}

      {/* Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};