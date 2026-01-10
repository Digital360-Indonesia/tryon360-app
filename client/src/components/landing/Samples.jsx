import React, { useState } from 'react';
import './Samples.css';

const Samples = ({ language = 'en' }) => {
  const [activeModel, setActiveModel] = useState(1);

  const handleModelChange = (modelNumber) => {
    if (modelNumber === activeModel) return;
    setActiveModel(modelNumber);
  };

  const handleKeyDown = (e, modelNumber) => {
    let newModel = activeModel;
    const totalModels = 3;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newModel = activeModel > 1 ? activeModel - 1 : totalModels;
        break;
      case 'ArrowDown':
        e.preventDefault();
        newModel = activeModel < totalModels ? activeModel + 1 : 1;
        break;
      case 'Home':
        e.preventDefault();
        newModel = 1;
        break;
      case 'End':
        e.preventDefault();
        newModel = totalModels;
        break;
      default:
        return;
    }

    handleModelChange(newModel);
  };

  const translations = {
    en: {
      model1Title: 'Basic Garment Mockup',
      model1Feature1: 'Basic garment upload',
      model1Feature2: 'Standard model pose',
      model1Feature3: 'Clean background',
      model1Feature4: 'No additional details',
      model2Title: 'Dynamic Pose + Custom Graphics',
      model2Feature1: 'Custom pose selection',
      model2Feature2: 'Print/embroidery details added',
      model2Feature3: 'Realistic fabric rendering',
      model2Feature4: 'Professional lighting',
      model3Title: 'Pose, Details & Smart Add-Ons',
      model3Feature1: 'Dynamic pose',
      model3Feature2: 'Custom print details',
      model3Feature3: 'AI-generated accessories',
      model3Feature4: 'Text prompt: "Make it full body, use ankle boots, and sunglasses"'
    },
    id: {
      model1Title: 'Mockup Pakaian Dasar',
      model1Feature1: 'Upload pakaian dasar',
      model1Feature2: 'Pose model standar',
      model1Feature3: 'Latar belakang bersih',
      model1Feature4: 'Tanpa detail tambahan',
      model2Title: 'Pose Dinamis + Grafis Kustom',
      model2Feature1: 'Pemilihan pose kustom',
      model2Feature2: 'Detail print/embroidery ditambahkan',
      model2Feature3: 'Rendering kain realistis',
      model2Feature4: 'Pencahayaan profesional',
      model3Title: 'Pose, Detail & Add-On Cerdas',
      model3Feature1: 'Pose dinamis',
      model3Feature2: 'Detail print kustom',
      model3Feature3: 'Aksesoris yang dihasilkan AI',
      model3Feature4: 'Prompt teks: "Buatnya full body, gunakan ankle boots, dan kacamata hitam"'
    }
  };

  const t = translations[language] || translations.en;

  const models = [
    {
      id: 1,
      title: t.model1Title,
      features: [t.model1Feature1, t.model1Feature2, t.model1Feature3, t.model1Feature4],
      image: '/assets/landing/samples/basic.png',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path>
        </svg>
      )
    },
    {
      id: 2,
      title: t.model2Title,
      features: [t.model2Feature1, t.model2Feature2, t.model2Feature3, t.model2Feature4],
      image: '/assets/landing/samples/details.png',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
          <path d="M12 11l-1.5 2h3l-1.5-2z"></path>
        </svg>
      )
    },
    {
      id: 3,
      title: t.model3Title,
      features: [t.model3Feature1, t.model3Feature2, t.model3Feature3, t.model3Feature4],
      image: '/assets/landing/samples/Complete.png',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      )
    }
  ];

  const currentModel = models.find(m => m.id === activeModel);

  return (
    <section className="samples-section" id="samples">
      <div className="samples-container">
        {/* LEFT PANEL: Description/Keterangan (changes per model) */}
        <div className="samples-info-panel">
          <div className="samples-info-item" style={{ display: 'block', opacity: 1, transform: 'translateY(0)' }}>
            <h3 className="samples-info-title">{currentModel.title}</h3>
            <ul className="samples-info-features">
              {currentModel.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* CENTER PANEL: Model Display */}
        <div className="samples-display-panel">
          <div className="samples-model-display">
            {models.map((model) => (
              <div
                key={model.id}
                className={`samples-model-item ${model.id === activeModel ? 'active' : ''}`}
                data-model={model.id}
              >
                <div className="samples-model-image">
                  <img src={model.image} alt={model.title} className="samples-model-img" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Icon Tabs */}
        <div className="samples-tabs-panel">
          <div className="samples-icon-tabs" role="tablist" aria-label="Model selection">
            {models.map((model) => (
              <button
                key={model.id}
                className={`samples-tab-icon ${model.id === activeModel ? 'active' : ''}`}
                role="tab"
                aria-selected={model.id === activeModel}
                aria-controls={`model-${model.id}`}
                aria-describedby={`info-${model.id}`}
                data-model={model.id}
                title={`Style ${model.id}`}
                onClick={() => handleModelChange(model.id)}
                onKeyDown={(e) => handleKeyDown(e, model.id)}
              >
                {model.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Samples;
