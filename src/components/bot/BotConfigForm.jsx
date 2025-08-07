import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Shield, Zap, DollarSign, AlertTriangle } from "lucide-react";

export default function BotConfigForm({ config, onSubmit }) {
  const [formData, setFormData] = useState({
    bot_name: 'DEX Arbitrage Bot',
    max_position_size: 500,
    min_profit_threshold: 0.2,
    max_slippage_percentage: 0.5,
    daily_loss_limit: 50,
    max_gas_per_trade: 0.5,
    max_daily_gas_spend: 10,
    enabled_dexes: ['Uniswap V3', 'QuickSwap', 'Curve'],
    trading_pairs: ['USDC/USDT', 'USDC/DAI'],
    max_daily_trades: 50,
    stop_loss_percentage: 5,
    emergency_stop_enabled: true,
    min_liquidity_usd: 10000,
    max_price_impact: 1.0
  });

  useEffect(() => {
    if (config) {
      setFormData(prev => ({ ...prev, ...config }));
    }
  }, [config]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: Array.isArray(value) ? value : [value] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const availableDexes = ['Uniswap V3', 'QuickSwap', 'SushiSwap', 'Curve', 'Balancer'];
  const availablePairs = ['USDC/USDT', 'USDC/DAI', 'USDT/DAI', 'USDC/WETH', 'DAI/WETH'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Security Warning */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription className="text-amber-800">
          <strong>Security Notice:</strong> This bot will trade with real funds from your MetaMask wallet. 
          Ensure you have your private key stored securely in your local .env file before starting.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Basic Configuration */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Basic Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bot_name">Bot Name</Label>
              <Input
                id="bot_name"
                value={formData.bot_name}
                onChange={(e) => handleInputChange('bot_name', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="max_position_size">Max Position Size ($)</Label>
              <Input
                id="max_position_size"
                type="number"
                min="100"
                max="5000"
                value={formData.max_position_size}
                onChange={(e) => handleInputChange('max_position_size', parseFloat(e.target.value))}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Maximum amount to use per arbitrage trade
              </div>
            </div>

            <div>
              <Label htmlFor="min_profit_threshold">Min Profit Threshold (%)</Label>
              <Input
                id="min_profit_threshold"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={formData.min_profit_threshold}
                onChange={(e) => handleInputChange('min_profit_threshold', parseFloat(e.target.value))}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Minimum profit percentage to execute trades
              </div>
            </div>

            <div>
              <Label htmlFor="max_daily_trades">Max Daily Trades</Label>
              <Input
                id="max_daily_trades"
                type="number"
                min="10"
                max="200"
                value={formData.max_daily_trades}
                onChange={(e) => handleInputChange('max_daily_trades', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="emergency_stop">Emergency Stop</Label>
              <Switch
                id="emergency_stop"
                checked={formData.emergency_stop_enabled}
                onCheckedChange={(checked) => handleInputChange('emergency_stop_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="daily_loss_limit">Daily Loss Limit ($)</Label>
              <Input
                id="daily_loss_limit"
                type="number"
                min="10"
                max="1000"
                value={formData.daily_loss_limit}
                onChange={(e) => handleInputChange('daily_loss_limit', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="max_slippage_percentage">Max Slippage (%)</Label>
              <Input
                id="max_slippage_percentage"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={formData.max_slippage_percentage}
                onChange={(e) => handleInputChange('max_slippage_percentage', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="stop_loss_percentage">Stop Loss (%)</Label>
              <Input
                id="stop_loss_percentage"
                type="number"
                step="0.5"
                min="1"
                max="20"
                value={formData.stop_loss_percentage}
                onChange={(e) => handleInputChange('stop_loss_percentage', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="max_price_impact">Max Price Impact (%)</Label>
              <Input
                id="max_price_impact"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={formData.max_price_impact}
                onChange={(e) => handleInputChange('max_price_impact', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="min_liquidity_usd">Min Pool Liquidity ($)</Label>
              <Input
                id="min_liquidity_usd"
                type="number"
                min="1000"
                max="100000"
                value={formData.min_liquidity_usd}
                onChange={(e) => handleInputChange('min_liquidity_usd', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Gas Management */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Gas Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max_gas_per_trade">Max Gas Per Trade (MATIC)</Label>
              <Input
                id="max_gas_per_trade"
                type="number"
                step="0.1"
                min="0.1"
                max="2"
                value={formData.max_gas_per_trade}
                onChange={(e) => handleInputChange('max_gas_per_trade', parseFloat(e.target.value))}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Skip trades that would cost more than this in gas
              </div>
            </div>

            <div>
              <Label htmlFor="max_daily_gas_spend">Daily Gas Limit (MATIC)</Label>
              <Input
                id="max_daily_gas_spend"
                type="number"
                step="1"
                min="1"
                max="50"
                value={formData.max_daily_gas_spend}
                onChange={(e) => handleInputChange('max_daily_gas_spend', parseFloat(e.target.value))}
                className="mt-1"
              />
              <div className="text-xs text-slate-500 mt-1">
                Bot stops when daily gas usage hits this limit
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-2">Current Gas Estimates</h4>
              <div className="text-sm text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Uniswap V3 Swap:</span>
                  <span>~0.15 MATIC</span>
                </div>
                <div className="flex justify-between">
                  <span>QuickSwap Trade:</span>
                  <span>~0.12 MATIC</span>
                </div>
                <div className="flex justify-between">
                  <span>Curve Exchange:</span>
                  <span>~0.10 MATIC</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Arbitrage (2 swaps):</span>
                  <span>~0.25 MATIC</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DEX & Pair Selection */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Trading Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Enabled DEXs</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableDexes.map(dex => (
                  <div key={dex} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`dex_${dex}`}
                      checked={formData.enabled_dexes.includes(dex)}
                      onChange={(e) => {
                        const newDexes = e.target.checked 
                          ? [...formData.enabled_dexes, dex]
                          : formData.enabled_dexes.filter(d => d !== dex);
                        handleArrayChange('enabled_dexes', newDexes);
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`dex_${dex}`} className="text-sm">{dex}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Trading Pairs</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availablePairs.map(pair => (
                  <div key={pair} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`pair_${pair}`}
                      checked={formData.trading_pairs.includes(pair)}
                      onChange={(e) => {
                        const newPairs = e.target.checked 
                          ? [...formData.trading_pairs, pair]
                          : formData.trading_pairs.filter(p => p !== pair);
                        handleArrayChange('trading_pairs', newPairs);
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`pair_${pair}`} className="text-sm">{pair}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Recommended Setup</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Start with USDC/USDT pairs (lowest volatility)</li>
                <li>• Enable Curve + Uniswap V3 for best liquidity</li>
                <li>• Use conservative slippage (0.3-0.5%)</li>
                <li>• Set daily loss limit based on your risk tolerance</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Reset to Defaults
        </Button>
        <Button 
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          <Settings className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </form>
  );
}