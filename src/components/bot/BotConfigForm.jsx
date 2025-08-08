import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Info } from "lucide-react";

export default function BotConfigForm({ config, onSubmit }) {
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
    onSubmit(currentConfig);
    alert('Configuration saved!');
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          Bot Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-blue-800">
              These are the core trading parameters. Adjust them to match your desired strategy and risk tolerance.
            </AlertDescription>
          </Alert>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bot_name">Bot Name</Label>
              <Input
                id="bot_name"
                name="bot_name"
                value={currentConfig.bot_name || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min_profit_threshold">Min Profit Threshold (%)</Label>
              <Input
                id="min_profit_threshold"
                name="min_profit_threshold"
                type="number"
                step="0.01"
                placeholder="e.g., 0.2"
                value={currentConfig.min_profit_threshold || ''}
                onChange={handleChange}
              />
               <p className="text-xs text-slate-500">The smallest profit % that will trigger a trade.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_position_size">Max Position Size (USDC)</Label>
              <Input
                id="max_position_size"
                name="max_position_size"
                type="number"
                placeholder="e.g., 500"
                value={currentConfig.max_position_size || ''}
                onChange={handleChange}
              />
              <p className="text-xs text-slate-500">The maximum amount of USDC to use in a single trade.</p>
            </div>

             <div className="space-y-2">
              <Label htmlFor="max_daily_trades">Max Daily Trades</Label>
              <Input
                id="max_daily_trades"
                name="max_daily_trades"
                type="number"
                placeholder="e.g., 50"
                value={currentConfig.max_daily_trades || ''}
                onChange={handleChange}
              />
               <p className="text-xs text-slate-500">Safety limit for the total number of trades per day.</p>
            </div>
          </div>
          
          <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
            Save Configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}