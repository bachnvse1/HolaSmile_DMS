import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, Search, Filter, FileText, Calendar, DollarSign, ArrowLeft, Trash2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Slider } from '@/components/ui/slider';
import { DateRangePicker } from '@/components/ui/date-picker';
import { Pagination } from '@/components/ui/Pagination';
import { useOrthodonticTreatmentPlans, useDeactivateOrthodonticTreatmentPlan } from '@/hooks/useOrthodonticTreatmentPlan';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDate } from '@/utils/dateUtils';
import type { OrthodonticTreatmentPlan } from '@/types/orthodonticTreatmentPlan';
import { useUserInfo } from '@/hooks/useUserInfo';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { TokenUtils } from '@/utils/tokenUtils';
export const OrthodonticTreatmentPlanList: React.FC = () => {
  const { patientId: paramPatientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Filter state
  const [selectedTemplate, setSelectedTemplate] = useState('all');
  const [selectedDentist, setSelectedDentist] = useState('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  // const [priceSliderRange, setPriceSliderRange] = useState([0, 100000000]); // For slider

  const userInfo = useUserInfo();
  const isDentist = userInfo?.role === 'Dentist';
  let patientId: string | undefined = paramPatientId;
  if (userInfo?.role === 'Patient') {
    const roleTableId = userInfo.roleTableId ?? TokenUtils.getRoleTableIdFromToken(localStorage.getItem('token') || '');
    patientId = roleTableId === null ? undefined : roleTableId;
  }

  const { data: treatmentPlans = [], isLoading, error } = useOrthodonticTreatmentPlans(
    parseInt(patientId || '0')
  );

  // Get unique values for filter options
  const uniqueTemplates = useMemo(() => {
    if (!Array.isArray(treatmentPlans)) return [];
    return [...new Set(treatmentPlans.map((plan: OrthodonticTreatmentPlan) => plan.templateName))];
  }, [treatmentPlans]);

  const uniqueDentists = useMemo(() => {
    if (!Array.isArray(treatmentPlans)) return [];
    return [...new Set(treatmentPlans.map((plan: OrthodonticTreatmentPlan) => (plan as { dentistName?: string }).dentistName).filter(Boolean))];
  }, [treatmentPlans]);

  // Advanced filtering logic
  const filteredPlans = useMemo(() => {
    if (!Array.isArray(treatmentPlans)) return [];
    return treatmentPlans.filter((plan: OrthodonticTreatmentPlan) => {
      // Search term filter
      const matchesSearch = plan.planTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.treatmentPlanContent || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.reasonForVisit || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Template filter
      const matchesTemplate = !selectedTemplate || selectedTemplate === 'all' || plan.templateName === selectedTemplate;

      // Dentist filter
      const matchesDentist = !selectedDentist || selectedDentist === 'all' || (plan as { dentistName?: string }).dentistName === selectedDentist;

      // Date range filter
      const matchesDateRange = !dateRange.from || !dateRange.to ||
        (new Date(plan.createdAt) >= dateRange.from &&
          new Date(plan.createdAt) <= new Date(dateRange.to.getTime() + 24 * 60 * 60 * 1000 - 1));

      // Price range filter
      const matchesPriceRange = (!priceRange.min || plan.totalCost >= parseInt(priceRange.min)) &&
        (!priceRange.max || plan.totalCost <= parseInt(priceRange.max));

      return matchesSearch && matchesTemplate && matchesDentist && matchesDateRange && matchesPriceRange;
    });
  }, [treatmentPlans, searchTerm, selectedTemplate, selectedDentist, dateRange, priceRange]);

  // Pagination logic
  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPlans.slice(startIndex, endIndex);
  }, [filteredPlans, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTemplate, selectedDentist, dateRange, priceRange]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTemplate('all');
    setSelectedDentist('all');
    setDateRange({ from: undefined, to: undefined });
    setPriceRange({ min: '', max: '' });
    // setPriceSliderRange([0, 100000000]);
  };

  const handleCreatePlan = () => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans/create`);
  };

  const handleViewPlan = (planId: number) => {
    if (userInfo.role !== 'Patient') {
      navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}`);
    }
    else {
      navigate(`/patient/orthodontic-treatment-plans/${planId}`);
    }
  };

  const handleEditPlan = (planId: number) => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}/edit`);
  };

  const handleViewPlanImages = (planId: number) => {
    // You can navigate to a dedicated images page or open a modal
    navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}/images`);
  };

  const deactivateMutation = useDeactivateOrthodonticTreatmentPlan();

  const handleDeletePlan = (planId: number) => {
    setDeletingPlanId(planId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingPlanId) return;

    setIsDeleting(true);
    try {
      await deactivateMutation.mutateAsync(deletingPlanId);
      window.location.reload(); // Refresh to show updated list
    } catch (error) {
      console.error('Error deleting plan:', error);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
      setDeletingPlanId(null);
    }
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
    // Check if it's a 404 error (no data found) - this is normal, not an error
    const is404Error = error.message.includes('404') || error.message.includes('Not Found');
    
    if (is404Error) {
      // Treat 404 as empty data, not an error
      return (
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center gap-4">
              {userInfo?.role !== 'Patient' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/patients')}
                  title="Quay lại danh sách bệnh nhân"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kế Hoạch Điều Trị Chỉnh Nha</h1>
                {isDentist && (
                  <p className="text-gray-600 mt-1">Quản lý kế hoạch điều trị nha khoa cho bệnh nhân</p>
                )}
              </div>
            </div>
            {isDentist && (
              <Button onClick={handleCreatePlan} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Thêm Kế Hoạch Điều Trị
              </Button>
            )}
          </div>

          {/* Empty state for 404 */}
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có kế hoạch điều trị nào
              </h3>
              <p className="text-gray-600 mb-4">
                {isDentist ? 'Bắt đầu tạo kế hoạch điều trị đầu tiên cho bệnh nhân này' : 'Chưa có kế hoạch điều trị nào được tạo cho bạn'}
              </p>
              {isDentist && (
                <Button onClick={handleCreatePlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Kế Hoạch Điều Trị
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    // Check if it's an authentication error
    const isAuthError = error.message.includes('401') || error.message.includes('403') || 
                       error.message.includes('Unauthorized') || error.message.includes('Forbidden');
    
    if (isAuthError) {
      return (
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600">Phiên đăng nhập đã hết hạn hoặc không có quyền truy cập</p>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  window.location.href = '/';
                }}
                className="mt-2"
              >
                Đăng nhập lại
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Other errors
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

  // Handle case when no patient ID is available
  if (!patientId || patientId === '0') {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600">Không xác định được thông tin bệnh nhân</p>
            <Button
              variant="outline"
              onClick={() => navigate('/patients')}
              className="mt-2"
            >
              Quay lại danh sách bệnh nhân
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
        <div className="flex items-center gap-4">
          {userInfo.role !== 'Patient' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/patients')}
              title="Quay lại danh sách bệnh nhân"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kế Hoạch Điều Trị Chỉnh Nha</h1>
            {isDentist && (
              <p className="text-gray-600 mt-1">Quản lý kế hoạch điều trị nha khoa cho bệnh nhân</p>
            )}
          </div>
        </div>
        {isDentist && (
          <Button onClick={handleCreatePlan} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Thêm Kế Hoạch Điều Trị
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên kế hoạch, tên mẫu, nội dung điều trị..."
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

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Template Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mẫu
                  </label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả các mẫu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {uniqueTemplates.map((template) => (
                        <SelectItem key={template as string} value={template as string}>
                          {template as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dentist Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bác sĩ phụ trách
                  </label>
                  <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả bác sĩ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {uniqueDentists.map((dentist) => (
                        <SelectItem key={dentist as string} value={dentist as string}>
                          {dentist as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="md:col-span-2">
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khoảng thời gian
                    </label>
                  </div>
                  <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    fromPlaceholder="Từ ngày"
                    toPlaceholder="Đến ngày"
                  />
                </div>

                {/* Price Range Filter với Slider */}
                {/* <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Khoảng chi phí: {formatCurrency(priceSliderRange[0])} - {formatCurrency(priceSliderRange[1])}
                  </label>
                  <div className="px-2">
                    <Slider
                      value={priceSliderRange}
                      onValueChange={(value) => {
                        setPriceSliderRange(value);
                        setPriceRange({
                          min: value[0].toString(),
                          max: value[1].toString()
                        });
                      }}
                      max={100000000}
                      min={0}
                      step={1000000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0đ</span>
                      <span>100tr</span>
                    </div>
                  </div>
                </div> */}

                {/* Clear Filters Button */}
                <div className="md:col-span-2 lg:col-span-4">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full md:w-auto"
                  >
                    Xóa bộ lọc
                  </Button>
                  <span className="ml-2 text-sm text-gray-600">
                    Tìm thấy {filteredPlans.length} kết quả
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Kế Hoạch</p>
                <p className="text-2xl font-bold text-gray-900">{Array.isArray(treatmentPlans) ? treatmentPlans.length : 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kết Quả Lọc</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPlans.length}</p>
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
                  {formatCurrency(filteredPlans.reduce((sum: number, plan: OrthodonticTreatmentPlan) => sum + plan.totalCost, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mẫu Sử Dụng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(treatmentPlans.map(plan => plan.templateName)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Treatment Plans List */}
      <div className="space-y-4">
        {!Array.isArray(treatmentPlans) || treatmentPlans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chưa có kế hoạch điều trị nào
              </h3>
              <p className="text-gray-600 mb-4">
                {isDentist ? 'Bắt đầu tạo kế hoạch điều trị đầu tiên cho bệnh nhân này' : 'Chưa có kế hoạch điều trị nào được tạo cho bệnh nhân này'}
              </p>
              {isDentist && (
                <Button onClick={handleCreatePlan}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Kế Hoạch Điều Trị
                </Button>
              )}
            </CardContent>
          </Card>
        ) : filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy kết quả phù hợp
              </h3>
              <p className="text-gray-600 mb-4">
                Thử thay đổi điều kiện tìm kiếm hoặc bộ lọc
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedPlans.map((plan: OrthodonticTreatmentPlan) => (
              <TreatmentPlanCard
                key={plan.planId}
                plan={plan}
                onView={() => handleViewPlan(plan.planId)}
                onEdit={() => handleEditPlan(plan.planId)}
                onDelete={() => handleDeletePlan(plan.planId)}
                onViewImages={() => handleViewPlanImages(plan.planId)}
              />
            ))}

            {/* Pagination Controls */}
            {paginatedPlans.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredPlans.length}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={setItemsPerPage}
                    className="my-2"
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa kế hoạch điều trị"
        message="Bạn có chắc chắn muốn xóa kế hoạch điều trị này? Hành động này không thể hoàn tác."
        confirmText="Xóa kế hoạch"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};

interface TreatmentPlanCardProps {
  plan: OrthodonticTreatmentPlan;
  onView: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onViewImages?: (planId: number) => void;
}

const TreatmentPlanCard: React.FC<TreatmentPlanCardProps> = ({ plan, onView, onEdit, onDelete, onViewImages }) => {
  const userInfo = useUserInfo();
  const isDentist = userInfo?.role === 'Dentist';
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate pr-2">
                {plan.planTitle}
              </h3>
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                {plan.templateName}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium">Ngày tạo:</p>
                <p>{formatDate(new Date(plan.createdAt), 'dd/MM/yyyy HH:mm:ss')}</p>
              </div>
              <div>
                <p className="font-medium">Bác sĩ phụ trách:</p>
                <p>
                  {(plan as { dentistName?: string }).dentistName || 'Chưa xác định'}
                </p>
              </div>
              <div>
                <p className="font-medium">Chi phí dự kiến:</p>
                <p className="text-green-600 font-semibold">
                  {formatCurrency(plan.totalCost)}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-1">Nội dung điều trị:</p>
                <div className="text-sm text-black-700 leading-relaxed">
                  <p className="line-clamp-3 break-words overflow-hidden whitespace-pre-wrap">
                    {plan.treatmentPlanContent || 'Chưa có nội dung điều trị'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 line-clamp-2 break-words">
                  <span className="font-medium">Lý do khám:</span> {plan.reasonForVisit || 'Chưa có thông tin'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              Chi Tiết
            </Button>
            {onViewImages && (
              <Button variant="outline" size="sm" onClick={() => onViewImages(plan.planId)} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 w-full sm:w-auto">
                <Camera className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ảnh</span>
              </Button>
            )}
            {isDentist && (
              <>
                <Button variant="outline" size="sm" onClick={onEdit} className='text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full sm:w-auto'>
                  Chỉnh Sửa
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Xóa</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};