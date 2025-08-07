import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, AlertTriangle, Zap, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfitCalculator({ opportunities = [] }) {
  const [capital, setCapital] = useState(1200);
  const [gasBalance, setGasBalance] = useState(128);
  const [riskLevel, setRiskLevel] = useState([2]); // 1-3 scale
  const [tradesPerDay, setTradesPerDay] = useState([8]);
  const [results, setResults] = useState(null);

  const calculatePotentialProfit = () => {
    // Base parameters
    const avgGasPerTrade = 0.15; // MATIC per trade
    const maxTradesWithGas = Math.floor(gasBalance / avgGasPerTrade);
    const actualTradesPerDay = Math.min(tradesPerDay[0], maxTradesWithGas);
    
    // Risk-adjusted profit margins
    const riskMultipliers = {
      1: { profit: 1.2, success: 0.95, label: "Conservative" }, // Low risk
      2: { profit: 2.4, success: 0.87, label: "Balanced" },    // Medium risk  
      3: { profit: 4.8, success: 0.72, label: "Aggressive" }   // High risk
    };
    
    const risk = riskMultipliers[riskLevel[0]];
    
    // Calculate profits
    const avgProfitPerTrade = (capital * (risk.profit / 100)) * risk.success;
    const dailyProfitGross = avgProfitPerTrade * actualTradesPerDay;
    
    // Fees and costs
    const tradingFees = capital * 0.001 * actualTradesPerDay; // 0.1% per trade
    const gasCosts = actualTradesPerDay * avgGasPerTrade * 0.65; // MATIC price ~$0.65
    const slippage = dailyProfitGross * 0.05; // 5% slippage
    
    const dailyProfitNet = dailyProfitGross - tradingFees - gasCosts - slippage;
    const monthlyProfit = dailyProfitNet * 30;
    const roi = (dailyProfitNet / capital) * 100;
    
    setResults({
      dailyGross: dailyProfitGross,
      dailyNet: dailyProfitNet,
      monthlyProfit,
      roi,
      actualTrades: actualTradesPerDay,
      maxTrades: maxTradesWithGas,
      fees: tradingFees + gasCosts + slippage,
      riskLabel: risk.label,
      successRate: risk.success * 100
    });
  };

  useEffect(() => {
    calculatePotentialProfit();
  }, [capital, gasBalance, riskLevel, tradesPerDay]);

  const getRecommendation = () => {
    if (!results) return null;
    
    if (results.dailyNet < 5) {
      return {
        type: "warning",
        message: "Consider increasing capital or optimizing for higher-margin opportunities",
        color: "bg-amber-100 text-amber-800 border-amber-200"
      };
    } else if (results.dailyNet > 30) {
      return {
        type: "excellent",
        message: "Strong profit potential! Monitor gas costs and market volatility",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200"
      };
    } else {
      return {
        type: "good", 
        message: "Solid returns possible with consistent execution",
        color: "bg-blue-100 text-blue-800 border-blue-200"
      };
    }
  };

  const recommendation = getRecommendation();

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Calculator Inputs */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-orange-500" />
            Profit Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capital">USDC Capital</Label>
              <Input
                id="capital"
                type="number"
                value={capital}
                onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gas">MATIC for Gas</Label>
              <Input
                id="gas"
                type="number"
                value={gasBalance}
                onChange={(e) => setGasBalance(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Risk Level: {riskLevel[0] === 1 ? 'Conservative' : riskLevel[0] === 2 ? 'Balanced' : 'Aggressive'}</Label>
            <Slider
              value={riskLevel}
              onValueChange={setRiskLevel}
              max={3}
              min={1}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Conservative</span>
              <span>Balanced</span>
              <span>Aggressive</span>
            </div>
          </div>

          <div>
            <Label>Target Trades/Day: {tradesPerDay[0]}</Label>
            <Slider
              value={tradesPerDay}
              onValueChange={setTradesPerDay}
              max={20}
              min={2}
              step={2}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>2</span>
              <span>20</span>
            </div>
          </div>

          <Button 
            onClick={calculatePotentialProfit}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500"
          >
            Recalculate
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Projected Returns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results && (
            <div className="space-y-6">
              {/* Main Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                  <div className="text-sm text-emerald-700 font-medium">Daily Profit (Net)</div>
                  <div className="text-2xl font-bold text-emerald-800">
                    ${results.dailyNet.toFixed(2)}
                  </div>
                  <div className="text-xs text-emerald-600">
                    {results.roi.toFixed(2)}% ROI
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
                  <div className="text-sm text-blue-700 font-medium">Monthly Estimate</div>
                  <div className="text-2xl font-bold text-blue-800">
                    ${results.monthlyProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600">
                    {(results.roi * 30).toFixed(1)}% monthly
                  </div>
                </div>
              </div>

              {/* Trading Capacity */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Trading Capacity</span>
                  <Badge variant="outline" className="text-xs">
                    {results.actualTrades}/{results.maxTrades} trades
                  </Badge>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                    style={{ width: `${(results.actualTrades / results.maxTrades) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Gas limits you to {results.maxTrades} trades max
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Gross Profit</span>
                  <span className="font-medium">${results.dailyGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Fees & Costs</span>
                  <span className="font-medium text-red-600">-${results.fees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Success Rate</span>
                  <span className="font-medium">{results.successRate.toFixed(1)}%</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Net Daily Profit</span>
                    <span className="text-emerald-600">${results.dailyNet.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              {recommendation && (
                <div className={`rounded-lg p-3 border ${recommendation.color}`}>
                  <div className="flex items-start gap-2">
                    {recommendation.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="text-sm font-medium">
                      {recommendation.message}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}