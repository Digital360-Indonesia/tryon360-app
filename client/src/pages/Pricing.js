import React, { useState, useEffect } from 'react';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import './Pricing.css';

const Pricing = ({ language: propLanguage = 'en' }) => {
  const [language, setLanguage] = useState(propLanguage);
  const [activePlanType, setActivePlanType] = useState('use');

  useEffect(() => {
    // Get saved language or use prop
    const savedLang = localStorage.getItem('lang');
    const lang = (savedLang === 'en' || savedLang === 'id') ? savedLang : propLanguage;
    setLanguage(lang);
  }, [propLanguage]);

  const translations = {
    en: {
      chooseYourPlan: 'Choose Your Plan',
      pricingTitle: 'Create More, Spend Less',
      pricingSubtitle: 'Launch with our free plan to explore AI-powered mockups, or unlock unlimited possibilities with custom Enterprise solutions tailored to your workflow.',
      tierFree: 'Free',
      priceFree: '$0/month',
      taglineFree: 'Perfect for getting started',
      ctaFree: 'Sign Up',
      tierEnterprise: 'Enterprise',
      priceEnterprise: 'Custom',
      taglineEnterprise: 'For businesses & agencies',
      ctaEnterprise: 'Book a Demo',
      feature1: '3 try-ons per month',
      feature2: '3 AI models',
      feature3: '720p quality export',
      feature4: 'Watermarked results',
      feature5: 'Unlimited try-ons',
      feature6: 'All AI models + custom',
      feature7: '4K quality export',
      feature8: 'No watermark',
      usePlan: 'Use',
      subscriptionPlan: 'Subscription'
    },
    id: {
      chooseYourPlan: 'Pilih Paket Anda',
      pricingTitle: 'Buat Lebih Banyak, Hemat Lebih Banyak',
      pricingSubtitle: 'Mulai dengan paket gratis kami untuk menjelajahi mockup bertenaga AI, atau buka kemungkinan tak terbatas dengan solusi Enterprise kustom yang disesuaikan dengan alur kerja Anda.',
      tierFree: 'Gratis',
      priceFree: '$0/bulan',
      taglineFree: 'Sempurna untuk memulai',
      ctaFree: 'Daftar',
      tierEnterprise: 'Enterprise',
      priceEnterprise: 'Kustom',
      taglineEnterprise: 'Untuk bisnis & agensi',
      ctaEnterprise: 'Pesan Demo',
      feature1: '3 TryOn per bulan',
      feature2: '3 model AI',
      feature3: 'Ekspor kualitas 720p',
      feature4: 'Hasil dengan watermark',
      feature5: 'TryOn tidak terbatas',
      feature6: 'Semua model AI + kustom',
      feature7: 'Ekspor kualitas 4K',
      feature8: 'Tanpa watermark',
      usePlan: 'Pakai',
      subscriptionPlan: 'Berlangganan'
    }
  };

  const t = translations[language] || translations.en;

  const handlePlanTypeChange = (planType) => {
    setActivePlanType(planType);
  };

  return (
    <div className="pricing-page-wrapper">
      <Header />

      <main className="pricing-page">
        <div className="pricing-container">
          {/* Section Header */}
          <div className="pricing-header">
            <p className="pricing-section-label">{t.chooseYourPlan}</p>
            <h1 className="pricing-title">{t.pricingTitle}</h1>
            <p className="pricing-subtitle">{t.pricingSubtitle}</p>
          </div>

          {/* Plan Type Selector */}
          <div className="plan-type-selector">
            <button
              className={`plan-type-btn ${activePlanType === 'use' ? 'active' : ''}`}
              onClick={() => handlePlanTypeChange('use')}
            >
              {t.usePlan}
            </button>
            <button
              className={`plan-type-btn ${activePlanType === 'subscription' ? 'active' : ''}`}
              onClick={() => handlePlanTypeChange('subscription')}
            >
              {t.subscriptionPlan}
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="pricing-grid">
            {/* Free Tier */}
            <div className="pricing-card">
              <div className="pricing-card-header">
                <div className="pricing-tier">{t.tierFree}</div>
                <div className="pricing-price">{t.priceFree}</div>
                <p className="pricing-tagline">{t.taglineFree}</p>
              </div>
              <a href="https://garment-tryon-app.digital360.id/" className="pricing-cta primary">
                {t.ctaFree}
              </a>
              <ul className="pricing-features">
                <li className="pricing-feature">
                  <svg className="pricing-feature-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{t.feature1}</span>
                </li>
                <li className="pricing-feature">
                  <svg className="pricing-feature-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{t.feature2}</span>
                </li>
                <li className="pricing-feature">
                  <svg className="pricing-feature-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{t.feature3}</span>
                </li>
                <li className="pricing-feature">
                  <svg className="pricing-feature-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{t.feature4}</span>
                </li>
              </ul>
            </div>

            {/* Enterprise Tier */}
            <div className="pricing-card enterprise">
              <div className="pricing-card-header">
                <div className="pricing-tier">{t.tierEnterprise}</div>
                <div className="pricing-price">{t.priceEnterprise}</div>
                <p className="pricing-tagline">{t.taglineEnterprise}</p>
              </div>
              <a
                href="https://wa.me/6285706679500?text=Hi%20Digital360%2C%20I%27d%20like%20to%20book%20a%20demo%20for%20TryOn360%20Enterprise%20plan"
                className="pricing-cta secondary"
                target="_blank"
                rel="noreferrer"
              >
                {t.ctaEnterprise}
              </a>
              <ul className="pricing-features">
                <li className="pricing-feature">
                  <svg className="pricing-feature-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{t.feature5}</span>
                </li>
                <li className="pricing-feature">
                  <svg className="pricing-feature-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{t.feature6}</span>
                </li>
                <li className="pricing-feature">
                  <svg className="pricing-feature-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{t.feature7}</span>
                </li>
                <li className="pricing-feature">
                  <svg className="pricing-feature-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span>{t.feature8}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
};

export default Pricing;
