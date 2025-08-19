import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, User, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DateRangePicker } from '../ui/DateRangePicker';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router';
import { isAppointmentCancellable } from '../../utils/appointmentUtils';
import type { AppointmentDTO, CalendarAppointment } from '../../types/appointment';
import {isToday} from '../../utils/date.ts';
import { useQueryClient } from '@tanstack/react-query';
interface AppointmentCalendarViewProps {
  appointments: AppointmentDTO[];
  onAppointmentClick?: (appointment: AppointmentDTO) => void;
}

export const AppointmentCalendarView: React.FC<AppointmentCalendarViewProps> = ({
  appointments,
}) => {
  const [currentWeek, setCurrentWeek] = useState(0);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const { role, userId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (userId) {
      if (lastUserId && lastUserId !== userId) {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
      setLastUserId(userId);
    }
  }, [userId, queryClient, lastUserId]);

  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + (weekOffset * 7));
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  // Generate month dates for month view
  const getMonthDates = (year: number, month: number) => {
    // const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const monthDates = [];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      monthDates.push(new Date(year, month, day));
    }
    return monthDates;
  };

  const currentDates = viewMode === 'week' ? getWeekDates(currentWeek) : getMonthDates(selectedYear, selectedMonth);

  // Handler for date range change
  const handleDateChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setViewMode('month');
  };

  // Filter appointments based on current view
  const filteredAppointments = useMemo(() => {
    if (viewMode === 'week') {
      return appointments;
    }

    // Filter appointments for selected month/year
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate.getFullYear() === selectedYear &&
        appointmentDate.getMonth() === selectedMonth;
    });
  }, [appointments, viewMode, selectedYear, selectedMonth]);
  // Transform appointments to calendar format
  const calendarAppointments = useMemo(() => {
    const appointmentMap: { [key: string]: CalendarAppointment[] } = {};

    filteredAppointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const dateKey = appointmentDate.toISOString().split('T')[0];

      if (!appointmentMap[dateKey]) {
        appointmentMap[dateKey] = [];
      }

      appointmentMap[dateKey].push({
        id: appointment.appointmentId,
        title: `${appointment.patientName} - ${appointment.dentistName}`,
        date: dateKey,
        time: appointment.appointmentTime.substring(0, 5), 
        status: appointment.status,
        type: appointment.appointmentType,
        isNewPatient: appointment.isNewPatient,
        details: appointment
      });
    });

    // Sort appointments by time for each date
    Object.keys(appointmentMap).forEach(date => {
      appointmentMap[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return appointmentMap;
  }, [filteredAppointments]);

  const getStatusColor = (
    status: 'confirmed' | 'canceled' | 'attended' | 'absented'
  ) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'canceled':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'attended':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'absented':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return '';
    }
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric'
    });
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => prev - 1);
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => prev + 1);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(0);
  }; return (
    <Card className="shadow-lg">
      {/* Calendar Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-bold">
            {viewMode === 'week' ? 'Lịch hẹn tuần' : 'Lịch hẹn tháng'}
          </CardTitle>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="text-xs"
            >
              Tuần
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="text-xs"
            >
              Tháng
            </Button>
          </div>

          {/* Date Range Picker for Month View */}
          {viewMode === 'month' && (
            <DateRangePicker
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onDateChange={handleDateChange}
            />
          )}

          {/* Week Navigation for Week View */}
          {viewMode === 'week' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                title="Tuần trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={goToCurrentWeek}
              >
                Hôm nay
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                title="Tuần sau"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      {/* Calendar Grid */}
      <CardContent className="p-3 sm:p-6">
        <div className={`grid gap-2 mb-4 ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'}`}>
          {currentDates.slice(0, viewMode === 'week' ? 7 : Math.min(currentDates.length, 7)).map((date, index) => (
            <div
              key={index}
              className={`text-center p-2 sm:p-3 rounded-lg ${isToday(date)
                ? 'bg-blue-100 text-blue-900 font-bold'
                : 'text-gray-700'
                }`}
            >
              <div className="text-xs sm:text-sm font-medium">{formatDateHeader(date)}</div>
            </div>
          ))}
        </div>

        {/* Desktop Calendar Body */}
        <div className={`hidden sm:grid gap-2 ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} ${viewMode === 'month' ? 'min-h-[600px]' : 'min-h-[400px]'}`}>
          {currentDates.map((date, index) => {
            const dateKey = date.toISOString().split('T')[0];
            const dayAppointments = calendarAppointments[dateKey] || [];

            return (
              <div
                key={index}
                className={`border border-gray-200 p-2 ${viewMode === 'month' ? 'min-h-[100px]' : 'min-h-[120px]'} ${isToday(date) ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                  }`}
              >
                {viewMode === 'month' && (
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {date.getDate()}
                  </div>
                )}

                <div className="space-y-1">
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      onClick={() => {
                        if (role === 'Patient') {
                          navigate(`/patient/appointments/${appointment.details.appointmentId}`);
                        } else {
                          navigate(`/appointments/${appointment.details.appointmentId}`);
                        }
                      }}
                      className={`p-2 border cursor-pointer hover:shadow-sm transition-all text-xs ${getStatusColor(appointment.status)}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{appointment.time}</span>
                        <div className="flex items-center space-x-1">
                          {appointment.isNewPatient && (
                            <Badge variant="outline" className="text-xs px-1">Mới</Badge>
                          )}
                          {appointment.details.isExistPrescription && (
                            <Badge variant="success" className="text-xs px-1">Thuốc</Badge>
                          )}
                          {role === 'Patient' && appointment.status === 'confirmed' &&
                            !isAppointmentCancellable(appointment.details.appointmentDate, appointment.details.appointmentTime) && (
                              <div title="Không thể hủy">
                                <AlertTriangle className="h-3 w-3 text-yellow-600" />
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span className="truncate">{appointment.details.patientName}</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          <span className="truncate">{appointment.type === 'follow-up'
                            ? 'Tái khám'
                            : appointment.type === 'consultation'
                              ? 'Tư vấn'
                              : appointment.type === 'treatment'
                                ? 'Điều trị'
                                : appointment.type === 'first-time'
                                  ? 'Khám lần đầu '
                                  : appointment.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {dayAppointments.length === 0 && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span className="text-xs">Không có lịch hẹn</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Calendar Body */}
        <div className="sm:hidden overflow-x-auto">
          <div className="min-w-[700px]">
            <div className={`grid gap-2 ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} ${viewMode === 'month' ? 'min-h-[600px]' : 'min-h-[400px]'}`}>
              {currentDates.map((date, index) => {
                const dateKey = date.toISOString().split('T')[0];
                const dayAppointments = calendarAppointments[dateKey] || [];

                return (
                  <div
                    key={index}
                    className={`border border-gray-200 p-2 min-w-[90px] ${viewMode === 'month' ? 'min-h-[100px]' : 'min-h-[120px]'} ${isToday(date) ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                      }`}
                  >
                    {viewMode === 'month' && (
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {date.getDate()}
                      </div>
                    )}

                    <div className="space-y-1">
                      {dayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          onClick={() => {
                            if (role === 'Patient') {
                              navigate(`/patient/appointments/${appointment.details.appointmentId}`);
                            } else {
                              navigate(`/appointments/${appointment.details.appointmentId}`);
                            }
                          }}
                          className={`p-1.5 border cursor-pointer hover:shadow-sm transition-all text-xs ${getStatusColor(appointment.status)}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs">{appointment.time}</span>
                            <div className="flex items-center space-x-1">
                              {appointment.isNewPatient && (
                                <Badge variant="outline" className="text-xs px-1">Mới</Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate text-xs">{appointment.details.patientName}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {dayAppointments.length === 0 && (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <span className="text-xs">Không có</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-sm text-gray-600">Đã xác nhận</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-sm text-gray-600">Đã hủy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
          <span className="text-sm text-gray-600">Đã đến</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
          <span className="text-sm text-gray-600">Vắng</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-white border border-gray-400 rounded"></div>
          <span className="text-sm text-gray-600">Bệnh nhân mới</span>
        </div>
      </div>
    </Card>
  );
};