import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bot,
  Play,
  Pause,
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Settings,
  Shield
} from "lucide-react";
import BotConfigForm from "../components/bot/BotConfigForm";
import RiskControls from "../components/bot/RiskControls";
import BotExecutionLog from "../components/bot/BotExecutionLog";
import LeverageManager from "../components/bot/LeverageManager";

// Demo Trading Engine for simulation
class LiveTradingEngine {
  constructor() {
    this.isRunning = false;
    this.config = null;
    this.dailyStats = { trades: 0, profit: 0, loss: 0, gasUsed: 0 };
    this.realBalances = { maticBalance: 128, usdcBalance: 1200 };
    console.log('🚀 Demo Trading Engine Initialized');
  }

  async depositToAave(amount) {
    console.log(`[DEMO] Depositing ${amount} USDC to Aave...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { hash: '0xdemo...deposit' };
  }

  async borrowFromAave(amount) {
    console.log(`[DEMO] Borrowing ${amount} USDT from Aave...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { hash: '0xdemo...borrow' };
  }
  
  async repayAaveLoan(amount) {
    console.log(`[DEMO] Repaying ${amount} USDT to Aave...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { hash: '0xdemo...repay' };
  }

  async withdrawFromAave(amount) {
    console.log(`[DEMO] Withdrawing ${amount} USDC from Aave...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { hash: '0xdemo...withdraw' };
  }

  async getAavePosition() {
    return { 
      collateralUSDC: 800,
      borrowedUSDT: 400,
      healthFactor: 2.5,
      ltv: 0.5,
      availableBorrowsUSDT: 200
    };
  }

  canTradeLive() {
    return false; // Demo mode
  }

  async initialize(config) {
    this.config = config;
    console.log('📝 Demo mode initialized');
    return this.realBalances;
  }

  getCurrentBalances() {
    return this.realBalances;
  }

  getDailyStats() {
    return this.dailyStats;
  }

  async executeRealArbitrage(opportunity) {
    console.log('📝 [DEMO] Simulating trade...');
    const success = Math.random() > 0.15;
    const actualProfit = success
      ? opportunity.netProfitUsd * (0.85 + Math.random() * 0.25)
      : -opportunity.gasEstimate * (0.7 + Math.random() * 0.3);

    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    if (success) {
      this.dailyStats.profit += actualProfit;
    } else {
      this.dailyStats.loss += Math.abs(actualProfit);
    }
    this.dailyStats.trades++;
    this.dailyStats.gasUsed += opportunity.gasEstimate;

    return {
      success,
      profit: parseFloat(actualProfit.toFixed(4)),
      gasUsed: parseFloat(opportunity.gasEstimate.toFixed(4)),
      txHash: '0xdemo_' + Math.random().toString(16).substr(2, 54),
      simulatedTrade: true,
      executionTime: Date.now(),
      note: 'Demo trade - no real funds moved'
    };
  }

  async scanForRealOpportunities() {
    console.log('🔍 [DEMO] Scanning for opportunities...');
    
    const baseSpread = 0.0015 + (Math.random() * 0.002);
    const volatilityMultiplier = 1 + (Math.random() - 0.5) * 0.3;

    const opportunities = [
      {
        pair: 'USDC/USDT',
        buyDex: 'QuickSwap',
        sellDex: 'Curve',
        buyPrice: 1.0000 - (baseSpread * volatilityMultiplier),
        sellPrice: 1.0000 + (baseSpread * volatilityMultiplier),
        riskLevel: 'low',
        gasEstimate: 0.15,
        liquidity: 280000
      }
    ].map(opp => {
      const profitPercentage = ((opp.sellPrice - opp.buyPrice) / opp.buyPrice) * 100;
      const maxTradeAmount = Math.min(this.realBalances.usdcBalance * 0.2, 300);
      const netProfitUsd = maxTradeAmount * (profitPercentage / 100);

      return {
        ...opp,
        profitPercentage: parseFloat(profitPercentage.toFixed(4)),
        netProfitUsd: parseFloat(netProfitUsd.toFixed(2)),
        tradeAmount: parseFloat(maxTradeAmount.toFixed(2)),
        timestamp: Date.now()
      };
    }).filter(opp => {
      const minProfit = this.config?.min_profit_threshold || 0.2;
      return opp.profitPercentage >= minProfit;
    });

    return opportunities.length > 0 ? opportunities : [];
  }
}

export default function BotPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [botConfig, setBotConfig] = useState({
    bot_name: 'ArbitrageBot',
    min_profit_threshold: 0.2,
    max_position_size: 300,
    max_daily_trades: 20,
    daily_loss_limit: 50,
    max_slippage_percentage: 0.5,
    stop_loss_percentage: 5
  });
  const [executions, setExecutions] = useState([]);
  const [walletInfo, setWalletInfo] = useState({ maticBalance: 128, usdcBalance: 1200 });
  const [dailyStats, setDailyStats] = useState({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });
  
  const engineRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    engineRef.current = new LiveTradingEngine();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const runTradingLoop = async () => {
    try {
      const engine = engineRef.current;
      const opps = await engine.scanForRealOpportunities();

      const scanExecution = {
        id: Date.now(),
        created_date: new Date().toISOString(),
        execution_type: 'scan',
        status: 'completed',
        details: {
          opportunities_found: opps.length,
          current_balances: engine.getCurrentBalances(),
          trading_mode: 'SIMULATION'
        }
      };

      if (opps.length > 0 && opps[0].netProfitUsd > (botConfig?.min_profit_threshold || 0.2)) {
        console.log('💎 Executing top opportunity:', opps[0]);

        const tradeResult = await engine.executeRealArbitrage(opps[0]);

        const tradeExecution = {
          id: Date.now() + 1,
          created_date: new Date().toISOString(),
          execution_type: 'trade',
          status: tradeResult.success ? 'completed' : 'failed',
          profit_realized: tradeResult.profit,
          gas_used: tradeResult.gasUsed,
          details: {
            opportunity: opps[0],
            result: tradeResult,
            tx_hash: tradeResult.txHash,
            trading_mode: 'SIMULATION',
            balances_after: engine.getCurrentBalances()
          }
        };

        setExecutions(prev => [tradeExecution, scanExecution, ...prev]);
        setWalletInfo(engine.getCurrentBalances());
      } else {
        setExecutions(prev => [scanExecution, ...prev]);
      }

      setDailyStats(engine.getDailyStats());

    } catch (error) {
      console.error("❌ Trading loop error:", error);
      const errorExecution = {
        id: Date.now(),
        created_date: new Date().toISOString(),
        execution_type: 'error',
        status: 'failed',
        error_message: error.message,
        details: { error: error.message }
      };
      setExecutions(prev => [errorExecution, ...prev]);
    }
  };

  const handleToggleBot = async () => {
    if (!isRunning) {
      // Start bot
      const engine = engineRef.current;
      await engine.initialize(botConfig);
      
      setIsRunning(true);
      intervalRef.current = setInterval(runTradingLoop, 60000); // Run every 60 seconds
      
      // Run once immediately
      runTradingLoop();
    } else {
      // Stop bot
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const handleConfigUpdate = (newConfig) => {
    setBotConfig(newConfig);
    if (engineRef.current) {
      engineRef.current.config = newConfig;
    }
  };

  const getStatusColor = () => {
    return isRunning ? 'bg-emerald-500' : 'bg-slate-500';
  };

  const getStatusText = () => {
    return isRunning ? 'Active' : 'Stopped';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${getStatusColor()} bg-opacity-20`}>
              <Bot className={`w-8 h-8 ${getStatusColor().replace('bg-', 'text-')}`} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Trading Bot
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isRunning ? 'animate-pulse' : ''}`} />
                <span className="text-slate-600">{getStatusText()}</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleToggleBot}
            className={`${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Bot
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Bot
              </>
            )}
          </Button>
        </div>

        {/* Demo Alert */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-amber-800">
            <strong>Demo Mode:</strong> The bot is currently running in simulation mode. No real trades are executed, but you can see how it would perform with live data.
          </AlertDescription>
        </Alert>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Trades Today</p>
                  <h3 className="text-2xl font-bold text-slate-900">{dailyStats.trades}</h3>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Today's Profit</p>
                  <h3 className="text-2xl font-bold text-emerald-600">${dailyStats.profit.toFixed(2)}</h3>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Gas Used</p>
                  <h3 className="text-2xl font-bold text-purple-600">{dailyStats.gasUsed.toFixed(2)} MATIC</h3>
                </div>
                <Zap className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">USDC Balance</p>
                  <h3 className="text-2xl font-bold text-orange-600">${walletInfo.usdcBalance}</h3>
                </div>
                <Zap className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuration
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Risk Controls
              </TabsTrigger>
              <TabsTrigger value="leverage" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Leverage
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <BotExecutionLog executions={executions} />
          </TabsContent>

          <TabsContent value="config">
            <BotConfigForm config={botConfig} onSubmit={handleConfigUpdate} />
          </TabsContent>

          <TabsContent value="risk">
            <RiskControls config={botConfig} dailyStats={dailyStats} onUpdateConfig={handleConfigUpdate} />
          </TabsContent>

          <TabsContent value="leverage">
            <LeverageManager engine={engineRef.current} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}