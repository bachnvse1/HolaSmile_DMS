import React from "react";
import { useSearchParams } from "react-router";
import { AuthGuard } from "../../components/AuthGuard";
import { StaffLayout } from "../../layouts/staff/StaffLayout";
import { FUAppointmentModal } from "../../components/appointment/FUAppointmentModal";
import { useUserInfo } from "@/hooks/useUserInfo";
const FUAppointmentPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const patientId = Number(searchParams.get("patientId"));
    const userInfo = useUserInfo();

    // Nếu không có patientId, báo lỗi
    if (!patientId) {
        return (
            <AuthGuard requiredRoles={["Receptionist", "Admin", "Owner"]}>
                <StaffLayout userInfo={userInfo}>
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Không tìm thấy bệnh nhân</h2>
                        <p className="text-gray-600">Vui lòng chọn bệnh nhân từ danh sách.</p>
                    </div>
                </StaffLayout>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard requiredRoles={["Receptionist", "Admin", "Owner"]}>
            <StaffLayout userInfo={userInfo}>
                <div className="max-w-3xl mx-auto ">
                    <FUAppointmentModal
                        isOpen={true}
                        onClose={() => window.history.back()}
                        patientId={patientId}
                    />
                </div>
            </StaffLayout>
        </AuthGuard>
    );
};

export default FUAppointmentPage;