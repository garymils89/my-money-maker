import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Fixed import path - Layout is in the pages folder
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import Bot from './pages/Bot';
import Calculator from './pages/Calculator';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Redirect root to the Bot page - no login required */}
          <Route path="/" element={<Navigate to="/Bot" replace />} />

          {/* All your other pages */}
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Opportunities" element={<Opportunities />} />
          <Route path="/Bot" element={<Bot />} />
          <Route path="/Calculator" element={<Calculator />} />
          <Route path="/Portfolio" element={<Portfolio />} />
          <Route path="/Analytics" element={<Analytics />} />

          {/* Catch-all for unknown pages */}
          <Route path="*" element={<Navigate to="/Bot" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);