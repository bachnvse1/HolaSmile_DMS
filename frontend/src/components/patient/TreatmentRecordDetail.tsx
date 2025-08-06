import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Calendar,
    Clock,
    User,
    Stethoscope,
    FileText,
    UserCheck,
    Activity,
    Percent,
    Hash,
    AlertCircle,
} from "lucide-react";
import type { TreatmentRecord } from "@/types/treatment";
import { formatCurrency } from "@/utils/currencyUtils";
import { formatDateOnly } from "@/utils/date";

interface TreatmentRecordDetailProps {
    isOpen: boolean;
    onClose: () => void;
    record: TreatmentRecord | null;
}

// Status configuration
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

const TreatmentRecordDetail: React.FC<TreatmentRecordDetailProps> = ({
    isOpen,
    onClose,
    record,
}) => {
    if (!record) return null;

    const statusConfig = getStatusConfig(record.treatmentStatus);

    // Calculate total discount
    const discountAmount = (record.discountAmount || 0);
    const discountPercentage = (record.discountPercentage || 0);
    const hasDiscount = discountAmount > 0 || discountPercentage > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Chi tiết hồ sơ điều trị
                    </DialogTitle>
                    <DialogDescription>
                        Thông tin chi tiết về buổi điều trị #{record.treatmentRecordID}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status and Basic Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    Thông tin cơ bản
                                </span>
                                <Badge
                                    variant="outline"
                                    className={`${statusConfig.color} border text-sm`}
                                >
                                    {statusConfig.label}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Appointment Info */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <Label className="text-sm font-medium">Ngày hẹn</Label>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {formatDateOnly(record.appointmentDate)}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Clock className="h-3 w-3" />
                                        {record.appointmentTime}
                                    </div>
                                </div>

                                {/* Treatment Date */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                        <Label className="text-sm font-medium">Ngày điều trị</Label>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {formatDateOnly(record.treatmentDate)}
                                    </div>
                                </div>

                                {/* Record ID */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-gray-500" />
                                        <Label className="text-sm font-medium">Mã hồ sơ</Label>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        #{record.treatmentRecordID}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dentist and Procedure Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dentist Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />
                                    Bác sĩ điều trị
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-medium">
                                        {record.dentistName?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-lg text-gray-900">
                                            {record.dentistName || "Không xác định"}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Procedure Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-blue-600" />
                                    Thủ thuật
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="font-semibold text-lg text-gray-900">
                                        {record.procedureName || "Không xác định"}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        ID thủ thuật: {record.procedureID}
                                    </div>
                                    {record.unitPrice && (
                                        <div className="text-sm text-gray-600">
                                            Đơn giá: {formatCurrency(record.unitPrice)}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tooth Position and Quantity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Thông tin răng
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-800 font-bold text-xl mb-2">
                                        {record.toothPosition}
                                    </div>
                                    <div className="text-sm text-gray-600">Vị trí răng</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 mb-2">
                                        {record.quantity}
                                    </div>
                                    <div className="text-sm text-gray-600">Số lượng</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Clinical Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Symptoms */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    Triệu chứng
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-gray-900 whitespace-pre-wrap">
                                    {record.symptoms || "Không có thông tin"}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Diagnosis */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-blue-600" />
                                    Chẩn đoán
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-gray-900 whitespace-pre-wrap">
                                    {record.diagnosis || "Không có thông tin"}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Financial Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Thông tin tài chính
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Đơn giá:</span>
                                    <span className="font-semibold">
                                        {record.unitPrice ? formatCurrency(record.unitPrice) : "N/A"}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Số lượng:</span>
                                    <span className="font-semibold">{record.quantity}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Tạm tính:</span>
                                    <span className="font-semibold">
                                        {record.unitPrice
                                            ? formatCurrency(record.unitPrice * record.quantity)
                                            : "N/A"}
                                    </span>
                                </div>

                                {hasDiscount && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-green-700">Giảm giá:</div>
                                            {discountAmount > 0 && (
                                                <div className="flex justify-between items-center text-green-600">
                                                    <span className="text-sm">Giảm tiền:</span>
                                                    <span className="font-semibold">
                                                        -{formatCurrency(discountAmount)}
                                                    </span>
                                                </div>
                                            )}
                                            {discountPercentage > 0 && (
                                                <div className="flex justify-between items-center text-green-600">
                                                    <span className="text-sm flex items-center gap-1">
                                                        <Percent className="h-3 w-3" />
                                                        Giảm phần trăm:
                                                    </span>
                                                    <span className="font-semibold">{discountPercentage}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <Separator />
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-semibold text-gray-900">Tổng cộng:</span>
                                    <span className="font-bold text-xl text-blue-600">
                                        {formatCurrency(record.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Information */}
                    {record.consultantEmployeeID && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-blue-600" />
                                    Thông tin bổ sung
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Nhân viên tư vấn:</span>
                                        <span className="font-semibold">
                                            ID: {record.consultantEmployeeID}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Mã cuộc hẹn:</span>
                                        <span className="font-semibold">
                                            #{record.appointmentID}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Deletion Status */}
                    {record.isDeleted && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-red-700">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="font-medium">
                                        Hồ sơ này đã bị xóa tạm thời
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TreatmentRecordDetail;