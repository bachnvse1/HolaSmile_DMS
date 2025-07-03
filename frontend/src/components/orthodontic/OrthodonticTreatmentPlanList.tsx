import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, Search, Filter, FileText, Calendar, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrthodonticTreatmentPlans } from '@/hooks/useMockOrthodonticTreatmentPlan';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateWithDay } from '@/utils/dateUtils';
import type { OrthodonticTreatmentPlan } from '@/types/orthodonticTreatmentPlan';

export const OrthodonticTreatmentPlanList: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: treatmentPlans = [], isLoading, error } = useOrthodonticTreatmentPlans(
    parseInt(patientId || '0')
  );

  // Debug log
  console.log('OrthodonticTreatmentPlanList Debug:', {
    patientId,
    treatmentPlans,
    isLoading,
    error
  });

  const filteredPlans = treatmentPlans.filter(plan =>
    plan.planTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.templateName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePlan = () => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans/create`);
  };

  const handleViewPlan = (planId: number) => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}`);
  };

  const handleEditPlan = (planId: number) => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu: {error.message}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kế Hoạch Điều Trị Chỉnh Hình</h1>
          <p className="text-gray-600 mt-1">Quản lý kế hoạch điều trị nha khoa cho bệnh nhân</p>
        </div>
        <Button onClick={handleCreatePlan} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Thêm Kế Hoạch Điều Trị
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên kế hoạch hoặc template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Kế Hoạch</p>
                <p className="text-2xl font-bold text-gray-900">{treatmentPlans.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kế Hoạch Gần Đây</p>
                <p className="text-2xl font-bold text-gray-900">
                  {treatmentPlans.filter(plan => {
                    const planDate = new Date(plan.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return planDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Chi Phí</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(treatmentPlans.reduce((sum, plan) => sum + plan.totalCost, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Template Sử Dụng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(treatmentPlans.map(plan => plan.templateName)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treatment Plans List */}
      <div className="space-y-4">
        {filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có kế hoạch điều trị nào
              </h3>
              <p className="text-gray-600 mb-4">
                Bắt đầu tạo kế hoạch điều trị đầu tiên cho bệnh nhân này
              </p>
              <Button onClick={handleCreatePlan}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Kế Hoạch Điều Trị
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPlans.map((plan) => (
            <TreatmentPlanCard
              key={plan.planId}
              plan={plan}
              onView={() => handleViewPlan(plan.planId)}
              onEdit={() => handleEditPlan(plan.planId)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface TreatmentPlanCardProps {
  plan: OrthodonticTreatmentPlan;
  onView: () => void;
  onEdit: () => void;
}

const TreatmentPlanCard: React.FC<TreatmentPlanCardProps> = ({ plan, onView, onEdit }) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {plan.planTitle}
              </h3>
              <Badge variant="secondary" className="ml-2">
                {plan.templateName}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium">Ngày tạo:</p>
                <p>{formatDateWithDay(plan.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium">Chi phí dự kiến:</p>
                <p className="text-green-600 font-semibold">
                  {formatCurrency(plan.totalCost)}
                </p>
              </div>
              <div>
                <p className="font-medium">Phương thức thanh toán:</p>
                <p>{plan.paymentMethod}</p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-sm text-gray-600 line-clamp-2">
                <span className="font-medium">Lý do khám:</span> {plan.reasonForVisit}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              Chi Tiết
            </Button>
            <Button variant="default" size="sm" onClick={onEdit}>
              Chỉnh Sửa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};