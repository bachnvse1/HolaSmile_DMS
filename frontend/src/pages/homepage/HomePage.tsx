import { HeroSection } from '@/components/sections/HeroSection';
import { ServicesSection } from '@/components/sections/ServicesSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { TeamSection } from '@/components/sections/TeamSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { Layout } from '@/layouts/homepage/Layout';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import ConsultantChatBox from '@/components/chat/ConsultantChatBox';

export const HomePage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);
  return (
    <Layout>
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <TeamSection />
      <ContactSection />
      <ConsultantChatBox />
      {/* Thêm ChatBox ở cuối để không ảnh hưởng đến layout */}
      {/* <ChatBox /> */}
    </Layout>
  );
};