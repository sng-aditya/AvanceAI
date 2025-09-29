import React, { useEffect } from 'react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Testimonials from '../components/landing/Testimonials';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import PageContainer from '../components/common/PageContainer';

const LandingPage: React.FC = () => {
  // Update page title
  useEffect(() => {
    document.title = 'InvestAI - Next-Gen Trading Platform';
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        <Hero />
        <PageContainer wide className="space-y-24 md:space-y-32 py-16">
          <Features />
          <Testimonials />
          <CTA />
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;