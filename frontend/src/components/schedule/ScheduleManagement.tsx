import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenUtils } from '../../utils/tokenUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DentistScheduleEditorWithCalendar } from './DentistScheduleEditorWithCalendar';
import { ScheduleApproval } from './ScheduleApproval';
import { ScheduleListWithCalendar } from './ScheduleListWithCalendar';
export const ScheduleManagement: React.FC = () => {
  // Lấy thông tin người dùng từ TokenUtils
  const userData = TokenUtils.getUserData();
  const role = userData.role;
  const userId = userData.userId;
  const roleTableId = userData.role_table_id;

  // Xác định quyền truy cập dựa trên vai trò
  const isDentist = role === 'Dentist';
  const isAdmin = role === 'Admin' || role === 'Owner';

  // Xác định dentistId nếu user là dentist
  const dentistId = isDentist && roleTableId ? Number(roleTableId) : undefined;

  // Các role khác chỉ xem, không cho chọn tab
  const isOther = !isDentist && !isAdmin;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Quản lý lịch làm việc</h1>
      <Tabs defaultValue="view" className="w-full">
        {/* Ẩn TabsList nếu không phải dentist hoặc admin */}
        {!(isOther) && (
          <TabsList className="mb-6">
            <TabsTrigger value="view">Xem lịch làm việc</TabsTrigger>
            {isDentist && (
              <TabsTrigger value="manage">Quản lý lịch cá nhân</TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="approve">Phê duyệt lịch</TabsTrigger>
            )}
          </TabsList>
        )}

        {/* Tab Xem lịch làm việc */}
        <TabsContent value="view" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Lịch làm việc {isDentist ? 'của bạn' : 'bác sĩ'}
              </CardTitle>
              <CardDescription>
                {isDentist
                  ? 'Xem lịch làm việc của bạn và trạng thái phê duyệt'
                  : 'Xem lịch làm việc đã được phê duyệt của tất cả bác sĩ trong phòng khám'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDentist ? (
                <ScheduleListWithCalendar dentistId={dentistId} />
              ) : (
                <ScheduleApproval viewOnlyApproved />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isDentist && (
          <TabsContent value="manage" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý lịch làm việc cá nhân</CardTitle>
                <CardDescription>
                  Thêm hoặc chỉnh sửa lịch làm việc của bạn. Lịch cần được phê duyệt bởi quản trị viên.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DentistScheduleEditorWithCalendar dentistId={dentistId} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="approve" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>Phê duyệt lịch làm việc</CardTitle>
                <CardDescription>
                  Xem xét và phê duyệt lịch làm việc đã đăng ký của bác sĩ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduleApproval />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};