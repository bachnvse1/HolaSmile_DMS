import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import axiosInstance from '@/lib/axios';

interface CanvasCaptchaProps {
  value: string;
  onChange: (value: string) => void;
  onCaptchaValueChange: (captchaValue: string) => void;
  className?: string;
  error?: string;
}

export const CanvasCaptcha: React.FC<CanvasCaptchaProps> = ({
  value,
  onChange,
  onCaptchaValueChange,
  className = '',
  error
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCaptcha = async () => {
    setIsGenerating(true);
    onChange(''); // Clear input when refreshing
    try {
      const response = await axiosInstance.post('/appointment/create-captcha');
      let newCaptcha = response.data;
      
      // Handle different response formats
      if (typeof newCaptcha === 'object' && newCaptcha !== null) {
        // If response is wrapped in an object
        newCaptcha = newCaptcha.captcha || newCaptcha.value || newCaptcha.code || '';
      }
      
      // Convert number to string if needed
      if (typeof newCaptcha === 'number') {
        newCaptcha = newCaptcha.toString();
      }
      
      // Ensure captcha is a valid string
      if (typeof newCaptcha === 'string' && newCaptcha.length > 0) {
        onCaptchaValueChange(newCaptcha);
        drawCaptcha(newCaptcha);
      } else {
        throw new Error(`Invalid captcha format: ${typeof newCaptcha}`);
      }
    } catch (error) {
      console.error('Failed to generate captcha:', error);
      // Fallback to client-side generation if API fails
      const fallbackCaptcha = Math.random().toString(36).substring(2, 8).toUpperCase();
      onCaptchaValueChange(fallbackCaptcha);
      drawCaptcha(fallbackCaptcha);
    } finally {
      setIsGenerating(false);
    }
  };

  const drawCaptcha = useCallback((text: string) => {
    // Add delay to ensure canvas is mounted
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas || !text) {
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      // Set canvas size
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 200 * dpr;
      canvas.height = 80 * dpr;
      canvas.style.width = '200px';
      canvas.style.height = '80px';
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, 200, 80);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 200, 80);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(0.5, '#e2e8f0');
      gradient.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 80);

      // Add noise dots
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, 0.3)`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * 200,
          Math.random() * 80,
          Math.random() * 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Add interference lines
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.4)`;
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 200, Math.random() * 80);
        ctx.lineTo(Math.random() * 200, Math.random() * 80);
        ctx.stroke();
      }

      // Draw text
      const colors = ['#1e40af', '#dc2626', '#059669', '#7c2d12', '#4338ca', '#be123c'];
      const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New'];
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const x = 25 + i * 25;
        const y = 45 + Math.random() * 10;
        
        // Random font and size
        const fontSize = 20 + Math.random() * 10;
        const fontFamily = fonts[Math.floor(Math.random() * fonts.length)];
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        
        // Random color
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        
        // Save context for transformation
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((Math.random() - 0.5) * 0.3); // Reduced rotation
        
        // Add shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }

      // Add some curved interference lines
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.3)`;
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        
        const startX = Math.random() * 200;
        const startY = Math.random() * 80;
        const cpX = Math.random() * 200;
        const cpY = Math.random() * 80;
        const endX = Math.random() * 200;
        const endY = Math.random() * 80;
        
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.stroke();
      }
      
    }, 100); // 100ms delay to ensure canvas is mounted
  }, []);

  useEffect(() => {
    const initCaptcha = async () => {
      setIsGenerating(true);
      try {
        const response = await axiosInstance.post('/appointment/create-captcha');
        let newCaptcha = response.data;
        
        // Handle different response formats
        if (typeof newCaptcha === 'object' && newCaptcha !== null) {
          newCaptcha = newCaptcha.captcha || newCaptcha.value || newCaptcha.code || '';
        }
        
        // Convert number to string if needed
        if (typeof newCaptcha === 'number') {
          newCaptcha = newCaptcha.toString();
        }
        
        if (typeof newCaptcha === 'string' && newCaptcha.length > 0) {
          onCaptchaValueChange(newCaptcha);
          drawCaptcha(newCaptcha);
        } else {
          throw new Error(`Invalid captcha format: ${typeof newCaptcha}`);
        }
      } catch (error) {
        console.error('Failed to generate captcha:', error);
        const fallbackCaptcha = Math.random().toString(36).substring(2, 8).toUpperCase();
        onCaptchaValueChange(fallbackCaptcha);
        drawCaptcha(fallbackCaptcha);
      } finally {
        setIsGenerating(false);
      }
    };
    
    initCaptcha();
  }, [onCaptchaValueChange, drawCaptcha]);

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700">
        Mã xác minh bảo mật *
      </label>
      
      {/* Captcha Display */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 border-2 border-gray-300 rounded-lg p-4 bg-white shadow-inner">
          {isGenerating ? (
            <div className="flex items-center justify-center h-20">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 text-sm">Đang tạo mã...</span>
              </div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="block mx-auto border border-gray-200 rounded w-full max-w-[200px] h-20"
            />
          )}
        </div>
        
        <button
          type="button"
          onClick={generateCaptcha}
          disabled={isGenerating}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
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
        className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg font-mono tracking-widest uppercase shadow-sm ${
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