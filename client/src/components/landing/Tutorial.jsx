import React, { useState, useEffect, useRef } from 'react';
import './Tutorial.css';

const Tutorial = ({ language = 'en' }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef(null);
  const isDocumentVisible = useRef(true);

  const translations = {
    en: {
      heading: 'From Upload to Download in Minutes',
      subheading: 'Follow these 3 steps to transform your clothing designs into photorealistic mockups instantly.',
      step1: 'Select Model',
      step1Desc: 'Choose from our AI model library',
      step2: 'Choose Pose & Upload Product',
      step2Desc: 'After choose the pose, upload product include the details',
      step3: 'Add Accessories',
      step3Desc: 'Optional: Enhance with AI prompt'
    },
    id: {
      heading: 'Dari Upload ke Download dalam Hitungan Menit',
      subheading: 'Ikuti 3 langkah ini untuk mengubah desain pakaian Anda menjadi mockup fotorealistik secara instan.',
      step1: 'Pilih Model',
      step1Desc: 'Pilih dari pustaka model AI kami',
      step2: 'Pilih Pose & Unggah Produk',
      step2Desc: 'Setelah memilih pose, unggah produk beserta detailnya',
      step3: 'Tambah Aksesoris',
      step3Desc: 'Opsional: Tingkatkan dengan prompt AI'
    }
  };

  const t = translations[language] || translations.en;

  const steps = [
    {
      id: 1,
      title: t.step1,
      description: t.step1Desc,
      image: '/assets/landing/tutorials/section4-step1.png'
    },
    {
      id: 2,
      title: t.step2,
      description: t.step2Desc,
      image: '/assets/landing/tutorials/section4-step2.png'
    },
    {
      id: 3,
      title: t.step3,
      description: t.step3Desc,
      image: '/assets/landing/tutorials/section4-step3.png'
    }
  ];

  const goToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  const nextStep = () => {
    if (isPaused || !isDocumentVisible.current) {
      timeoutRef.current = setTimeout(nextStep, 1000);
      return;
    }

    const newStep = currentStep >= steps.length ? 1 : currentStep + 1;
    setCurrentStep(newStep);
  };

  useEffect(() => {
    const scheduleNextStep = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!isPaused && isDocumentVisible.current) {
        timeoutRef.current = setTimeout(() => {
          nextStep();
        }, 3000);
      }
    };

    scheduleNextStep();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentStep, isPaused]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisible.current = !document.hidden;

      if (document.hidden) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } else {
        nextStep();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentStep, isPaused]);

  return (
    <section className="tutorial-section" id="tutorial">
      <div className="tutorial-container">
        <div className="tutorial-content">
          {/* Left Column: Title + Steps */}
          <div className="left-column">
            {/* Section Header */}
            <div className="tutorial-header">
              <h2>{t.heading}</h2>
              <p>{t.subheading}</p>
            </div>

            {/* Steps Container */}
            <div className="steps-container">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`step-item ${currentStep === step.id ? 'active' : ''}`}
                  data-step={step.id}
                  onClick={() => goToStep(step.id)}
                >
                  <div className="step-loading-bar">
                    <div
                      className={`step-loading-bar-fill ${currentStep === step.id ? 'active' : ''}`}
                      style={{
                        width: currentStep === step.id ? '100%' : '0%',
                        transition: currentStep === step.id ? 'width 3s linear' : 'none'
                      }}
                    />
                  </div>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <div className="step-description">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Full Height Image */}
          <div className="right-column">
            <div className="preview-wrapper">
              <div className="preview-container">
                {steps.map((step) => (
                  <img
                    key={step.id}
                    src={step.image}
                    alt={step.title}
                    className={`preview-image ${currentStep === step.id ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Tutorial;
