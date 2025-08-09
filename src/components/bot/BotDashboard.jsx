
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Activity, 
  TrendingUp,
  AlertTriangle,
  Zap,
  Clock,
  Info
} from "lucide-react";
import { motion } from "framer-motion";

export default function BotDashboard({ stats, wallet, botConfig, flashloanEnabled, onFlashloanToggle, isRunning }) {
  const [calculatedStats, setCalculatedStats] = useState({
    tradesExecuted: 0,
    successRate: 0,
    totalProfit: 0,
    avgExecutionTime: 0
  });

  const calculateStats = useCallback(() => {
    // Now using stats.trades as the source for execution data
    const trades = (stats?.trades || []).filter(e => e.execution_type === 'trade' || e.execution_type === 'flashloan_trade');
    const successful = trades.filter(e => e.status === 'completed');
    
    setCalculatedStats({
      tradesExecuted: trades.length,
      successRate: trades.length > 0 ? (successful.length / trades.length) * 100 : 0,
      totalProfit: successful.reduce((sum, t) => sum + (t.profit_realized || 0), 0),
      avgExecutionTime: trades.length > 0 ? 
        trades.reduce((sum, t) => sum + (t.execution_time_ms || 0), 0) / trades.length : 0
    });
  }, [stats?.trades]); // Dependency changed to stats.trades

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const getStatusColor = () => {
    if (!isRunning) return 'bg-slate-500';
    return 'bg-emerald-500';
  };

  const getStatusText = () => {
    if (!isRunning) return 'Stopped';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Bot Status Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${getStatusColor()} bg-opacity-20`}>
                <Bot className={`w-6 h-6 ${getStatusColor().replace('bg-', 'text-')}`} />
              </div>
              <div>
                <CardTitle className="text-xl">{botConfig?.bot_name || 'ArbitrageBot'}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isRunning ? 'animate-pulse' : ''}`} />
                  <span className="text-sm text-slate-600">{getStatusText()}</span>
                </div>
              </div>
            </div>
            {/* The Configure button was removed as per the outline */}
          </div>
        </CardHeader>
      </Card>

      {/* Feature Controls */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Feature Controls</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1">
                <label htmlFor="flashloan-toggle" className="font-medium cursor-pointer">Enable Flashloan Trading</label>
                <p className="text-sm text-slate-600 mt-1">
                  This tells the running engine to execute flashloan opportunities. 
                  It does not start or stop the main engine itself.
                </p>
              </div>
              <Switch
                id="flashloan-toggle"
                checked={flashloanEnabled}
                onCheckedChange={onFlashloanToggle}
                disabled={!isRunning}
              />
            </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Trades Executed</p>
                  <h3 className="text-2xl font-bold text-slate-900">{calculatedStats.tradesExecuted}</h3>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Success Rate</p>
                  <h3 className="text-2xl font-bold text-emerald-600">{calculatedStats.successRate.toFixed(1)}%</h3>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Profit</p>
                  <h3 className="text-2xl font-bold text-orange-600">${calculatedStats.totalProfit.toFixed(2)}</h3>
                </div>
                <Zap className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Avg Speed</p>
                  <h3 className="text-2xl font-bold text-purple-600">{(calculatedStats.avgExecutionTime / 1000).toFixed(1)}s</h3>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Current Configuration */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Bot Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Max Position Size</label>
              <div className="text-lg font-semibold">${botConfig?.max_position_size || 500}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Min Profit Threshold</label>
              <div className="text-lg font-semibold">{botConfig?.min_profit_threshold || 2}%</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Risk Level</label>
              <Badge variant={botConfig?.max_risk_level === 'low' ? 'default' : 'secondary'}>
                {botConfig?.max_risk_level || 'medium'}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Daily Trade Limit</label>
              <div className="text-lg font-semibold">{botConfig?.max_daily_trades || 20}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Gas Limit</label>
              <div className="text-lg font-semibold">{botConfig?.gas_limit_matic || 50} MATIC</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Slippage Tolerance</label>
              <div className="text-lg font-semibold">{botConfig?.slippage_tolerance || 0.5}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Balance Display - Moved to its own card */}
      {wallet && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
                <CardTitle>Wallet Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <div className="text-slate-600">USDC Balance</div>
                        <div className="font-semibold">${(wallet.nativeUsdc + wallet.bridgedUsdc).toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-slate-600">MATIC (Gas)</div>
                        <div className="font-semibold">{wallet.matic.toFixed(4)}</div>
                    </div>
                    <div>
                        <div className="text-slate-600">Address</div>
                        <div className="font-mono text-xs">{wallet.address?.substring(0, 10)}...{wallet.address?.slice(-6)}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
