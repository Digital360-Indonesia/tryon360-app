import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TryOnStudio from './pages/TryOnStudio';
import GenerationLogs from './pages/GenerationLogs';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<TryOnStudio />} />
          <Route path="/logs" element={<GenerationLogs />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;