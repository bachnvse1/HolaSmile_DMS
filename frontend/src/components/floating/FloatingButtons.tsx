import React from 'react';
import { Phone, Calendar } from 'lucide-react';

export const FloatingButtons: React.FC = () => {
  return (
    <>
      {/* Phone, Zalo & Appointment Buttons */}
      <div className="fixed left-2 sm:left-4 bottom-6 sm:bottom-6 z-20 flex flex-col space-y-2">
        {/* Phone Button */}
        <div className="relative group">
          <a 
            href="tel:0333538991"
            className="relative flex items-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="relative p-2 sm:p-3">
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping scale-110"></div>
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping animation-delay-1000 scale-110"></div>
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 animate-shake" />
            </div>
            <div className="hidden group-hover:block sm:block pr-3 sm:pr-4 pl-1 py-2 sm:py-3 font-semibold text-xs sm:text-sm whitespace-nowrap">
              0333538991
            </div>
          </a>
        </div>

        {/* Zalo Button */}
        <div className="relative group">
          <a 
            href="https://zalo.me/0333538991"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="relative p-2 sm:p-3">
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping scale-110"></div>
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping animation-delay-1000 scale-110"></div>
              <div className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 flex items-center justify-center bg-white text-blue-500 rounded text-xs sm:text-sm font-bold animate-pulse">
                Z
              </div>
            </div>
            <div className="hidden group-hover:block sm:block pr-3 sm:pr-4 pl-1 py-2 sm:py-3 font-semibold text-xs sm:text-sm whitespace-nowrap">
              Chat Zalo
            </div>
          </a>
        </div>

        {/* Appointment Button */}
        <div className="relative group">
          <a 
            href="/appointment-booking"
            className="relative flex items-center bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="relative p-2 sm:p-3">
              <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping scale-110"></div>
              <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping animation-delay-1000 scale-110"></div>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 animate-pulse" />
            </div>
            <div className="hidden group-hover:block sm:block pr-3 sm:pr-4 pl-1 py-2 sm:py-3 font-semibold text-xs sm:text-sm whitespace-nowrap">
              Đặt Lịch Khám
            </div>
          </a>
        </div>
      </div>

      <style>{`
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1.0s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2.0s;
        }
        
        @keyframes shake {
          0%, 100% { transform: rotate(15deg); }
          10% { transform: rotate(5deg); }
          20% { transform: rotate(25deg); }
          30% { transform: rotate(7deg); }
          40% { transform: rotate(23deg); }
          50% { transform: rotate(9deg); }
          60% { transform: rotate(21deg); }
          70% { transform: rotate(11deg); }
          80% { transform: rotate(19deg); }
          90% { transform: rotate(13deg); }
        }
        
        .animate-shake {
          animation: shake 1s infinite;
          animation-delay: 1s;
          transform-origin: center;
          transform: rotate(15deg);
        }
      `}</style>
    </>
  );
};