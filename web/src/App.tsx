import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MarketPage from './pages/MarketPage';
import WorkbenchPage from './pages/WorkbenchPage';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/workbench" element={<WorkbenchPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;

