import React, { useState, useEffect } from 'react';
import './Hero.css';

const Hero = ({ language = 'en' }) => {
  const [apparelIndex, setApparelIndex] = useState(0);

  const apparelTypes = [
    {
      key: 'dress',
      icon: '/assets/landing/icon/dress.png',
      alt: 'Dress'
    },
    {
      key: 'tshirt',
      icon: '/assets/landing/icon/tshirt.png',
      alt: 'T-Shirt'
    },
    {
      key: 'shirt',
      icon: '/assets/landing/icon/shirt.png',
      alt: 'Shirt'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setApparelIndex((prevIndex) => (prevIndex + 1) % apparelTypes.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [apparelTypes.length]);

  const translations = {
    en: {
      heading: 'Virtual Try-On',
      subheading: 'and AI-powered at',
      brandName: 'TryOn360',
      card1Title: 'Virtual Try-On',
      card2Title: 'View Samples',
      card3Title: 'How it Works',
      aiTitle: 'Try for Free',
      aiDescription: 'Create photorealistic try-on with AI.\nUpload your design, choose a pose, and get professional results in under 60 seconds.',
      buttonGenerate: 'Generate',
      buttonExplore: 'Explore more'
    },
    id: {
      heading: 'Virtual TryOn',
      subheading: 'dan AI-powered di',
      brandName: 'TryOn360',
      card1Title: 'Virtual TryOn',
      card2Title: 'Lihat Contoh',
      card3Title: 'Cara Kerja',
      aiTitle: 'Coba Gratis',
      aiDescription: 'Buat try-on fotorealistik dengan AI.\nUnggah desain Anda, pilih pose, dan dapatkan hasil profesional dalam waktu kurang dari 60 detik.',
      buttonGenerate: 'Generate',
      buttonExplore: 'Jelajahi lebih'
    }
  };

  const t = translations[language] || translations.en;

  const currentApparel = apparelTypes[apparelIndex];

  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Headline */}
        <div className="hero-headline">
          <h1>
            <span>{t.heading}</span>
            <span className="apparel-cycle">
              <img
                src={currentApparel.icon}
                alt={currentApparel.alt}
                className="apparel-icon"
              />
              <span className="apparel-name">{t[`apparel${currentApparel.key.charAt(0).toUpperCase() + currentApparel.key.slice(1)}`] || currentApparel.alt}</span>
            </span>
          </h1>
          <p className="subheadline">
            <span>{t.subheading}</span> <span className="brand-name">{t.brandName}</span>
          </p>
        </div>

        {/* Cards */}
        <div className="hero-cards-grid">
          <a href="https://garment-tryon-app.digital360.id/" target="_blank" rel="noopener noreferrer" className="hero-card color-1">
            <div className="hero-card-header">
              <h2 className="hero-card-title">{t.card1Title}</h2>
              <div className="hero-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            <div className="hero-card-image">
              <img src="/assets/landing/hero/hero-banner1.png" alt={t.card1Title} />
            </div>
          </a>

          <a href="#samples" className="hero-card color-2">
            <div className="hero-card-header">
              <h2 className="hero-card-title">{t.card2Title}</h2>
              <div className="hero-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            <div className="hero-card-image">
              <img src="/assets/landing/hero/hero-banner2.png" alt={t.card2Title} />
            </div>
          </a>

          <a href="#tutorial" className="hero-card color-3">
            <div className="hero-card-header">
              <h2 className="hero-card-title">{t.card3Title}</h2>
              <div className="hero-card-arrow">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            <div className="hero-card-image">
              <img src="/assets/landing/hero/hero-banner3.png" alt={t.card3Title} />
            </div>
          </a>
        </div>

        {/* AI Section */}
        <div className="hero-ai-section">
          <div className="hero-card-image">
            <img src="/assets/landing/hero/hero-banner4.png" alt="AI Generated Visual" />
          </div>
          <div className="hero-ai-content">
            <a href="https://garment-tryon-app.digital360.id/" target="_blank" rel="noopener noreferrer" className="hero-ai-title">
              {t.aiTitle}
            </a>
            <p className="hero-ai-description">
              {t.aiDescription.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < t.aiDescription.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
            <div className="hero-ai-buttons">
              <a href="https://garment-tryon-app.digital360.id/" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                {t.buttonGenerate}
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <button className="btn btn-secondary">{t.buttonExplore}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
