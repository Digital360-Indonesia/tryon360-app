import React, { useState } from 'react';
import './FAQs.css';

const FAQs = ({ language = 'en' }) => {
  const [openFAQ, setOpenFAQ] = useState(1);

  const toggleFAQ = (faqNumber) => {
    setOpenFAQ(openFAQ === faqNumber ? null : faqNumber);
  };

  const translations = {
    en: {
      subtitle: 'FREQUENTLY ASKED QUESTIONS',
      title: 'FAQs',
      faq1Question: 'Do I need design experience to use TryOn360?',
      faq1Answer: 'Not at all. Our interface is built for clothing brands and designers of all skill levels. If you can upload a file and click a button, you can create professional mockups.',
      faq2Question: 'How realistic are the AI-generated models?',
      faq2Answer: 'Our AI creates photorealistic results with accurate fabric draping, lighting, and proportions. Most users can\'t distinguish our mockups from traditional photoshoots.',
      faq3Question: 'What file formats do you accept for uploads?',
      faq3Answer: 'We support PNG, JPG, and SVG files for garment designs. For best results, use transparent PNG images with high resolution.',
      faq4Question: 'How long does rendering take?',
      faq4Answer: 'Most mockups are ready in under 60 seconds. Complex designs with multiple accessories may take up to 2 minutes.',
      faq5Question: 'Can I use the images commercially?',
      faq5Answer: 'Yes! All generated mockups are royalty-free and can be used for marketing, e-commerce, presentations, or portfolios without restrictions.'
    },
    id: {
      subtitle: 'PERTANYAAN UMUM',
      title: 'Tanya Jawab',
      faq1Question: 'Apakah saya perlu pengalaman desain untuk menggunakan TryOn360?',
      faq1Answer: 'Sama sekali tidak. Antarmuka kami dibuat untuk merek pakaian dan desainer dari semua tingkat keahlian. Jika Anda bisa mengunggah file dan mengklik tombol, Anda bisa membuat mockup profesional.',
      faq2Question: 'Seberapa realistis model yang dihasilkan AI?',
      faq2Answer: 'AI kami membuat hasil fotorealistik dengan draping kain, pencahayaan, dan proporsi yang akurat. Kebanyakan pengguna tidak bisa membedakan mockup kami dari pemotretan tradisional.',
      faq3Question: 'Format file apa saja yang diterima untuk unggahan?',
      faq3Answer: 'Kami mendukung file PNG, JPG, dan SVG untuk desain pakaian. Untuk hasil terbaik, gunakan gambar PNG transparan dengan resolusi tinggi.',
      faq4Question: 'Berapa lama waktu rendering?',
      faq4Answer: 'Kebanyakan mockup siap dalam waktu kurang dari 60 detik. Desain kompleks dengan beberapa aksesoris mungkin memakan waktu hingga 2 menit.',
      faq5Question: 'Bisakah saya menggunakan gambar secara komersial?',
      faq5Answer: 'Ya! Semua mockup yang dihasilkan bebas royalti dan dapat digunakan untuk pemasaran, e-commerce, presentasi, atau portofolio tanpa batasan.'
    }
  };

  const t = translations[language] || translations.en;

  const faqs = [
    {
      id: 1,
      question: t.faq1Question,
      answer: t.faq1Answer
    },
    {
      id: 2,
      question: t.faq2Question,
      answer: t.faq2Answer
    },
    {
      id: 3,
      question: t.faq3Question,
      answer: t.faq3Answer
    },
    {
      id: 4,
      question: t.faq4Question,
      answer: t.faq4Answer
    },
    {
      id: 5,
      question: t.faq5Question,
      answer: t.faq5Answer
    }
  ];

  return (
    <section id="faqs" className="faqs-section">
      <div className="faqs-container">
        {/* Section Header */}
        <header className="faqs-header">
          <span className="faqs-subtitle">{t.subtitle}</span>
          <h2 className="faqs-title">{t.title}</h2>
        </header>

        {/* FAQ Chat Container */}
        <div className="faqs-chat">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className={`faq-item ${openFAQ === faq.id ? 'active' : ''}`}
              data-faq-open={openFAQ === faq.id ? '' : undefined}
            >
              <button
                className="faq-question-btn"
                onClick={() => toggleFAQ(faq.id)}
                aria-expanded={openFAQ === faq.id}
              >
                <div className="faq-grid-left"></div>
                <div className="faq-grid-center">
                  <span className="faq-question-bubble">{faq.question}</span>
                </div>
                <div className="faq-grid-right"></div>
                <span className="faq-toggle-icon">{openFAQ === faq.id ? '−' : '+'}</span>
              </button>

              <div className={`faq-answer-wrapper ${openFAQ === faq.id ? 'open' : ''}`}>
                <div className="faq-answer-grid">
                  <div className="faq-grid-left"></div>
                  <div className="faq-grid-center">
                    <div className="faq-answer-bubble">
                      <span className="faq-answer-logo">
                        <img src="/assets/landing/logo/digital360-icon.png" alt="Digital360" />
                      </span>
                      <div className="faq-answer-content">
                        <span className="faq-answer-icon">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM6.4 11.2L3.2 8L4.272 6.928L6.4 9.056L11.728 3.728L12.8 4.8L6.4 11.2Z" fill="currentColor"/>
                          </svg>
                        </span>
                        <span className="faq-answer-text">{faq.answer}</span>
                      </div>
                    </div>
                  </div>
                  <div className="faq-grid-right"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQs;
