
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bot,
  Play,
  Pause,
  Settings,
  Activity,
  AlertTriangle,
  Zap,
  TrendingUp
} from "lucide-react";
import BotConfigForm from "../components/bot/BotConfigForm";
import RiskControls from "../components/bot/RiskControls";
import BotExecutionLog from "../components/bot/BotExecutionLog";

// This class simulates the bot's logic.
class DexArbitrageEngine {
  constructor() {
    this.isRunning = false;
    this.config = null;
    this.dailyStats = { trades: 0, profit: 0, loss: 0, gasUsed: 0 };
    this.paperTrading = true;
  }

  initialize(config) {
    console.log('🚀 Initializing DEX Arbitrage Bot...');
    console.log('📊 Paper Trading Mode: ENABLED');
    this.config = config;
    console.log('✅ Bot engine initialized');
    return true;
  }

  async scanForOpportunities() {
    console.log('🔍 Scanning for arbitrage opportunities...');
    const opportunities = [
      { pair: 'USDC/USDT', buyDex: 'QuickSwap', sellDex: 'Uniswap V3', buyPrice: 0.9998, sellPrice: 1.0021, profitPercentage: 0.23, netProfitUsd: 2.76, riskLevel: 'low' },
      { pair: 'USDC/DAI', buyDex: 'Curve', sellDex: 'SushiSwap', buyPrice: 1.0001, sellPrice: 1.0034, profitPercentage: 0.33, netProfitUsd: 3.96, riskLevel: 'low' },
    ];
    return opportunities.filter(opp => opp.profitPercentage >= (this.config?.min_profit_threshold || 0.2));
  }

  async executeArbitrageTrade(opportunity) {
    const tradeAction = '📝 SIMULATING';
    console.log(`${tradeAction} arbitrage: ${opportunity.pair}`);
    const success = Math.random() > 0.1;
    const actualProfit = success ? opportunity.netProfitUsd * (0.85 + Math.random() * 0.3) : -0.15 * 0.65;
    console.log(`📝 TRADE RESULT: ${success ? 'SUCCESS' : 'FAILED'} - P&L: $${actualProfit.toFixed(2)}`);

    if (actualProfit > 0) this.dailyStats.profit += actualProfit;
    else this.dailyStats.loss += Math.abs(actualProfit);
    this.dailyStats.trades++;
    this.dailyStats.gasUsed += 0.15;

    return { success, profit: actualProfit, gasUsed: 0.15, txHash: '0x' + Math.random().toString(16).substr(2, 64) };
  }

  // A single "tick" of the bot's logic
  async runIteration() {
    if (!this.isRunning) return { newExecutions: [] };
    
    const opps = await this.scanForOpportunities();
    const scanExecution = { id: Date.now(), created_date: new Date().toISOString(), execution_type: 'scan', status: 'completed', details: { opportunities_found: opps.length }};

    if (opps.length > 0) {
      const result = await this.executeArbitrageTrade(opps[0]);
      const tradeExecution = { id: Date.now() + 1, created_date: new Date().toISOString(), execution_type: 'trade', status: result.success ? 'completed' : 'failed', profit_realized: result.profit, gas_used: result.gasUsed, details: { opportunity: opps[0], result }};
      return { newExecutions: [tradeExecution, scanExecution], opportunities: opps };
    }
    
    return { newExecutions: [scanExecution], opportunities: [] };
  }

  start() { this.isRunning = true; }
  stop() { this.isRunning = false; }
  getDailyStats() { return { ...this.dailyStats }; }
}

// Keep a single instance of the bot engine
const botEngine = new DexArbitrageEngine();

export default function BotPage() {
  const [botConfig, setBotConfig] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [dailyStats, setDailyStats] = useState({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const runBotLoop = async () => {
    if (!botEngine.isRunning) return;
    const { newExecutions, opportunities } = await botEngine.runIteration();
    if (newExecutions.length > 0) {
      setExecutions(prev => [...newExecutions, ...prev.slice(0, 50)]);
    }
    setOpportunities(opportunities);
    setDailyStats(botEngine.getDailyStats());
  };

  const loadInitialData = async () => {
    try {
      const configs = await base44.entities.BotConfig.list();
      if (configs.length > 0) {
        setBotConfig(configs[0]);
        botEngine.initialize(configs[0]);
      } else {
        const defaultConfig = { bot_name: 'DEX Arbitrage Bot', min_profit_threshold: 0.2 };
        setBotConfig(defaultConfig);
        botEngine.initialize(defaultConfig);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  
  useEffect(() => {
    loadInitialData();
    return () => { // Cleanup on unmount
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleStartBot = () => {
    if (!botConfig) return alert('Please configure the bot first');
    console.log('🟢 Starting DEX Arbitrage Bot...');
    botEngine.start();
    setIsRunning(true);
    runBotLoop(); // Run immediately
    intervalRef.current = setInterval(runBotLoop, 15000); // Then run every 15 seconds
  };

  const handleStopBot = () => {
    console.log('🔴 Stopping DEX Arbitrage Bot...');
    botEngine.stop();
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  
  const handleScanOpportunities = async () => {
    setLoading(true);
    const opps = await botEngine.scanForOpportunities();
    setOpportunities(opps);
    setLoading(false);
  };

  const handleUpdateConfig = async (newConfig) => {
    setBotConfig(prev => ({...prev, ...newConfig}));
    botEngine.config = {...botEngine.config, ...newConfig};
    alert('Configuration saved!');
  };

  if (loading) return <div className="p-6">Loading Bot Controller...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">DEX Arbitrage Bot</h1>
              <div className="text-slate-600 mt-2 font-medium">
                Automated trading across Polygon DEXs - 
                <Badge className={"bg-blue-100 text-blue-800 ml-2"}>
                  PAPER TRADING
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleScanOpportunities} disabled={isRunning} variant="outline" className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Scan Market
            </Button>
            {isRunning ? (
              <Button onClick={handleStopBot} variant="destructive" className="flex items-center gap-2 w-32">
                <Pause className="w-4 h-4" /> Stop Bot
              </Button>
            ) : (
              <Button onClick={handleStartBot} disabled={!botConfig} className="bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center gap-2 w-32">
                <Play className="w-4 h-4" /> Start Bot
              </Button>
            )}
          </div>
        </div>

        {isRunning && (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50">
            <Zap className="w-4 h-4" />
            <AlertDescription className="text-emerald-800">
              <strong>Bot is Running:</strong> Scanning for opportunities. Stats: {dailyStats.trades} trades, ${dailyStats.profit.toFixed(2)} profit.
            </AlertDescription>
          </Alert>
        )}

        {opportunities.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Live Opportunities Found</CardTitle></CardHeader>
            <CardContent>
                {opportunities.map((opp, index) => (
                  <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200 mb-2">
                      <div className="flex justify-between items-center">
                          <div><div className="font-semibold">{opp.pair} on {opp.buyDex} → {opp.sellDex}</div></div>
                          <div className="text-right"><div className="font-bold text-green-600">+{opp.profitPercentage.toFixed(2)}%</div></div>
                      </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="risk">Risk Controls</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config">
            <BotConfigForm config={botConfig} onSubmit={handleUpdateConfig} />
          </TabsContent>
          
          <TabsContent value="risk">
            <RiskControls config={botConfig} dailyStats={dailyStats} onUpdateConfig={handleUpdateConfig} />
          </TabsContent>
          
          <TabsContent value="logs">
            <BotExecutionLog executions={executions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
