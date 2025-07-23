import React from 'react';
import { useNavigate } from 'react-router';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Trang không tồn tại
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
            </p>
            <p className="text-gray-500">
              Trang có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
            </p>
          </div>

          {/* Suggestions */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <Search className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800">Kiểm tra URL</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
                <Home className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800">Về trang chủ</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-purple-50 rounded-lg">
                <HelpCircle className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-purple-800">Liên hệ hỗ trợ</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Home className="h-4 w-4" />
              Về trang chủ
            </Button>
          </div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Cần hỗ trợ? Liên hệ với chúng tôi:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a 
                href="tel:+84123456789" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                📞 +84 123 456 789
              </a>
              <a 
                href="mailto:support@holasmile.com" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ✉️ support@holasmile.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;