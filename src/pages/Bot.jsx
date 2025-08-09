import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bot, Play, Pause, Settings, History, Zap, Shield, Activity } from "lucide-react";
import BotDashboard from "../components/bot/BotDashboard";
import LiveActivityFeed from "../components/bot/LiveActivityFeed";
import BotConfigForm from "../components/bot/BotConfigForm";
import RiskControls from "../components/bot/RiskControls";
import BotExecutionLog from "../components/bot/BotExecutionLog";
import { botStateManager } from "../components/bot/botState";
import { BotEngine } from "../components/bot/BotEngine";
import { Badge } from "@/components/ui/badge";
import { tradingSafety } from "../components/bot/TradingSafetyLayer";

export default function BotPage() {
  const [isRunning, setIsRunning] = useState(botStateManager.getState().isRunning);
  const [isLive, setIsLive] = useState(botStateManager.getState().isLive);
  const [wallet, setWallet] = useState({ address: '', nativeUsdc: 0, bridgedUsdc: 0, matic: 0 });
  const [executions, setExecutions] = useState(botStateManager.getState().executions);
  const [dailyStats, setDailyStats] = useState(botStateManager.getState().dailyStats || { trades: 0, profit: 0, loss: 0, gasUsed: 0 });

  const [botConfig, setBotConfig] = useState({
    bot_name: 'ArbitrageBot', min_profit_threshold: 0.2, max_position_size: 300,
    max_daily_trades: 20, daily_loss_limit: 50, max_slippage_percentage: 0.5, stop_loss_percentage: 5
  });
  const [flashloanConfig, setFlashloanConfig] = useState({
    enabled: true, amount: 5000, provider: 'aave', fee_percentage: 0.09
  });

  useEffect(() => {
    const handleStateChange = (state) => {
      setIsRunning(state.isRunning);
      setIsLive(state.isLive);
      setExecutions(state.executions);
      if (state.dailyStats) setDailyStats(state.dailyStats);
      // Wallet data needs to be added to state manager to be reflected here
    };
    const unsubscribe = botStateManager.subscribe(handleStateChange);
    
    // Pass initial config to engine
    const initialFlashAmount = tradingSafety.getConfig().maxFlashloanAmount;
    const initialFlashConfig = { ...flashloanConfig, amount: initialFlashAmount };
    setFlashloanConfig(initialFlashConfig);
    BotEngine.updateConfig(botConfig, initialFlashConfig);

    return unsubscribe;
  }, []);

  const handleBotConfigUpdate = (newConfig) => {
    setBotConfig(newConfig);
    BotEngine.updateConfig(newConfig, flashloanConfig);
  };

  const handleFlashloanConfigUpdate = (newConfig) => {
    setFlashloanConfig(newConfig);
    BotEngine.updateConfig(botConfig, newConfig);
  };

  const handleToggleBot = () => {
    if (isRunning) {
      BotEngine.stop();
    } else {
      BotEngine.start();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Trading Bot Control Center
            </h1>
            <p className="text-slate-600 mt-2 font-medium">Manage your automated arbitrage trading system</p>
          </div>
          <div className="flex gap-3">
            <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-emerald-100 text-emerald-800" : ""}>
              {isLive ? "LIVE" : "OFFLINE"}
            </Badge>
            <Button onClick={handleToggleBot} className={`transition-all duration-300 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
              {isRunning ? (<><Pause className="w-4 h-4 mr-2" /><span>Stop Bot</span></>) : (<><Play className="w-4 h-4 mr-2" /><span>Start Bot</span></>)}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="dashboard"><Bot className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
            <TabsTrigger value="livefeed"><Activity className="w-4 h-4 mr-2" />Live Feed</TabsTrigger>
            <TabsTrigger value="history"><History className="w-4 h-4 mr-2" />History</TabsTrigger>
            <TabsTrigger value="config"><Settings className="w-4 h-4 mr-2" />Configuration</TabsTrigger>
            <TabsTrigger value="risk"><Shield className="w-4 h-4 mr-2" />Risk Controls</TabsTrigger>
            <TabsTrigger value="flashloan"><Zap className="w-4 h-4 mr-2" />Flashloan</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><BotDashboard stats={{ ...dailyStats, isRunning }} wallet={wallet} botConfig={botConfig} executions={executions} onToggleBot={handleToggleBot} /></TabsContent>
          <TabsContent value="livefeed"><LiveActivityFeed executions={executions} isRunning={isRunning} /></TabsContent>
          <TabsContent value="history"><BotExecutionLog executions={executions} /></TabsContent>
          <TabsContent value="config"><BotConfigForm config={botConfig} onConfigUpdate={handleBotConfigUpdate} isRunning={isRunning} /></TabsContent>
          <TabsContent value="risk"><RiskControls config={botConfig} onConfigUpdate={handleBotConfigUpdate} dailyStats={dailyStats} /></TabsContent>
          <TabsContent value="flashloan">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500" />Flashloan Configuration</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Enable Flashloan Trading</span>
                    <input type="checkbox" checked={flashloanConfig.enabled} onChange={(e) => handleFlashloanConfigUpdate({ ...flashloanConfig, enabled: e.target.checked })} />
                  </div>
                  {flashloanConfig.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Flashloan Amount (USDC)</label>
                        <input type="number" value={flashloanConfig.amount} onChange={(e) => handleFlashloanConfigUpdate({ ...flashloanConfig, amount: parseFloat(e.target.value) })} className="w-full p-2 border rounded" max={tradingSafety.getConfig().maxFlashloanAmount} />
                        <p className="text-xs text-slate-500 mt-1">Max allowed: ${tradingSafety.getConfig().maxFlashloanAmount} in {tradingSafety.getConfig().environment} mode</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Provider</label>
                        <select value={flashloanConfig.provider} onChange={(e) => handleFlashloanConfigUpdate({ ...flashloanConfig, provider: e.target.value })} className="w-full p-2 border rounded">
                          <option value="aave">Aave</option>
                          <option value="dydx">dYdX</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}