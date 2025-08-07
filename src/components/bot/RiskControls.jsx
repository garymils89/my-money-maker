import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, Fuel, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function RiskControls({ config, dailyStats, onUpdateConfig }) {
  const [localConfig, setLocalConfig] = useState(config || {
    max_slippage_percentage: 0.5,
    daily_loss_limit: 50,
    max_gas_per_trade: 0.5,
    max_daily_gas_spend: 10,
    stop_loss_percentage: 5,
    max_price_impact: 1.0,
    emergency_stop_enabled: true
  });

  const handleConfigChange = (field, value) => {
    setLocalConfig(prev => ({ ...prev, [field]: parseFloat(value) }));
  };

  const handleSave = () => {
    onUpdateConfig(localConfig);
  };

  const getRiskLevel = () => {
    const slippageRisk = localConfig.max_slippage_percentage > 1 ? 'high' : 
                        localConfig.max_slippage_percentage > 0.5 ? 'medium' : 'low';
    const lossRisk = localConfig.daily_loss_limit > 100 ? 'high' : 
                     localConfig.daily_loss_limit > 50 ? 'medium' : 'low';
    
    if (slippageRisk === 'high' || lossRisk === 'high') return 'high';
    if (slippageRisk === 'medium' || lossRisk === 'medium') return 'medium';
    return 'low';
  };

  const riskLevel = getRiskLevel();
  const riskColors = {
    low: 'text-emerald-600',
    medium: 'text-amber-600', 
    high: 'text-red-600'
  };

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Risk Management Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                ${(dailyStats?.loss || 0).toFixed(2)}
              </div>
              <div className="text-sm text-slate-600">Daily Loss</div>
              <Progress 
                value={(dailyStats?.loss || 0) / localConfig.daily_loss_limit * 100} 
                className="h-2 mt-2"
              />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {(dailyStats?.gasUsed || 0).toFixed(2)}
              </div>
              <div className="text-sm text-slate-600">MATIC Used</div>
              <Progress 
                value={(dailyStats?.gasUsed || 0) / localConfig.max_daily_gas_spend * 100} 
                className="h-2 mt-2"
              />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {localConfig.max_slippage_percentage}%
              </div>
              <div className="text-sm text-slate-600">Max Slippage</div>
              <div className={`text-sm font-medium ${riskColors[riskLevel]}`}>
                {riskLevel.toUpperCase()} Risk
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {dailyStats?.trades || 0}
              </div>
              <div className="text-sm text-slate-600">Trades Today</div>
              <div className="text-sm text-emerald-600">
                {((dailyStats?.trades || 0) / 50 * 100).toFixed(0)}% of limit
              </div>
            </div>
          </div>

          {riskLevel === 'high' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-red-800">
                <strong>High Risk Configuration:</strong> Your current settings allow for significant slippage and losses. 
                Consider reducing limits for safer trading.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Risk Configuration */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Trading Limits */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Trading Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="slippage">Max Slippage Percentage</Label>
              <Input
                id="slippage"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={localConfig.max_slippage_percentage}
                onChange={(e) => handleConfigChange('max_slippage_percentage', e.target.value)}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Recommended: 0.5% for stablecoins, 1-2% for volatile pairs
              </div>
            </div>

            <div>
              <Label htmlFor="daily_loss">Daily Loss Limit ($)</Label>
              <Input
                id="daily_loss"
                type="number"
                min="10"
                max="1000"
                value={localConfig.daily_loss_limit}
                onChange={(e) => handleConfigChange('daily_loss_limit', e.target.value)}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Bot will stop trading if daily losses exceed this amount
              </div>
            </div>

            <div>
              <Label htmlFor="stop_loss">Stop Loss Percentage</Label>
              <Input
                id="stop_loss"
                type="number"
                step="0.5"
                min="1"
                max="10"
                value={localConfig.stop_loss_percentage}
                onChange={(e) => handleConfigChange('stop_loss_percentage', e.target.value)}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Individual trade stop loss trigger
              </div>
            </div>

            <div>
              <Label htmlFor="price_impact">Max Price Impact (%)</Label>
              <Input
                id="price_impact"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={localConfig.max_price_impact}
                onChange={(e) => handleConfigChange('max_price_impact', e.target.value)}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Maximum acceptable price impact per trade
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gas Controls */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-orange-500" />
              Gas Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gas_per_trade">Max Gas Per Trade (MATIC)</Label>
              <Input
                id="gas_per_trade"
                type="number"
                step="0.1"
                min="0.1"
                max="2"
                value={localConfig.max_gas_per_trade}
                onChange={(e) => handleConfigChange('max_gas_per_trade', e.target.value)}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Skip trades that would cost more gas than this
              </div>
            </div>

            <div>
              <Label htmlFor="daily_gas">Daily Gas Limit (MATIC)</Label>
              <Input
                id="daily_gas"
                type="number"
                step="1"
                min="5"
                max="50"
                value={localConfig.max_daily_gas_spend}
                onChange={(e) => handleConfigChange('max_daily_gas_spend', e.target.value)}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Total gas budget per day (currently ~$0.65 per MATIC)
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Gas Efficiency Tips</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Trade during low network congestion (early AM EST)</li>
                <li>• Batch multiple opportunities when possible</li>
                <li>• Use Curve for large stablecoin swaps (lower gas)</li>
                <li>• Monitor gas prices and adjust limits accordingly</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">Emergency Stop</span>
              <div className={`w-3 h-3 rounded-full ${localConfig.emergency_stop_enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          <Shield className="w-4 h-4 mr-2" />
          Update Risk Controls
        </Button>
      </div>
    </div>
  );
}