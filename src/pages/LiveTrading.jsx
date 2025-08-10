import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Shield, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  DollarSign 
} from "lucide-react";
import { motion } from "framer-motion";
import LiveTradingControls from "../components/bot/LiveTradingControls";
import { botStateManager } from "../components/bot/botState";

export default function LiveTradingPage() {
  const [liveExecutions, setLiveExecutions] = useState([]);
  const [totalLiveProfit, setTotalLiveProfit] = useState(0);
  const [simulationStats, setSimulationStats] = useState({ trades: 0, profit: 0 });

  useEffect(() => {
    const unsubscribe = botStateManager.subscribe(state => {
      // Get simulation data for comparison
      const simTrades = state.executions.filter(e => 
        e.execution_type === 'flashloan_trade' && e.status === 'completed'
      );
      const simProfit = simTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);
      
      setSimulationStats({ trades: simTrades.length, profit: simProfit });
    });

    return unsubscribe;
  }, []);

  const handleLiveTradeExecuted = (result) => {
    const newExecution = {
      id: Date.now(),
      timestamp: new Date(),
      profit: result.profit,
      txHash: result.txHash,
      success: result.success,
      error: result.error
    };
    
    setLiveExecutions(prev => [newExecution, ...prev]);
    
    if (result.success) {
      setTotalLiveProfit(prev => prev + result.profit);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-lg">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Live Trading Launch
            </h1>
          </div>
          <p className="text-xl text-slate-600 font-medium">
            Convert your simulation profits into real money
          </p>
        </motion.div>

        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <Shield className="w-4 h-4" />
          <AlertDescription className="text-amber-800">
            <strong>Your Simulation Results:</strong> {simulationStats.trades} successful trades generating 
            ${simulationStats.profit.toFixed(2)} in simulated profits. Ready to make this real?
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Trading Controls */}
          <div className="lg:col-span-2">
            <LiveTradingControls onLiveTradeExecuted={handleLiveTradeExecuted} />
          </div>

          {/* Live Results */}
          <div>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Live Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      ${totalLiveProfit.toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-600">Total Live Profit</div>
                  </div>

                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">
                      {liveExecutions.filter(e => e.success).length}
                    </div>
                    <div className="text-sm text-slate-600">Successful Live Trades</div>
                  </div>

                  {liveExecutions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Recent Live Trades:</h4>
                      {liveExecutions.slice(0, 5).map(execution => (
                        <div 
                          key={execution.id}
                          className="flex justify-between items-center p-2 bg-white rounded border"
                        >
                          <div>
                            <Badge className={execution.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {execution.success ? 'SUCCESS' : 'FAILED'}
                            </Badge>
                            <div className="text-xs text-slate-500">
                              {execution.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${execution.success ? 'text-green-600' : 'text-red-600'}`}>
                              ${execution.profit?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comparison Stats */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Simulation Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{simulationStats.trades}</div>
                  <div className="text-sm text-blue-700">Simulated Trades</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">${simulationStats.profit.toFixed(2)}</div>
                  <div className="text-sm text-blue-700">Simulated Profit</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Live Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">{liveExecutions.length}</div>
                  <div className="text-sm text-green-700">Live Trades</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">${totalLiveProfit.toFixed(2)}</div>
                  <div className="text-sm text-green-700">Real Profit</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}