
import React, { useState, useEffect } from "react";
import { BotExecution } from "@/api/entities";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot } from "lucide-react";

import StatsGrid from "../components/dashboard/StatsGrid";
import LiveOpportunities from "../components/dashboard/LiveOpportunities";
import MarketOverview from "../components/dashboard/MarketOverview";
import { ethers } from "ethers";
import { botStateManager } from "../components/bot/botState"; // Import bot state

// Wallet details for balance fetching
const NATIVE_USDC_CONTRACT_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const BRIDGED_USDC_CONTRACT_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const USDC_ABI = ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"];

export default function Dashboard() {
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = new Date());
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    loadData();
    
    // Subscribe to bot state updates for real-time data
    const unsubscribe = botStateManager.subscribe((botExecutions) => {
      setExecutions(botExecutions);
      setLastUpdated(new Date());
    });
    
    // Refresh every 30 seconds (less frequent than bot page)
    const interval = setInterval(loadData, 30000);
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL;
      const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;
      if (!rpcUrl || !privateKey) return 0;
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const address = await wallet.getAddress();
      
      const nativeUsdcContract = new ethers.Contract(NATIVE_USDC_CONTRACT_ADDRESS, USDC_ABI, provider);
      const bridgedUsdcContract = new ethers.Contract(BRIDGED_USDC_CONTRACT_ADDRESS, USDC_ABI, provider);
      
      const [nativeUsdcWei, bridgedUsdcWei, nativeDecimals, bridgedDecimals] = await Promise.all([
        nativeUsdcContract.balanceOf(address),
        bridgedUsdcContract.balanceOf(address),
        nativeUsdcContract.decimals(),
        bridgedUsdcContract.decimals()
      ]);

      const nativeUsdc = parseFloat(ethers.formatUnits(nativeUsdcWei, Number(nativeDecimals)));
      const bridgedUsdc = parseFloat(ethers.formatUnits(bridgedUsdcWei, Number(bridgedDecimals)));
      
      return nativeUsdc + bridgedUsdc;
    } catch(e) {
      console.error("Error fetching wallet balance for dashboard:", e);
      return 0;
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get bot executions from central state first (instant)
      const botExecutions = botStateManager.getExecutions();
      
      // If we have bot data, use it; otherwise load from database
      const executionData = botExecutions.length > 0 
        ? botExecutions 
        : await BotExecution.list('-created_date', 1000);
      
      const balance = await fetchWalletBalance();
      
      setExecutions(executionData || []);
      setWalletBalance(balance);
      setLastUpdated(new Date());
      
      console.log(`📊 Dashboard loaded: ${executionData?.length || 0} executions, $${balance.toFixed(2)} balance`);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (executions) => {
    const trades = executions.filter(e =>
      e.execution_type === 'trade' || e.execution_type === 'flashloan_trade'
    );

    const completedTrades = trades.filter(e => e.status === 'completed');
    const totalProfit = completedTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);
    const totalTradesCount = trades.length;
    
    // Today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTrades = completedTrades.filter(e => new Date(e.created_date) >= today);
    const todayProfit = todayTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);

    // Yesterday's data for comparison
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayTrades = completedTrades.filter(e => {
      const tradeDate = new Date(e.created_date);
      return tradeDate >= yesterday && tradeDate < today;
    });
    const yesterdayProfit = yesterdayTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);

    // Calculate profit change
    let profitChange = 0;
    if (yesterdayProfit > 0) {
      profitChange = ((todayProfit - yesterdayProfit) / yesterdayProfit) * 100;
    } else if (todayProfit > 0) {
      profitChange = 100; // Infinite growth if yesterday was 0
    }

    // Active opportunities (based on recent trades)
    const recentProfitableTrades = completedTrades.filter(e =>
      new Date(e.created_date) > new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
    );

    // Best opportunity today
    const bestOppToday = todayTrades.length > 0
      ? Math.max(...todayTrades.map(t => t.details?.opportunity?.profitPercentage || 0))
      : 0;

    return {
      totalPortfolio: walletBalance,
      portfolioChange: totalProfit > 0 ? 2.1 : -0.5, // Placeholder
      activeOpportunities: recentProfitableTrades.length,
      bestOpportunity: bestOppToday,
      todayProfit,
      profitChange: parseFloat(profitChange.toFixed(1)),
      totalTrades: totalTradesCount,
      successRate: totalTradesCount > 0 ? (completedTrades.length / totalTradesCount) * 100 : 0
    };
  };

  const processChartData = (executions) => {
    const trades = executions.filter(e => e.status === 'completed' && (e.execution_type === 'trade' || e.execution_type === 'flashloan_trade'));
    if (trades.length === 0) return [];
  
    const tradesByDay = {};
    trades.forEach(trade => {
      const day = new Date(trade.created_date).toLocaleDateString('en-CA'); // YYYY-MM-DD
      if (!tradesByDay[day]) {
        tradesByDay[day] = { profit: 0, count: 0 };
      }
      tradesByDay[day].profit += trade.profit_realized || 0;
      tradesByDay[day].count++;
    });
  
    let cumulativeProfit = 0;
    return Object.keys(tradesByDay).sort().map(day => {
      cumulativeProfit += tradesByDay[day].profit;
      return {
        time: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        profit: parseFloat(cumulativeProfit.toFixed(2)),
        trades: tradesByDay[day].count
      };
    });
  };

  const stats = calculateStats(executions);
  const chartData = processChartData(executions);

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
              Live data from your bot - {executions.length} total events recorded
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
          </div>
        </motion.div>

        {/* Bot Status Alert */}
        {isLoading ? (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">
              <strong>Loading live bot data...</strong>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50">
            <Bot className="w-4 h-4" />
            <AlertDescription className="text-emerald-800">
              <strong>Live Bot Data:</strong> This dashboard now shows real performance from your bot's execution history.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MarketOverview data={chartData} />
          </div>
          <div>
            <LiveOpportunities executions={executions} />
          </div>
        </div>
      </div>
    </div>
  );
}
