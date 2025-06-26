import React from 'react';
import { ScheduleManagement } from '../../components/schedule/ScheduleManagement';
import { AuthGuard } from '../../components/AuthGuard';
import { StaffLayout } from '@/layouts/staff';
import { useAuth } from '@/hooks/useAuth';

const ScheduleManagementPage: React.FC = () => {
    const { username, role, userId } = useAuth();
    const user = {
        username: username || '',
        role: role || '',
        userId: userId || '',
        name: username || '',
        email: ''
    };

    return (
        <AuthGuard requiredRoles={['Owner', 'Receptionist', 'Dentist']}>
            <StaffLayout userInfo={user}>
                <ScheduleManagement />
            </StaffLayout>
        </AuthGuard>
    );
};

export default ScheduleManagementPage;