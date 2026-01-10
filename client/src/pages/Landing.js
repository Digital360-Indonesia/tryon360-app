import React from 'react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Samples from '../components/landing/Samples';
import Tutorial from '../components/landing/Tutorial';
import FAQs from '../components/landing/FAQs';
import Footer from '../components/landing/Footer';
import { useLanguage } from '../contexts/LanguageContext';
import './Landing.css';

const Landing = () => {
  const { language } = useLanguage();

  return (
    <div className="landing-page">
      <Header />
      <main id="main-content">
        <Hero language={language} />
        <Features language={language} />
        <Samples language={language} />
        <Tutorial language={language} />
        <FAQs language={language} />
        <Footer language={language} />
      </main>
    </div>
  );
};

export default Landing;
