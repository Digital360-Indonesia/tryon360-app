import React from 'react';
import './Features.css';

const Features = ({ language = 'en' }) => {
  const translations = {
    en: {
      heading: 'The Powerful Features for Your Designs',
      card1Title: 'Model Poses',
      card1Description: 'Choose from multiple professional poses to showcase your apparel exactly how you envision it.',
      card2Title: 'Perfect Details',
      card2Description: 'Add screen prints, embroidered logos, or custom graphics directly to your virtual mockup.',
      card3Title: 'Smart Add-Ons',
      card3Description: 'Enhance your mockup with accessories through text prompt, bring your complete vision to life instantly.'
    },
    id: {
      heading: 'Fitur Canggih untuk Desain Anda',
      card1Title: 'Pose Model',
      card1Description: 'Pilih dari berbagai pose profesional untuk memamerkan pakaian Anda sesuai keinginan.',
      card2Title: 'Detail Sempurna',
      card2Description: 'Tambahkan sablon, logo bordir, atau grafis kustom langsung ke mockup virtual Anda.',
      card3Title: 'Add-On Cerdas',
      card3Description: 'Tingkatkan mockup Anda dengan aksesori melalui perintah teks, wujudkan visi lengkap Anda secara instan.'
    }
  };

  const t = translations[language] || translations.en;

  return (
    <section className="features-section" id="features">
      <div className="features-container">
        {/* Section Header */}
        <div className="section-header">
          <h2>{t.heading}</h2>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {/* Feature Card 1: Model Poses */}
          <article className="feature-card">
            <h3 className="feature-card-title">{t.card1Title}</h3>
            <p className="feature-card-description">{t.card1Description}</p>
            <div className="feature-image">
              <img src="/assets/landing/features/section2-card1.png" alt="Model poses feature illustration" />
            </div>
          </article>

          {/* Feature Card 2: Perfect Details */}
          <article className="feature-card">
            <h3 className="feature-card-title">{t.card2Title}</h3>
            <p className="feature-card-description">{t.card2Description}</p>
            <div className="feature-image">
              <img src="/assets/landing/features/section2-card2.png" alt="Print and embroidery feature illustration" />
            </div>
          </article>

          {/* Feature Card 3: Smart Add-Ons */}
          <article className="feature-card">
            <h3 className="feature-card-title">{t.card3Title}</h3>
            <p className="feature-card-description">{t.card3Description}</p>
            <div className="feature-image">
              <img src="/assets/landing/features/section2-card3.png" alt="Smart add-ons feature illustration" />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

export default Features;
