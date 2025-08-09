import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { botStateManager, BotEngine } from "../components/bot/botState";
import LiveActivityFeed from "../components/bot/LiveActivityFeed";
import StrategyConfig from "../components/bot/StrategyConfig";
import { Badge } from "@/components/ui/badge";

export default function ArbitragePage() {
  const [isRunning, setIsRunning] = useState(botStateManager.isStrategyRunning('arbitrage'));
  const [executions, setExecutions] = useState([]);
  const [config, setConfig] = useState({
    min_profit_threshold: 0.2,
    max_position_size: 100,
  });
  
  useEffect(() => {
    // Initialize the bot engine with the current config when the component mounts
    BotEngine.updateConfig('arbitrage', config);

    // Subscribe to bot state changes
    const handleStateChange = (state) => {
      setIsRunning(state.activeStrategies.arbitrage);
      // Filter executions relevant to the arbitrage strategy or general alerts/errors
      setExecutions(state.executions.filter(e => e.strategy_type === 'arbitrage' || e.execution_type === 'alert' || e.execution_type === 'error'));
    };
    const unsubscribe = botStateManager.subscribe(handleStateChange);
    
    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs only once on mount

  const handleToggle = () => {
    if (isRunning) {
      BotEngine.stop('arbitrage');
    } else {
      BotEngine.start('arbitrage');
    }
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig); // Update local state
    BotEngine.updateConfig('arbitrage', newConfig); // Push new config to the bot engine
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Standard Arbitrage Bot
            </h1>
            <p className="text-slate-600 mt-2 font-medium">Monitors for and executes simple, unleveraged arbitrage opportunities.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "bg-emerald-100 text-emerald-800" : ""}>
              {isRunning ? "ACTIVE" : "STOPPED"}
            </Badge>
            <Button
              onClick={handleToggle}
              className={`w-40 transition-all duration-300 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {isRunning ? <><Pause className="w-4 h-4 mr-2" /> Stop Bot</> : <><Play className="w-4 h-4 mr-2" /> Start Bot</>}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6"> {/* New div to group cards with vertical spacing */}
                <Card>
                    <CardHeader>
                        <CardTitle>Strategy Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>This bot performs traditional arbitrage by buying an asset on one exchange and simultaneously selling it on another for a higher price. It uses your own capital and is generally considered lower risk.</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li><strong>Risk Level:</strong> Low to Medium</li>
                            <li><strong>Capital Requirement:</strong> Your own funds</li>
                            <li><strong>Pros:</strong> Simpler, less risk of total loss.</li>
                            <li><strong>Cons:</strong> Profits limited by your capital size.</li>
                        </ul>
                    </CardContent>
                </Card>
                <StrategyConfig 
                  config={config}
                  onConfigChange={handleConfigChange}
                  strategyType="arbitrage"
                  isRunning={isRunning}
                />
            </div>
            <LiveActivityFeed executions={executions} isRunning={isRunning} />
        </div>
      </div>
    </div>
  );
}