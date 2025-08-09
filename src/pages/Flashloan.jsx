import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Pause } from "lucide-react";
import { botStateManager, BotEngine } from "@/components/bot/botState";
import LiveActivityFeed from "@/components/bot/LiveActivityFeed";
import StrategyConfig from "@/components/bot/StrategyConfig";
import { Badge } from "@/components/ui/badge";

export default function FlashloanPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [config, setConfig] = useState({
    min_profit_threshold: 0.2,
    flashloanAmount: 5000,
  });

  useEffect(() => {
    const unsubscribe = botStateManager.subscribe((state) => {
      setIsRunning(state.activeStrategies.flashloan || false);
      setExecutions(state.executions.filter(e => 
        e.strategy_type === 'flashloan' || 
        e.execution_type === 'alert' || 
        e.execution_type === 'error'
      ));
    });
    
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    if (isRunning) {
      console.log("🛑 User clicked STOP button");
      BotEngine.stop('flashloan');
    } else {
      console.log("🚀 User clicked START button"); 
      BotEngine.start('flashloan');
    }
  };

  const handleConfigChange = (newConfig) => {
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
            <p className="text-slate-600 mt-2 font-medium">Executes complex, leveraged arbitrage using borrowed funds from lending protocols.</p>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}>
              {isRunning ? "LIVE" : "STOPPED"}
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
                        <CardTitle>Strategy Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>This advanced bot borrows millions in a single transaction (a flashloan), performs an arbitrage trade, and re-pays the loan instantly, keeping the profit. This is high-risk, high-reward.</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li><strong>Risk Level:</strong> High</li>
                            <li><strong>Capital Requirement:</strong> Gas fees only</li>
                            <li><strong>Pros:</strong> Massive potential returns, not limited by your capital size.</li>
                            <li><strong>Cons:</strong> Complex, smart contract risk, failed transactions lose gas.</li>
                        </ul>
                    </CardContent>
                </Card>
                <StrategyConfig 
                  config={config}
                  onConfigChange={handleConfigChange}
                  strategyType="flashloan"
                  isRunning={isRunning}
                />
            </div>
            <LiveActivityFeed executions={executions} isRunning={isRunning} />
        </div>
      </div>
    </div>
  );
}