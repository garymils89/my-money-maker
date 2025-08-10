
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Pause, Settings } from "lucide-react";
import { botStateManager, BotEngine } from "@/components/bot/botState";
import LiveActivityFeed from "@/components/bot/LiveActivityFeed";
import StrategyConfig from "@/components/bot/StrategyConfig";
import { Badge } from "@/components/ui/badge";

export default function FlashloanPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [config, setConfig] = useState({
    minProfitThreshold: 5, // Changed from min_profit_threshold and now represents dollars
    flashloanAmount: 50000,
    loanProvider: 'aave',
    dailyLossLimit: 100,
    maxSlippage: 0.5
  });

  useEffect(() => {
    // Initialize config with BotEngine
    BotEngine.updateConfig('flashloan', config);
    
    const unsubscribe = botStateManager.subscribe((state) => {
      setIsRunning(state.activeStrategies.flashloan || false);
      setExecutions(state.executions.filter(e => 
        e.strategy_type === 'flashloan' || 
        e.execution_type === 'alert' || 
        e.execution_type === 'error' ||
        e.execution_type === 'scan'
      ));
    });
    
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    if (isRunning) {
      console.log("🛑 User clicked STOP button");
      BotEngine.stop('flashloan');
    } else {
      console.log("🚀 User clicked START button with config:", config); 
      BotEngine.start('flashloan');
    }
  };

  const handleConfigChange = (strategy, newConfig) => {
    console.log("📝 Config updated:", newConfig);
    setConfig(newConfig);
    BotEngine.updateConfig('flashloan', newConfig);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">
              Flashloan Arbitrage Bot
            </h1>
            <p className="text-slate-600 mt-2 font-medium">High-leverage arbitrage using borrowed capital from DeFi lending protocols</p>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}>
              {isRunning ? "LIVE TRADING" : "STOPPED"}
            </Badge>
            <Button
              onClick={handleToggle}
              className={`w-40 transition-all duration-300 ${isRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
            >
              {isRunning ? <><Pause className="w-4 h-4 mr-2" /> Stop Bot</> : <><Zap className="w-4 h-4 mr-2" /> Start Bot</>}
            </Button>
          </div>
        </div>
        
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-purple-500" />
                          Flashloan Strategy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-700 mb-4">
                          Borrows large amounts of capital (flash loans) from lending protocols like AAVE, 
                          executes arbitrage trades across DEXs, and repays the loan in the same transaction - 
                          keeping the profit.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="font-semibold text-slate-900">Risk Level</div>
                            <div className="text-red-600">High</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="font-semibold text-slate-900">Capital Required</div>
                            <div className="text-emerald-600">Gas fees only</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="font-semibold text-slate-900">Profit Potential</div>
                            <div className="text-purple-600">Very High</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-3">
                            <div className="font-semibold text-slate-900">Loan Provider</div>
                            <div className="text-blue-600">{config.loanProvider?.toUpperCase() || 'AAVE'}</div>
                          </div>
                        </div>
                    </CardContent>
                </Card>
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Strategy Configuration</h3>
                  </div>
                  <StrategyConfig 
                    strategy="flashloan"
                    config={config}
                    onConfigChange={handleConfigChange}
                    isRunning={isRunning}
                  />
                </div>
            </div>
            
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live Activity Feed
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[600px]">
                  <LiveActivityFeed executions={executions} isRunning={isRunning} />
                </CardContent>
              </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
