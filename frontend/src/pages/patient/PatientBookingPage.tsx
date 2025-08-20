import { useAuth } from '../../hooks/useAuth';
import { AuthGuard } from '../../components/AuthGuard';
import { PatientLayout } from '../../layouts/patient/PatientLayout';
import { DentistScheduleViewer } from '../../components/appointment/DentistScheduleViewer';
import { TokenUtils } from '../../utils/tokenUtils';
import { useUserProfile } from '../../hooks/useUserProfile';

export const PatientBookingPage = () => {
  const { fullName } = useAuth();
  
  const { data: userProfile, isLoading, error } = useUserProfile();

  const userData = TokenUtils.getUserData();
  const token = userData.token;
  const userInfo = token ? TokenUtils.decodeToken(token) : null;  
  const prefilledData = {
    fullName: fullName || userProfile?.fullname || '',
    email: userProfile?.email || '', 
    phoneNumber: userInfo?.username || userProfile?.phone || '',
    medicalIssue: ''
  };
  if (isLoading) {
    return (
      <AuthGuard requiredRoles={['Patient']}>
        <PatientLayout>
          <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Đang tải thông tin người dùng...</p>
                </div>
              </div>
            </div>
          </div>
        </PatientLayout>
      </AuthGuard>
    );
  }

  if (error) {
    console.error('User profile fetch error:', error);
  }

  return (
    <AuthGuard requiredRoles={['Patient']}>
      <PatientLayout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Đặt Lịch Hẹn Khám
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Chào {fullName}, chọn bác sĩ và thời gian phù hợp để đặt lịch hẹn
              </p>
            </div>            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Error Banner */}
              {error && (
                <div className="lg:col-span-3 mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Không thể tải thông tin email
                        </h3>
                        <p className="mt-1 text-sm text-yellow-700">
                          Hệ thống không thể tải email của bạn. Bạn có thể tiếp tục đặt lịch nhưng sẽ cần điền email thủ công.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className="lg:col-span-2">
                <DentistScheduleViewer 
                  mode="book"
                  prefilledData={prefilledData}
                />
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Thông Tin Của Bạn
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Họ tên:</span>
                      <p className="font-semibold">{prefilledData.fullName}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="font-semibold">{prefilledData.email || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Số điện thoại:</span>
                      <p className="font-semibold">{prefilledData.phoneNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    Lưu Ý Đặt Lịch
                  </h3>
                  <ul className="text-blue-700 space-y-2 text-sm">
                    <li>• Thông tin của bạn đã được tự động điền</li>
                    <li>• Chỉ cần chọn bác sĩ và thời gian</li>
                    <li>• Lịch hẹn sẽ được xác nhận sau 15 phút</li>
                    <li>• Bạn có thể hủy/đổi lịch trước 2 giờ</li>
                  </ul>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Liên Hệ Hỗ Trợ
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Hotline:</span>
                      <p className="font-semibold text-blue-600">0333-538-991</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="font-semibold">support@holasmile.com</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Giờ hỗ trợ:</span>
                      <p className="font-semibold">8:00 - 22:00 hàng ngày</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PatientLayout>
    </AuthGuard>
  );
};