import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function StrategyConfig({ strategy, config = {}, onConfigChange = () => {}, isRunning }) {
  
  const handleNumberChange = (field, value) => {
    const newConfig = { ...config };
    const numValue = parseFloat(value);
    
    if (value === '') {
      newConfig[field] = '';
    } else if (!isNaN(numValue)) {
      newConfig[field] = numValue;
    } else {
       return;
    }
    
    onConfigChange(strategy, newConfig);
  };

  const handleSelectChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    onConfigChange(strategy, newConfig);
  };

  if (!config || Object.keys(config).length === 0) {
      return <div className="text-sm text-slate-500">Loading flashloan configuration...</div>
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div>
          <Label className="text-sm font-medium text-slate-700">Min Profit Threshold (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={config.min_profit_threshold || ''}
            onChange={(e) => handleNumberChange('min_profit_threshold', e.target.value)}
            disabled={isRunning}
            placeholder="e.g., 0.2"
            className="mt-1"
          />
          <p className="text-xs text-slate-500 mt-1">Minimum profit percentage required to execute trade</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Flashloan Amount (USDC)</Label>
          <Input
            type="number"
            step="1000"
            value={config.flashloanAmount || ''}
            onChange={(e) => handleNumberChange('flashloanAmount', e.target.value)}
            disabled={isRunning}
            placeholder="e.g., 50000"
            className="mt-1"
          />
          <p className="text-xs text-slate-500 mt-1">Amount to borrow for each flashloan transaction</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Loan Provider</Label>
          <Select 
            value={config.loanProvider || 'aave'} 
            onValueChange={(value) => handleSelectChange('loanProvider', value)}
            disabled={isRunning}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select loan provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aave">AAVE (Recommended)</SelectItem>
              <SelectItem value="compound">Compound</SelectItem>
              <SelectItem value="dydx">dYdX</SelectItem>
              <SelectItem value="balancer">Balancer</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 mt-1">Lending protocol to borrow funds from</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Daily Loss Limit (USDC)</Label>
          <Input
            type="number"
            step="10"
            value={config.dailyLossLimit || ''}
            onChange={(e) => handleNumberChange('dailyLossLimit', e.target.value)}
            disabled={isRunning}
            placeholder="e.g., 100"
            className="mt-1"
          />
          <p className="text-xs text-slate-500 mt-1">Bot stops trading if daily losses exceed this amount</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Max Slippage (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={config.maxSlippage || ''}
            onChange={(e) => handleNumberChange('maxSlippage', e.target.value)}
            disabled={isRunning}
            placeholder="e.g., 0.5"
            className="mt-1"
          />
          <p className="text-xs text-slate-500 mt-1">Maximum acceptable price slippage during execution</p>
        </div>

        {isRunning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Configuration is locked while the bot is running. Stop the bot to make changes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}