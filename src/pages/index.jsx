import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Opportunities from "./Opportunities";

import Portfolio from "./Portfolio";

import Analytics from "./Analytics";

import Calculator from "./Calculator";

import Bot from "./Bot";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Opportunities: Opportunities,
    
    Portfolio: Portfolio,
    
    Analytics: Analytics,
    
    Calculator: Calculator,
    
    Bot: Bot,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Opportunities" element={<Opportunities />} />
                
                <Route path="/Portfolio" element={<Portfolio />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Calculator" element={<Calculator />} />
                
                <Route path="/Bot" element={<Bot />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}