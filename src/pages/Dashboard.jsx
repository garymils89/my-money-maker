import React, { useState, useEffect } from "react";
import { BotExecution } from "@/api/entities";
import { motion } from "framer-motion";
import { RefreshCw, Bot, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StatsGrid from "../components/dashboard/StatsGrid";
import MarketOverview from "../components/dashboard/MarketOverview";
import { botStateManager } from "../components/bot/botState";

const StrategyPerformanceCard = ({ title, stats, icon: Icon, colorClass }) => (
  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`w-4 h-4 text-muted-foreground ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">${stats.profit.toFixed(2)}</div>
      <p className="text-xs text-muted-foreground">{stats.trades} trades</p>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [strategyStats, setStrategyStats] = useState({
    arbitrage: { trades: 0, profit: 0 },
    flashloan: { trades: 0, profit: 0 },
  });
  
  const [overallStats, setOverallStats] = useState({
    totalPortfolio: 0,
    todayProfit: 0,
    successRate: 0,
    totalTrades: 0,
  });

  useEffect(() => {
    const unsubscribe = botStateManager.subscribe((state) => {
      setExecutions(state.executions);
      setOverallStats(prev => ({ ...prev, totalPortfolio: state.walletBalance }));
      
      // Calculate stats from executions
      const completedTrades = state.executions.filter(e => e.status === 'completed' && (e.execution_type === 'trade' || e.execution_type === 'flashloan_trade'));
      const totalTrades = state.executions.filter(e => e.execution_type === 'trade' || e.execution_type === 'flashloan_trade').length;
      
      const arbTrades = completedTrades.filter(t => t.strategy_type === 'arbitrage');
      const flashTrades = completedTrades.filter(t => t.strategy_type === 'flashloan');
      
      const arbProfit = arbTrades.reduce((sum, t) => sum + (t.profit_realized || 0), 0);
      const flashProfit = flashTrades.reduce((sum, t) => sum + (t.profit_realized || 0), 0);

      setStrategyStats({
        arbitrage: { trades: arbTrades.length, profit: arbProfit },
        flashloan: { trades: flashTrades.length, profit: flashProfit },
      });
      
      setOverallStats(prev => ({
          ...prev,
          todayProfit: arbProfit + flashProfit, // Simplified for now
          totalTrades: totalTrades,
          successRate: totalTrades > 0 ? (completedTrades.length / totalTrades) * 100 : 0
      }));

      setLastUpdated(new Date());
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const chartData = processChartData(executions);

  function processChartData(executions) {
    const trades = executions.filter(e => e.status === 'completed' && (e.execution_type === 'trade' || e.execution_type === 'flashloan_trade'));
    if (trades.length === 0) return [];
  
    const tradesByDay = {};
    trades.forEach(trade => {
      const day = new Date(trade.created_date).toLocaleDateString('en-CA');
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
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
              Aggregated performance from all active trading bots
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        <StatsGrid stats={overallStats} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StrategyPerformanceCard 
                title="Standard Arbitrage P&L"
                stats={strategyStats.arbitrage}
                icon={TrendingUp}
                colorClass="text-emerald-500"
            />
            <StrategyPerformanceCard 
                title="Flashloan P&L"
                stats={strategyStats.flashloan}
                icon={Zap}
                colorClass="text-purple-500"
            />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <MarketOverview data={chartData} />
          </div>
        </div>
      </div>
    </div>
  );
}