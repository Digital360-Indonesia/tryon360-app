import React, { useState, useEffect } from 'react';
import './Footer.css';

const Footer = ({ language = 'en' }) => {
  const [apparelIndex, setApparelIndex] = useState(0);

  const apparelTypes = [
    {
      icon: '/assets/landing/icon/dress.png',
      alt: 'Dress'
    },
    {
      icon: '/assets/landing/icon/tshirt.png',
      alt: 'T-Shirt'
    },
    {
      icon: '/assets/landing/icon/shirt.png',
      alt: 'Shirt'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setApparelIndex((prevIndex) => (prevIndex + 1) % apparelTypes.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const translations = {
    en: {
      tryNow: 'Try Now',
      company: 'Company',
      careers: 'Careers',
      contactUs: 'Contact Us',
      products: 'Products',
      dental360: 'Dental360',
      business360: 'Business360',
      website360: 'Website360',
      clinic360: 'Clinic360',
      logistic360: 'Logistic360',
      support: 'Support',
      blog: 'Blog',
      portfolio: 'Portfolio',
      partnership: 'Partnership',
      scheduleConsultation: 'Schedule Consultation'
    },
    id: {
      tryNow: 'Coba Sekarang',
      company: 'Perusahaan',
      careers: 'Karir',
      contactUs: 'Hubungi Kami',
      products: 'Produk',
      dental360: 'Dental360',
      business360: 'Business360',
      website360: 'Website360',
      clinic360: 'Clinic360',
      logistic360: 'Logistic360',
      support: 'Dukungan',
      blog: 'Blog',
      portfolio: 'Portofolio',
      partnership: 'Kemitraan',
      scheduleConsultation: 'Jadwalkan Konsultasi'
    }
  };

  const t = translations[language] || translations.en;

  const currentApparel = apparelTypes[apparelIndex];

  return (
    <section id="footer" className="footer-section">
      {/* PART 1: Footer CTA Area */}
      <div className="footer-cta">
        <div className="footer-cta-container">
          <div className="footer-cta-content">
            <h2 className="footer-cta-title">
              BRING <span className="accent-star">💫</span> YOUR DESIGNS
              <span className="footer-apparel-cycle">
                <img
                  src={currentApparel.icon}
                  alt={currentApparel.alt}
                  className="footer-apparel-icon"
                />
              </span>
              <span className="footer-cta-subtitle">TO LIFE AT <span className="accent-arrow">→</span> TRYON360!</span>
            </h2>
            <a href="#tools" className="footer-cta-button">
              {t.tryNow} <span className="button-arrow">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* PART 2: Multi-column Footer */}
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-columns">
            {/* Left Column: Company with TryOn Logo */}
            <div className="footer-column footer-column-left">
              <img src="/assets/landing/logo/tryon360-logo.png" alt="TryOn360" className="tryon-logo" />
              <h3 className="footer-column-title">{t.company}</h3>
              <ul className="footer-links">
                <li><a href="https://wa.me/6285706679500">{t.careers}</a></li>
                <li><a href="https://wa.me/6285706679500">{t.contactUs}</a></li>
              </ul>
            </div>

            {/* Center Column: Products */}
            <div className="footer-column footer-column-center">
              <h3 className="footer-column-title">{t.products}</h3>
              <ul className="footer-links">
                <li><a href="https://www.digital360.id/#dental360">{t.dental360}</a></li>
                <li><a href="https://www.digital360.id/#business360">{t.business360}</a></li>
                <li><a href="https://www.digital360.id/#website360">{t.website360}</a></li>
                <li><a href="https://www.digital360.id/#clinic360">{t.clinic360}</a></li>
                <li><a href="https://www.digital360.id/#logistic360">{t.logistic360}</a></li>
              </ul>
            </div>

            {/* Right Column: Support */}
            <div className="footer-column footer-column-right">
              <h3 className="footer-column-title">{t.support}</h3>
              <ul className="footer-links">
                <li><a href="https://digital360.id/berita/">{t.blog}</a></li>
                <li><a href="https://www.digital360.id/customer-stories">{t.portfolio}</a></li>
                <li><a href="https://www.digital360.id/#partnership">{t.partnership}</a></li>
                <li><a href="https://wa.me/6285706679500">{t.scheduleConsultation}</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;
