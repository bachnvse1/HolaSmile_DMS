import React, { useState } from "react";
import {
  Calendar,
  Clock,
  UserCheck,
  MoreHorizontal,
  Edit2,
  Trash2,
  FileText,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Camera,
  Eye
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button2";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { TreatmentRecord } from "@/types/treatment";
import { formatCurrency } from "@/utils/currencyUtils";
import { formatDateOnly } from "@/utils/date";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useUserInfo } from "@/hooks/useUserInfo";

interface RecordRowProps {
  record: TreatmentRecord;
  onEdit: (record: TreatmentRecord) => void;
  onToggleDelete: (id: number) => void;
  onOpenInvoiceModal: (patientId: number, treatmentRecordId: number) => void;
  onViewDetail: (record: TreatmentRecord) => void; // New prop
  patientId: number;
  readonly?: boolean;
  orderNumber?: number;
}

// Status configuration with improved styling
const STATUS_CONFIG = {
  pending: {
    label: "Đã lên lịch",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  "in-progress": {
    label: "Đang điều trị",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  completed: {
    label: "Đã hoàn tất",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  canceled: {
    label: "Đã huỷ",
    color: "bg-red-100 text-red-800 border-red-200",
  },
} as const;

const getStatusConfig = (status: string) => {
  const normalizedStatus = status?.toLowerCase() as keyof typeof STATUS_CONFIG;
  return STATUS_CONFIG[normalizedStatus] || {
    label: status || "Không xác định",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: "❓",
  };
};

// Helper function to determine if appointment is upcoming
const isUpcomingAppointment = (appointmentDate: string) => {
  const today = new Date();
  const appointment = new Date(appointmentDate);
  const diffTime = appointment.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

const RecordRow: React.FC<RecordRowProps> = ({
  record,
  onEdit,
  onToggleDelete,
  onOpenInvoiceModal,
  onViewDetail, // New prop
  patientId,
  readonly = false,
  orderNumber,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const statusConfig = getStatusConfig(record.treatmentStatus);
  const isUpcoming = isUpcomingAppointment(record.appointmentDate);
  const userInfo = useUserInfo();

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onToggleDelete(record.treatmentRecordID);
    setShowDeleteDialog(false);
  };

  const rowClassName = `
    hover:bg-gray-50 transition-colors duration-200
    ${record.isDeleted ? "opacity-50 bg-gray-50" : ""}
    ${isUpcoming ? "border-l-4 border-l-blue-500" : ""}
  `;

  return (
    <TooltipProvider>
      <>
        <tr className={rowClassName}>
          {/* Số thứ tự */}
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                {orderNumber}
              </span>
            </div>
          </td>

          {/* Appointment Date & Time */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Calendar className={`h-5 w-5 ${isUpcoming ? "text-blue-500" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formatDateOnly(record.appointmentDate)}
                </p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {record.appointmentTime}
                </p>
                {isUpcoming && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Sắp tới
                  </Badge>
                )}
              </div>
            </div>
          </td>

          {/* Tooth Position & Quantity */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold mb-1">
                {record.toothPosition}
              </div>
              <p className="text-xs text-gray-600">
                SL: {record.quantity}
              </p>
            </div>
          </td>

          {/* Procedure */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div>
              <p className="font-medium text-gray-900 mb-1">
                {record.procedureName}
              </p>
              {record.unitPrice && (
                <p className="text-xs text-gray-500">
                  Đơn giá: {formatCurrency(record.unitPrice)}
                </p>
              )}
            </div>
          </td>

          {/* Dentist */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                {record.dentistName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {record.dentistName}
                </p>
              </div>
            </div>
          </td>

          {/* Diagnosis & Symptoms */}
          <td className="px-6 py-4 max-w-xs">
            <div className="space-y-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-gray-900 truncate cursor-help font-medium">
                    {record.diagnosis}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{record.diagnosis}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-gray-600 truncate cursor-help">
                    {record.symptoms}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{record.symptoms}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </td>

          {/* Amount Details */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-right">
              <p className="font-bold text-lg text-gray-900">
                {formatCurrency(record.totalAmount)}
              </p>
              {((record.discountAmount ?? 0) > 0 || (record.discountPercentage ?? 0) > 0) && (
                <div className="text-xs text-green-600 mt-1">
                  {(record.discountAmount ?? 0) > 0 && (
                    <span>-{formatCurrency(record.discountAmount ?? 0)}</span>
                  )}
                  {(record.discountPercentage ?? 0) > 0 && (
                    <span className="ml-1">({record.discountPercentage}%)</span>
                  )}
                </div>
              )}
            </div>
          </td>

          <td className="px-6 py-4 whitespace-nowrap">
            <div className="space-y-1">
              <p className="text-sm text-gray-900 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateOnly(record.treatmentDate)}
              </p>
              {record.consultantEmployeeID && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  TV: {record.consultantEmployeeID}
                </p>
              )}
            </div>
          </td>

          {/* Status */}
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${statusConfig.color} border`}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              {record.isDeleted && (
                <Badge variant="secondary" className="text-xs">
                  Đã xoá
                </Badge>
              )}
            </div>
          </td>

          {/* Actions - Sticky Column */}
          <td className="sticky right-0 px-6 py-4 whitespace-nowrap text-right bg-white border-l border-gray-200 shadow-[-4px_0_8px_rgba(0,0,0,0.1)] z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                {/* Xem chi tiết - Available for all users */}
                <DropdownMenuItem onClick={() => onViewDetail(record)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {!readonly && userInfo.role === "Dentist" && (
                  <DropdownMenuItem onClick={() => onEdit(record)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Sửa thông tin
                  </DropdownMenuItem>
                )}

                {!readonly && userInfo.role === "Dentist" && <DropdownMenuSeparator />}

                {userInfo.role === "Receptionist" && (
                  <DropdownMenuItem
                    onClick={() => onOpenInvoiceModal(patientId, record.treatmentRecordID)}
                    className="text-green-600"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Tạo hóa đơn
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem asChild>
                  <Link
                    to={`/patient/view-treatment-progress/${record.treatmentRecordID}?patientId=${patientId}&dentistId=${record.dentistID}`}
                    className="flex items-center"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Tiến độ điều trị
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    to={useUserInfo().role === "Patient" ? `/patient/treatment-records/${record.treatmentRecordID}/images` : `/patient/${patientId}/treatment-records/${record.treatmentRecordID}/images`}
                    className="flex items-center"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Hình ảnh răng
                  </Link>
                </DropdownMenuItem>

                {!readonly && <DropdownMenuSeparator />}
                
                {!readonly && (
                  <DropdownMenuItem
                    onClick={handleDeleteClick}
                    className={record.isDeleted ? "text-blue-600" : "text-red-600"}
                  >
                    {record.isDeleted ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Khôi phục
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xoá
                      </>
                    )}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </td>
        </tr>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                {record.isDeleted ? "Khôi phục hồ sơ điều trị" : "Xóa hồ sơ điều trị"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {record.isDeleted ? (
                  <>
                    Bạn có chắc chắn muốn khôi phục hồ sơ điều trị này không?
                    <br />
                    <strong>Thủ thuật:</strong> {record.procedureName}
                    <br />
                    <strong>Ngày điều trị:</strong> {formatDateOnly(record.treatmentDate)}
                  </>
                ) : (
                  <>
                    Bạn có chắc chắn muốn xóa hồ sơ điều trị này không? Hành động này có thể được hoàn tác.
                    <br />
                    <strong>Thủ thuật:</strong> {record.procedureName}
                    <br />
                    <strong>Ngày điều trị:</strong> {formatDateOnly(record.treatmentDate)}
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className={record.isDeleted ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}
              >
                {record.isDeleted ? "Khôi phục" : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </TooltipProvider>
  );
};

export default RecordRow;