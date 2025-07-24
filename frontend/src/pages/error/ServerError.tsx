import React from 'react';
import { useNavigate } from 'react-router';
import { Home, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export const ServerError: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* 500 Number */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-red-600 mb-4">500</h1>
            <div className="w-24 h-1 bg-red-600 mx-auto rounded-full"></div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Lỗi máy chủ
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Xin lỗi, đã xảy ra lỗi không mong muốn từ phía máy chủ.
            </p>
            <p className="text-gray-500">
              Chúng tôi đang nỗ lực khắc phục sự cố này. Vui lòng thử lại sau ít phút.
            </p>
          </div>

          {/* Error Code */}
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Mã lỗi:</strong> INTERNAL_SERVER_ERROR
              </p>
              <p className="text-xs text-red-600 mt-1">
                Thời gian: {new Date().toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
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
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Về trang chủ
            </Button>
          </div>

          {/* Additional Help */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Nếu sự cố vẫn tiếp diễn, vui lòng liên hệ với bộ phận hỗ trợ kỹ thuật:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a 
                href="tel:+84123456789" 
                className="text-red-600 hover:text-red-800 font-medium"
              >
                📞 Hotline: +84 123 456 789
              </a>
              <a 
                href="mailto:tech@holasmile.com" 
                className="text-red-600 hover:text-red-800 font-medium"
              >
                ✉️ tech@holasmile.com
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServerError;