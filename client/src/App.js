import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import TryOnStudio from './pages/TryOnStudio';
import GenerationLogs from './pages/GenerationLogs';
import './index.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/app" element={<TryOnStudio />} />
            <Route path="/studio" element={<TryOnStudio />} />
            <Route path="/logs" element={<GenerationLogs />} />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;