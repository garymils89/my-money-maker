
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Settings, Info, Zap } from "lucide-react";

export default function BotConfigForm({ botConfig, flashloanConfig, onConfigUpdate, isRunning }) {
  const [currentBotConfig, setCurrentBotConfig] = useState(botConfig || {});
  const [currentFlashloanConfig, setCurrentFlashloanConfig] = useState(flashloanConfig || {});

  useEffect(() => {
    setCurrentBotConfig(botConfig || {});
    setCurrentFlashloanConfig(flashloanConfig || {});
  }, [botConfig, flashloanConfig]);

  const handleBotConfigChange = (field, value) => {
    const newConfig = { ...currentBotConfig, [field]: value };
    setCurrentBotConfig(newConfig);
    onConfigUpdate(newConfig, currentFlashloanConfig);
  };
  
  const handleFlashloanConfigChange = (field, value) => {
    const newConfig = { ...currentFlashloanConfig, [field]: value };
    setCurrentFlashloanConfig(newConfig);
    onConfigUpdate(currentBotConfig, newConfig);
  };

  // Mock tradingSafety for demonstration purposes, as it's used but not defined or imported in the outline.
  // In a real application, this would be imported from a separate utility file.
  const tradingSafety = {
    getConfig: () => ({
      maxFlashloanAmount: 5000000, // Example value
      environment: 'development', // Example value
    }),
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          Bot & Strategy Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* General Bot Config */}
          <div className="space-y-4">
             <h3 className="text-lg font-semibold border-b pb-2">General Settings</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="bot_name">Bot Name</Label>
                <Input
                  id="bot_name"
                  value={currentBotConfig.bot_name || ''}
                  onChange={(e) => handleBotConfigChange('bot_name', e.target.value)}
                  placeholder="e.g., Aggressive Arbitrage Bot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_profit_threshold">Minimum Profit Threshold (%)</Label>
                <Input
                  id="min_profit_threshold"
                  type="number"
                  step="0.1"
                  value={currentBotConfig.min_profit_threshold || 0}
                  onChange={(e) => handleBotConfigChange('min_profit_threshold', parseFloat(e.target.value))}
                  placeholder="e.g., 0.2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_position_size">Max Position Size (USDC)</Label>
                <Input
                  id="max_position_size"
                  type="number"
                  value={currentBotConfig.max_position_size || 0}
                  onChange={(e) => handleBotConfigChange('max_position_size', parseFloat(e.target.value))}
                  placeholder="e.g., 500"
                />
              </div>
            </div>
          </div>
          
          {/* Flashloan Config */}
           <div className="space-y-4">
             <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
               <Zap className="w-5 h-5 text-purple-500"/>
               Flashloan Strategy
             </h3>
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <Label htmlFor="flashloan_amount">Flashloan Amount (USDC)</Label>
                  <Input 
                    id="flashloan_amount"
                    type="number" 
                    value={currentFlashloanConfig.amount || 0} 
                    onChange={(e) => handleFlashloanConfigChange('amount', parseFloat(e.target.value))}
                    max={tradingSafety.getConfig().maxFlashloanAmount} 
                    placeholder="e.g., 100000"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Max allowed: ${tradingSafety.getConfig().maxFlashloanAmount} in {tradingSafety.getConfig().environment} mode
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flashloan_provider">Provider</Label>
                  <Select 
                    id="flashloan_provider"
                    value={currentFlashloanConfig.provider || 'aave'} 
                    onValueChange={(value) => handleFlashloanConfigChange('provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aave">Aave</SelectItem>
                      <SelectItem value="dydx">dYdX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
           </div>
        </div>

        {isRunning && (
          <Alert variant="default" className="mt-6 border-blue-200 bg-blue-50">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-blue-800">
              Configuration updated live. Changes will apply on the next trading cycle.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
