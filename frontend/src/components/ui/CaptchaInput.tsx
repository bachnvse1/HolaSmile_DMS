import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import axiosInstance from '@/lib/axios';

interface CaptchaInputProps {
  value: string;
  onChange: (value: string) => void;
  onCaptchaValueChange: (captchaValue: string) => void;
  className?: string;
  error?: string;
}

export const CaptchaInput: React.FC<CaptchaInputProps> = ({
  value,
  onChange,
  onCaptchaValueChange,
  className = '',
  error
}) => {
  const [captchaText, setCaptchaText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCaptcha = async () => {
    setIsGenerating(true);
    try {
      const response = await axiosInstance.post('/appointment/create-captcha');
      const newCaptcha = response.data;
      
      // Ensure captcha is a valid string
      if (typeof newCaptcha === 'string' && newCaptcha.length > 0) {
        setCaptchaText(newCaptcha);
        onCaptchaValueChange(newCaptcha);
        onChange(''); // Clear input when refreshing
      } else {
        throw new Error('Invalid captcha format');
      }
    } catch (error) {
      console.error('Failed to generate captcha:', error);
      // Fallback to client-side generation if API fails
      const fallbackCaptcha = Math.random().toString(36).substring(2, 8).toUpperCase();
      setCaptchaText(fallbackCaptcha);
      onCaptchaValueChange(fallbackCaptcha);
      onChange('');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const initCaptcha = async () => {
      setIsGenerating(true);
      try {
        const response = await axiosInstance.post('/appointment/create-captcha');
        const newCaptcha = response.data;
        
        if (typeof newCaptcha === 'string' && newCaptcha.length > 0) {
          setCaptchaText(newCaptcha);
          onCaptchaValueChange(newCaptcha);
        } else {
          throw new Error('Invalid captcha format');
        }
      } catch (error) {
        console.error('Failed to generate captcha:', error);
        const fallbackCaptcha = Math.random().toString(36).substring(2, 8).toUpperCase();
        setCaptchaText(fallbackCaptcha);
        onCaptchaValueChange(fallbackCaptcha);
      } finally {
        setIsGenerating(false);
      }
    };
    
    initCaptcha();
  }, [onCaptchaValueChange]);

  // Generate random styles for each character to make it harder to read
  const renderCaptchaChar = (char: string, index: number) => {
    const rotations = [-15, -10, -5, 0, 5, 10, 15];
    const colors = ['text-blue-600', 'text-red-600', 'text-green-600', 'text-yellow-600', 'text-purple-600', 'text-pink-600'];
    const sizes = ['text-2xl', 'text-3xl', 'text-xl'];
    
    const rotation = rotations[index % rotations.length];
    const colorClass = colors[index % colors.length];
    const sizeClass = sizes[index % sizes.length];
    
    return (
      <span
        key={index}
        className={`inline-block font-bold ${sizeClass} ${colorClass} select-none drop-shadow-sm`}
        style={{
          transform: `rotate(${rotation}deg)`,
          marginLeft: index > 0 ? '2px' : '0'
        }}
      >
        {char}
      </span>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700">
        Mã xác minh bảo mật *
      </label>
      
      {/* Captcha Display */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 border-2 border-gray-300 rounded-lg p-6 text-center relative overflow-hidden pattern-dots pattern-gray-300 pattern-bg-white pattern-size-4 pattern-opacity-20">
          {/* Background noise lines */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 left-0 w-full h-px bg-gray-400 transform rotate-12"></div>
            <div className="absolute top-6 left-0 w-full h-px bg-gray-500 transform -rotate-6"></div>
            <div className="absolute top-10 left-0 w-full h-px bg-gray-400 transform rotate-3"></div>
            <div className="absolute top-3 left-1/4 w-px h-full bg-gray-400 transform rotate-45"></div>
            <div className="absolute top-3 left-3/4 w-px h-full bg-gray-500 transform -rotate-45"></div>
          </div>
          
          {/* Captcha Text */}
          <div className="relative z-10 flex justify-center items-center space-x-1 py-2">
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Đang tạo...</span>
              </div>
            ) : captchaText && typeof captchaText === 'string' ? (
              captchaText.split('').map((char, index) => renderCaptchaChar(char, index))
            ) : (
              <span className="text-gray-500">Không thể tải captcha</span>
            )}
          </div>
        </div>
        
        <button
          type="button"
          onClick={generateCaptcha}
          disabled={isGenerating}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Tạo mã mới"
        >
          <RefreshCw className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="Nhập mã xác minh (6 ký tự)"
        maxLength={6}
        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg font-mono tracking-widest uppercase ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      />
      
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
          {error}
        </p>
      )}
      
      <p className="text-xs text-gray-500">
        Nhập chính xác 6 ký tự hiển thị trong hình để xác minh bạn không phải robot
      </p>
    </div>
  );
};