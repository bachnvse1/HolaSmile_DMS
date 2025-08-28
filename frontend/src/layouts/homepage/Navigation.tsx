import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useGuestProcedures } from '@/hooks/useGuestProcedures';

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileServicesOpen, setIsMobileServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement | null>(null);
  const { data: procedures = [], isLoading: proceduresLoading } = useGuestProcedures();
  const [isDesktop, setIsDesktop] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  const handleNavClick = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);

    if (location.pathname !== '/') {
      navigate(`/${hash}`);
    } else {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        setTimeout(() => {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setIsServicesOpen(false);
      }
      // close mobile services when clicking outside mobile menu
      if (isMobileServicesOpen) {
        const mobileContainer = document.querySelector('.mobile-services-container');
        if (mobileContainer && !mobileContainer.contains(e.target as Node)) {
          setIsMobileServicesOpen(false);
        }
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [isMobileServicesOpen]);

  // watch viewport breakpoint for desktop vs mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (ev: MediaQueryListEvent) => setIsDesktop(ev.matches);
    setIsDesktop(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler as unknown as EventListener);
    };
  }, []);

  // hover open with slight debounce using ref
  const hoverTimerRef = useRef<number | null>(null);
  const openServicesOnHover = (open: boolean) => {
    // only use hover behavior on desktop breakpoints
    if (!isDesktop) return;
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    if (open) {
      hoverTimerRef.current = window.setTimeout(() => setIsServicesOpen(true), 100) as unknown as number;
    } else {
      hoverTimerRef.current = window.setTimeout(() => setIsServicesOpen(false), 150) as unknown as number;
    }
  };

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        if (window.innerWidth <= 768) {
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
            setIsServicesOpen(false); 
            setIsMobileServicesOpen(false);
          } else {
            setIsVisible(true);
          }
        } else {
          setIsVisible(true);
        }
        
        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      window.addEventListener('resize', controlNavbar); 
      return () => {
        window.removeEventListener('scroll', controlNavbar);
        window.removeEventListener('resize', controlNavbar);
      };
    }
  }, [lastScrollY]);



  return (
    <nav className={`bg-white shadow-lg fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <button onClick={handleNavClick('#home')} className="flex items-center">
              <img
                src="/logo.png"
                alt="HolaSmile Logo"
                className="h-14 w-14"
              />
              <div className="flex flex-col items-start leading-none">
                <span className="text-md font-medium text-gray-700 mt-1">NHA KHOA</span>
                <span className="text-xl font-bold text-blue-600 -mt-1">HolaSmile</span>
              </div>
            </button>
          </div>

          <div className="hidden lg:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button onClick={handleNavClick('#home')} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium">
                Trang Chủ
              </button>
              <div
                className="relative"
                ref={servicesRef}
                onMouseEnter={() => openServicesOnHover(true)}
                onMouseLeave={() => openServicesOnHover(false)}
              >
                <button onClick={() => setIsServicesOpen(!isServicesOpen)} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium flex items-center">
                  Dịch Vụ
                </button>
                {isServicesOpen && (
                  <div className="absolute left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-400 p-3 z-50 transform transition-all duration-150 ease-out">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">Thủ thuật</div>
                        <div className="text-xs text-gray-500">Chọn thủ thuật để xem chi tiết hoặc đặt lịch</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <input
                        placeholder="Tìm thủ thuật..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                        onChange={() => { /* simple visual only for now */ }}
                      />
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                      {proceduresLoading ? (
                        <div className="text-sm text-gray-500 p-3">Đang tải...</div>
                      ) : procedures.length === 0 ? (
                        <div className="text-sm text-gray-500 p-3">Không có thủ thuật</div>
                      ) : (
                        procedures.slice(0, 10).map(p => (
                          <button
                            key={p.procedureId}
                            onClick={() => { setIsServicesOpen(false); navigate(`/procedures/${p.procedureId}`); }}
                            className="w-full text-left flex items-center justify-between gap-4 px-3 py-3 hover:bg-gray-50 transition-colors min-w-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                                {p.procedureName ? p.procedureName.split(' ').slice(0, 2).map(s => s[0]).join('') : 'PT'}
                              </div>
                              <div className="text-sm text-gray-800 truncate max-w-[14rem]">{p.procedureName}</div>
                            </div>
                            <div className="text-sm font-medium text-green-600 flex-shrink-0 whitespace-nowrap">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price ?? 0)}</div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <button onClick={() => { setIsServicesOpen(false); navigate('/appointment-booking'); }} className="text-sm text-blue-600 hover:underline">Xem thêm thủ thuật / Đặt lịch</button>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={handleNavClick('#about')} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium">
                Về Chúng Tôi
              </button>
              <button onClick={handleNavClick('#team')} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium">
                Đội Ngũ
              </button>
              <button onClick={handleNavClick('#contact')} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium">
                Liên Hệ
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-white hover:bg-blue-600 border border-gray-300 rounded-lg transition"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => navigate('/appointment-booking')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Đặt lịch hẹn
            </button>
          </div>

          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t overflow-visible">
            <button onClick={handleNavClick('#home')} className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
              Trang Chủ
            </button>
            <div className="relative">
              <button
                onClick={() => setIsMobileServicesOpen(!isMobileServicesOpen)}
                className="flex justify-between items-center w-full text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
              >
                <span>Dịch Vụ</span>
                <span>{isMobileServicesOpen ? '▲' : '▼'}</span>
              </button>

              {isMobileServicesOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/40 z-40"
                    onClick={() => setIsMobileServicesOpen(false)}
                  />

                  {/* Bottom sheet */}
                  <div className="fixed left-0 right-0 bottom-0 z-50">
                    <div
                      className="mx-0 rounded-t-2xl bg-white shadow-2xl p-4 h-[60vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">Thủ thuật</div>
                          <div className="text-xs text-gray-500">Chọn thủ thuật để xem chi tiết hoặc đặt lịch</div>
                        </div>
                        <button
                          onClick={() => setIsMobileServicesOpen(false)}
                          className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 -mt-1"
                        >
                          Đóng
                        </button>
                      </div>

                      <div className="mb-3">
                        <div className="relative">
                          <input
                            placeholder="Tìm thủ thuật..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                            onChange={() => { /* visual only */ }}
                          />
                        </div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {proceduresLoading ? (
                          <div className="text-sm text-gray-500 p-3">Đang tải...</div>
                        ) : procedures.length === 0 ? (
                          <div className="text-sm text-gray-500 p-3">Không có thủ thuật</div>
                        ) : (
                          procedures.map(p => (
                            <button
                              key={p.procedureId}
                              onClick={() => { setIsMenuOpen(false); setIsMobileServicesOpen(false); navigate(`/procedures/${p.procedureId}`); }}
                              className="w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                            >
                              <span className="text-sm text-gray-800 truncate">{p.procedureName}</span>
                              <span className="text-green-600 text-sm whitespace-nowrap">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price ?? 0)}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={handleNavClick('#about')} className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
              Về Chúng Tôi
            </button>
            <button onClick={handleNavClick('#team')} className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
              Đội Ngũ
            </button>
            <button onClick={handleNavClick('#contact')} className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
              Liên Hệ
            </button>

            {/* Mobile Action Buttons */}
            <div className="pt-4 space-y-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-white hover:bg-blue-600 border border-gray-300 rounded-lg transition"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate('/appointment-booking')}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Đặt lịch hẹn
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
