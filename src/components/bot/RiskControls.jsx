import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export default function RiskControls({ config, dailyStats, onUpdateConfig }) {
  const [currentConfig, setCurrentConfig] = useState(config || {});

  useEffect(() => {
    setCurrentConfig(config || {});
  }, [config]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setCurrentConfig(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateConfig(currentConfig);
    alert('Risk controls saved!');
  };

  const lossLimitProgress = (dailyStats.loss / (currentConfig.daily_loss_limit || 1)) * 100;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Risk Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="daily_loss_limit">Daily Loss Limit (USDC)</Label>
              <Input
                id="daily_loss_limit"
                name="daily_loss_limit"
                type="number"
                placeholder="e.g., 50"
                value={currentConfig.daily_loss_limit || ''}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-500">The bot will automatically stop if losses exceed this amount in a day.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_slippage_percentage">Max Slippage Tolerance (%)</Label>
              <Input
                id="max_slippage_percentage"
                name="max_slippage_percentage"
                type="number"
                step="0.1"
                placeholder="e.g., 0.5"
                value={currentConfig.max_slippage_percentage || ''}
                onChange={handleChange}
              />
               <p className="text-xs text-slate-500">The maximum price change allowed during a trade's execution.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stop_loss_percentage">Stop Loss Per Trade (%)</Label>
              <Input
                id="stop_loss_percentage"
                name="stop_loss_percentage"
                type="number"
                step="0.5"
                placeholder="e.g., 5"
                value={currentConfig.stop_loss_percentage || ''}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-500">Automatically exit a single trade if it drops by this percentage (if applicable).</p>
            </div>
            
            <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-orange-500">
              Save Risk Controls
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Daily Performance Monitor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
           <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
             Your Daily Loss Limit is your most important safety feature. It prevents catastrophic losses during unexpected market events.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label>Today's P&L</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center text-emerald-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>Profit: ${dailyStats.profit.toFixed(2)}</span>
                </div>
                <div className="flex items-center text-red-600">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  <span>Loss: ${dailyStats.loss.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label>Daily Loss Limit Usage</Label>
                <span className="text-sm font-medium">${dailyStats.loss.toFixed(2)} / ${currentConfig.daily_loss_limit || '0'}</span>
              </div>
              <Progress value={lossLimitProgress} />
               <p className="text-xs text-slate-500 mt-1">If this reaches 100%, the bot will halt trading for the day.</p>
            </div>
             <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-600">Total Trades Today:</span>
                    <span className="font-medium">{dailyStats.trades}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">Total Gas Used:</span>
                    <span className="font-medium">{dailyStats.gasUsed.toFixed(4)} MATIC</span>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}