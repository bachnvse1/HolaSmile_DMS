import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, FileText, Layers, User, CalendarDays, BadgeCheck, Settings2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { StaffLayout } from '../layouts/staff/StaffLayout';
import { AuthGuard } from '../components/AuthGuard';
import type { OrthodonticTreatmentPlan } from '../types/orthodontic';
import { useUserInfo } from '@/hooks/useUserInfo';

// Dữ liệu mẫu
const MOCK_PLANS: OrthodonticTreatmentPlan[] = [
    {
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
    },
];

export default function OrthodonticTreatmentPlansPage() {
    const navigate = useNavigate();
    const { patientId } = useParams();
    const userInfo = useUserInfo();

    const [plans, setPlans] = useState<OrthodonticTreatmentPlan[]>(MOCK_PLANS);

    const handleAdd = () => {
        navigate(`/patients/${patientId}/orthodontic-treatment-plans/new`);
    };

    const handleEdit = (plan: OrthodonticTreatmentPlan) => {
        navigate(`/patients/${patientId}/orthodontic-treatment-plans/${plan.planId}/edit`);
    };

    const handleDelete = (planId: number) => {
        setPlans(plans.filter((p) => p.planId !== planId));
        toast.success('Đã xóa kế hoạch điều trị!');
    };

    return (
        <AuthGuard requiredRoles={['Dentist']}>
            <StaffLayout userInfo={userInfo}>
                <div className="w-full flex justify-center px-1 md:px-0">
                    <Card className="w-full max-w-5xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 px-2 md:px-6">
                            <CardTitle className="text-xl font-bold">Kế hoạch điều trị chỉnh nha</CardTitle>
                            <Button onClick={handleAdd} variant="default" className="gap-2">
                                <Plus size={18} /> Thêm mới
                            </Button>
                        </CardHeader>
                        <CardContent className="px-0 md:px-6">
                            <div className="overflow-x-auto w-full">
                                <Table className="min-w-[700px] w-full text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead><span className="flex items-center gap-1 text-blue-600"><FileText size={16} className="text-blue-600" />Tiêu đề</span></TableHead>
                                            <TableHead><span className="flex items-center gap-1 text-purple-600"><Layers size={16} className="text-purple-600" />Mẫu</span></TableHead>
                                            <TableHead><span className="flex items-center gap-1 text-orange-600"><User size={16} className="text-orange-600" />Bác sĩ</span></TableHead>
                                            <TableHead><span className="flex items-center gap-1 text-sky-600"><CalendarDays size={16} className="text-sky-600" />Ngày tạo</span></TableHead>
                                            <TableHead><span className="flex items-center gap-1 text-green-600"><BadgeCheck size={16} className="text-green-600" />Trạng thái</span></TableHead>
                                            <TableHead><span className="flex items-center gap-1 text-gray-500"><Settings2 size={16} className="text-gray-500" />Hành động</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plans.map((plan) => (
                                            <TableRow key={plan.planId}>
                                                <TableCell>{plan.planTitle}</TableCell>
                                                <TableCell>{plan.templateName}</TableCell>
                                                <TableCell>{plan.dentistId}</TableCell>
                                                <TableCell>{plan.createdAt?.slice(0, 10)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={plan.isDeleted ? 'destructive' : 'default'}>
                                                        {plan.isDeleted ? 'Đã xóa' : 'Hoạt động'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 px-2 py-1 h-8" onClick={() => handleEdit(plan)}>
                                                            <Pencil className="h-4 w-4 mr-1" />Sửa
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800 px-2 py-1 h-8" onClick={() => handleDelete(plan.planId)}>
                                                            <Trash2 className="h-4 w-4 mr-1" />Xóa
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </StaffLayout>
        </AuthGuard>
    );
}
