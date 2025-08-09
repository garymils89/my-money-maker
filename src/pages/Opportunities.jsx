import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Rocket,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Timer,
  DollarSign,
  Hash
} from "lucide-react";
import { motion } from "framer-motion";
import { botStateManager, BotEngine } from "@/components/bot/botState";
import { formatDistanceToNowStrict } from 'date-fns';

export default function DeployPage() {
  const [isLive, setIsLive] = useState(false);
  const [runStartTime, setRunStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('0s');
  const [stats, setStats] = useState({ trades: 0, profit: 0 });
  const [config] = useState(BotEngine.strategies.flashloan.config); // Lock in config at page load

  useEffect(() => {
    const unsubscribe = botStateManager.subscribe(state => {
      const flashloanRunning = state.activeStrategies.flashloan;
      setIsLive(flashloanRunning);

      if (flashloanRunning && !runStartTime) {
        setRunStartTime(new Date());
      } else if (!flashloanRunning && runStartTime) {
        setRunStartTime(null);
      }
      
      const flashloanTrades = state.executions.filter(
        e => e.strategy_type === 'flashloan' && e.status === 'completed'
      );
      
      const totalProfit = flashloanTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);
      
      setStats({
          trades: flashloanTrades.length,
          profit: totalProfit
      });
    });

    return unsubscribe;
  }, [runStartTime]);

  useEffect(() => {
    let timerInterval;
    if (runStartTime) {
      timerInterval = setInterval(() => {
        setElapsedTime(formatDistanceToNowStrict(runStartTime));
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [runStartTime]);

  const handleToggleProductionRun = () => {
    if (isLive) {
      BotEngine.stop('flashloan');
    } else {
      // Use the locked-in config for the production run
      BotEngine.updateConfig('flashloan', config);
      BotEngine.start('flashloan');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Production Deployment
            </h1>
          </div>
          <p className="text-xl text-slate-600 font-medium">
            Start and monitor your live flashloan trading bot evaluation.
          </p>
        </motion.div>

        {/* CRITICAL WARNING */}
        <Alert variant="destructive" className="mb-8 shadow-lg">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="font-semibold">
            To keep the bot running, you must leave this browser tab open and your computer awake. Closing this tab will stop the production run.
          </AlertDescription>
        </Alert>

        {/* Control Panel */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Master Control Panel</CardTitle>
            <CardDescription>Use this button to start or stop the entire production run.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
             <Badge className={`text-lg px-4 py-2 ${isLive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                Status: {isLive ? "LIVE" : "OFFLINE"}
            </Badge>
            <Button
              onClick={handleToggleProductionRun}
              className={`w-full max-w-sm h-16 text-xl font-bold transition-all duration-300 ${isLive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {isLive ? (
                <><PauseCircle className="w-8 h-8 mr-3" /> Stop Production Run</>
              ) : (
                <><PlayCircle className="w-8 h-8 mr-3" /> Start Production Run</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Live Stats & Config */}
        <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Timer /> Live Run Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Time Elapsed:</span>
                        <span className="font-bold text-slate-900">{elapsedTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Completed Trades:</span>
                        <span className="font-bold text-slate-900">{stats.trades}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total P&L:</span>
                        <span className={`font-bold ${stats.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${stats.profit.toFixed(2)}
                        </span>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                    <CardTitle>Locked-in Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Min Profit:</span>
                        <Badge variant="outline">{config.min_profit_threshold}%</Badge>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Loan Amount:</span>
                        <Badge variant="outline">${config.flashloanAmount.toLocaleString()}</Badge>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Provider:</span>
                        <Badge variant="outline" className="capitalize">{config.loanProvider}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Loss Limit:</span>
                        <Badge variant="outline">${config.dailyLossLimit}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Max Slippage:</span>
                        <Badge variant="outline">{config.maxSlippage}%</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}