import React from 'react';
import { ScheduleManagement } from '../../components/schedule/ScheduleManagement';
import { AuthGuard } from '../../components/AuthGuard';
import { StaffLayout } from '@/layouts/staff';
import { useUserInfo } from '@/hooks/useUserInfo';

const ScheduleManagementPage: React.FC = () => {
    const userInfo = useUserInfo();

    return (
        <AuthGuard requiredRoles={['Owner', 'Receptionist', 'Dentist']}>
            <StaffLayout userInfo={userInfo}>
                <ScheduleManagement />
            </StaffLayout>
        </AuthGuard>
    );
};

export default ScheduleManagementPage;