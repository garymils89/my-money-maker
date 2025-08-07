import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { RefreshCw, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import StatsGrid from "../components/dashboard/StatsGrid";
import LiveOpportunities from "../components/dashboard/LiveOpportunities";
import MarketOverview from "../components/dashboard/MarketOverview";

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadData();
    // Simulate real-time updates
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [oppData, portfolioData] = await Promise.all([
        base44.entities.ArbitrageOpportunity.list(),
        base44.entities.Portfolio.list()
      ]);
      setOpportunities(oppData);
      setPortfolio(portfolioData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const totalPortfolio = portfolio.reduce((sum, p) => sum + (p.current_value || 0), 0);
    const totalInvested = portfolio.reduce((sum, p) => sum + (p.total_invested || 0), 0);
    const portfolioChange = totalInvested > 0 ? ((totalPortfolio - totalInvested) / totalInvested) * 100 : 0;
    
    const activeOpportunities = opportunities.filter(o => o.status === 'active').length;
    const bestOpportunity = Math.max(...opportunities.map(o => o.profit_percentage || 0), 0);
    
    return {
      totalPortfolio,
      portfolioChange,
      activeOpportunities,
      bestOpportunity,
      todayProfit: 520, // This would come from trades data
      profitChange: 12.5
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Trading Dashboard
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              Monitor your USDC arbitrage opportunities in real-time
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Alert for demo purposes */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">
            <strong>Demo Mode:</strong> This is a demonstration of the arbitrage interface. In production, this would connect to real exchange APIs.
          </AlertDescription>
        </Alert>

        {/* Stats Grid */}
        <StatsGrid stats={calculateStats()} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MarketOverview />
          </div>
          <div>
            <LiveOpportunities opportunities={opportunities} />
          </div>
        </div>
      </div>
    </div>
  );
}