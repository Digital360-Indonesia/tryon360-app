import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TryOnGenerator from './pages/TryOnGenerator';
import CreditTracker from './pages/CreditTracker';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Main Content - Full Width */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<TryOnGenerator />} />
              <Route path="/generate" element={<TryOnGenerator />} />
              <Route path="/credits" element={<CreditTracker />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
