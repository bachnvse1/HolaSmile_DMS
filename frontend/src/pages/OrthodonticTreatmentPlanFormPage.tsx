import { useNavigate, useParams } from 'react-router';
import OrthodonticTreatmentPlanForm from '../components/OrthodonticTreatmentPlanForm';
import type { OrthodonticTreatmentPlan } from '../types/orthodontic';
import { StaffLayout } from '../layouts/staff/StaffLayout';
import { useAuth } from '../hooks/useAuth';
import { AuthGuard } from '../components/AuthGuard';
// Dữ liệu mẫu cho edit demo
const MOCK_PLAN: OrthodonticTreatmentPlan = {
    planId: 1,
    patientId: 55,
    dentistId: 2,
    planTitle: 'Kế hoạch chỉnh nha lần 1',
    templateName: 'Mẫu A',
    treatmentHistory: 'Chưa từng điều trị',
    reasonForVisit: 'Chỉnh nha',
    examinationFindings: 'Khớp cắn lệch',
    intraoralExam: 'Răng chen chúc',
    xRayAnalysis: 'Xương hàm bình thường',
    modelAnalysis: 'Cung hàm hẹp',
    treatmentPlanContent: 'Niềng răng mắc cài kim loại',
    totalCost: 25000000,
    paymentMethod: 'Trả góp',
    createdAt: '2024-06-01T10:00:00',
    updatedAt: '2024-06-01T10:00:00',
    createdBy: 1,
    updatedBy: 1,
    isDeleted: false,
};

export default function OrthodonticTreatmentPlanFormPage() {
    const { username, role, userId } = useAuth();
    // Create userInfo object for StaffLayout
    const userInfo = {
        id: userId || '',
        name: username || 'User',
        email: '',
        role: role || '',
        avatar: undefined
    };
    const navigate = useNavigate();
    const { patientId, planId } = useParams();
    // Lấy dữ liệu mẫu nếu là edit
    const initialData = planId ? MOCK_PLAN : undefined;

    const handleSave = (plan: OrthodonticTreatmentPlan) => {
        // TODO: Lưu dữ liệu (mock hoặc localStorage)
        navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
    };

    return (
        <AuthGuard requiredRoles={['Dentist']}>
            <StaffLayout userInfo={userInfo}>
                <div className="max-w-4xl mx-auto py-8">
                    <h1 className="text-2xl font-bold mb-6">{planId ? 'Cập nhật kế hoạch điều trị' : 'Thêm kế hoạch điều trị'}</h1>
                    <OrthodonticTreatmentPlanForm
                        onSave={handleSave}
                        initialData={initialData}
                    />
                </div>
            </StaffLayout>
        </AuthGuard>
    );
}
