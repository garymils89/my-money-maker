
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
  const [executions, setExecutions] = useState([]); // Add state for executions
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
      const [oppData, portfolioData, execData] = await Promise.all([
        base44.entities.ArbitrageOpportunity.list({ filter: { status: 'active' } }),
        base44.entities.Portfolio.list(),
        base44.entities.BotExecution.list({ sort: '-created_date', limit: 1000 }) // FIXED: Read from BotExecution instead of Trade
      ]);
      setOpportunities(oppData);
      setPortfolio(portfolioData);
      setExecutions(execData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (executions) => {
    const totalPortfolio = portfolio.reduce((sum, p) => sum + (p.current_value || 0), 0);
    const totalInvested = portfolio.reduce((sum, p) => sum + (p.total_invested || 0), 0);
    const portfolioChange = totalInvested > 0 ? ((totalPortfolio - totalInvested) / totalInvested) * 100 : 0;
    
    const activeOpportunities = opportunities.length;
    const bestOpportunity = Math.max(...opportunities.map(o => o.profit_percentage || 0), 0);

    // --- DYNAMIC PROFIT CALCULATION FROM LIVE BOT DATA ---
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (date1, date2) => date1.toDateString() === date2.toDateString();

    // Filter actual trade executions from your live bot
    const todayTrades = executions.filter(e => 
      e.execution_type === 'trade' && 
      e.status === 'completed' && 
      isSameDay(new Date(e.created_date), today)
    );
    
    const yesterdayTrades = executions.filter(e => 
      e.execution_type === 'trade' && 
      e.status === 'completed' && 
      isSameDay(new Date(e.created_date), yesterday)
    );

    const todayProfit = todayTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);
    const yesterdayProfit = yesterdayTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);

    let profitChange = 0;
    if (yesterdayProfit !== 0) {
      profitChange = ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100;
    } else if (todayProfit > 0) {
      profitChange = 100; // If yesterday's profit was 0 and today's is positive, it's a 100% increase
    }

    return {
      totalPortfolio,
      portfolioChange,
      activeOpportunities,
      bestOpportunity,
      todayProfit: todayProfit,
      profitChange: parseFloat(profitChange.toFixed(1))
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
        <StatsGrid stats={calculateStats(executions)} />

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
