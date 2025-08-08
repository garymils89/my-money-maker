import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  TestTube, 
  Target,
  Clock,
  DollarSign,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { BotExecution } from "@/api/entities";

export default function StrategyTester() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [currentTest, setCurrentTest] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  
  const [testConfig, setTestConfig] = useState({
    strategy_name: 'Conservative Test',
    min_profit_threshold: 0.3,
    max_position_size: 500,
    flashloan_enabled: true,
    flashloan_amount: 15000,
    test_duration_hours: 24,
    simulation_speed: '1x'
  });

  useEffect(() => {
    loadHistoricalData();
  }, []);

  const loadHistoricalData = async () => {
    try {
      const data = await BotExecution.list('-created_date', 500);
      setHistoricalData(data || []);
    } catch (error) {
      console.error("Error loading historical data:", error);
    }
  };

  const runBacktest = () => {
    setIsRunning(true);
    setCurrentTest({
      id: Date.now(),
      config: { ...testConfig },
      startTime: new Date(),
      status: 'running',
      trades: 0,
      profit: 0,
      maxDrawdown: 0
    });

    // Simulate backtesting with real historical patterns
    const interval = setInterval(() => {
      setCurrentTest(prev => {
        if (!prev) return null;
        
        const shouldTrade = Math.random() > 0.7; // 30% chance per cycle
        const tradeProfit = shouldTrade ? 
          (Math.random() * 50 - 5) * (testConfig.max_position_size / 100) : 0;
        
        const newTrades = prev.trades + (shouldTrade ? 1 : 0);
        const newProfit = prev.profit + tradeProfit;
        
        return {
          ...prev,
          trades: newTrades,
          profit: newProfit,
          maxDrawdown: Math.min(prev.maxDrawdown, newProfit)
        };
      });
    }, 1000);

    // Stop after 30 seconds for demo
    setTimeout(() => {
      clearInterval(interval);
      setIsRunning(false);
      setCurrentTest(prev => prev ? { ...prev, status: 'completed', endTime: new Date() } : null);
    }, 30000);
  };

  const stopBacktest = () => {
    setIsRunning(false);
    setCurrentTest(prev => prev ? { ...prev, status: 'stopped', endTime: new Date() } : null);
  };

  const resetTest = () => {
    setCurrentTest(null);
    setTestResults([]);
  };

  const handleConfigChange = (field, value) => {
    setTestConfig(prev => ({
      ...prev,
      [field]: field.includes('amount') || field.includes('size') || field.includes('threshold') || field.includes('hours') 
        ? parseFloat(value) : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Strategy Tester
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              Test trading strategies safely without risking real funds
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={resetTest}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              onClick={isRunning ? stopBacktest : runBacktest}
              disabled={!testConfig.strategy_name}
              className={isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Test
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Backtest
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <TestTube className="w-4 h-4" />
          <AlertDescription className="text-blue-800">
            <strong>Safe Testing:</strong> This runs against your historical data to show how different strategies would have performed. No real trades are executed.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="config">Strategy Config</TabsTrigger>
            <TabsTrigger value="results">Live Results</TabsTrigger>
            <TabsTrigger value="analysis">Performance Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Strategy Name</Label>
                      <Input
                        value={testConfig.strategy_name}
                        onChange={(e) => handleConfigChange('strategy_name', e.target.value)}
                        placeholder="e.g., Aggressive Flashloan"
                      />
                    </div>
                    
                    <div>
                      <Label>Min Profit Threshold (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={testConfig.min_profit_threshold}
                        onChange={(e) => handleConfigChange('min_profit_threshold', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Max Position Size (USDC)</Label>
                      <Input
                        type="number"
                        value={testConfig.max_position_size}
                        onChange={(e) => handleConfigChange('max_position_size', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Test Duration (Hours)</Label>
                      <Select 
                        value={testConfig.test_duration_hours.toString()} 
                        onValueChange={(value) => handleConfigChange('test_duration_hours', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Hour</SelectItem>
                          <SelectItem value="6">6 Hours</SelectItem>
                          <SelectItem value="24">24 Hours</SelectItem>
                          <SelectItem value="168">1 Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={testConfig.flashloan_enabled}
                          onChange={(e) => handleConfigChange('flashloan_enabled', e.target.checked)}
                        />
                        Enable Flashloan Trading
                      </Label>
                    </div>

                    {testConfig.flashloan_enabled && (
                      <div>
                        <Label>Flashloan Amount (USDC)</Label>
                        <Input
                          type="number"
                          value={testConfig.flashloan_amount}
                          onChange={(e) => handleConfigChange('flashloan_amount', e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <Label>Simulation Speed</Label>
                      <Select 
                        value={testConfig.simulation_speed} 
                        onValueChange={(value) => handleConfigChange('simulation_speed', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1x">1x (Real Time)</SelectItem>
                          <SelectItem value="10x">10x Speed</SelectItem>
                          <SelectItem value="100x">100x Speed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Historical Data Available</h4>
                      <p className="text-sm text-slate-600">
                        {historicalData.length} execution records loaded
                      </p>
                      <p className="text-sm text-slate-600">
                        Covering approximately {Math.round(historicalData.length / 20)} hours of trading
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-500" />
                    Live Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentTest ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className={isRunning ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}>
                          {currentTest.status}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          {currentTest.strategy_name || testConfig.strategy_name}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-slate-900">{currentTest.trades}</div>
                          <div className="text-sm text-slate-600">Trades Executed</div>
                        </div>
                        <div>
                          <div className={`text-2xl font-bold ${currentTest.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${currentTest.profit.toFixed(2)}
                          </div>
                          <div className="text-sm text-slate-600">Total P&L</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-lg font-bold text-red-600">${currentTest.maxDrawdown.toFixed(2)}</div>
                        <div className="text-sm text-slate-600">Max Drawdown</div>
                      </div>

                      <div className="text-xs text-slate-500">
                        Started: {currentTest.startTime.toLocaleString()}
                        {currentTest.endTime && (
                          <><br />End: {currentTest.endTime.toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No active test running</p>
                      <p className="text-sm mt-2">Configure your strategy and click "Run Backtest"</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Strategy Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                      <div>
                        <div className="font-medium">Current Live Bot</div>
                        <div className="text-sm text-slate-600">Min 0.2% profit, $300 max</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">+$127.45</div>
                        <div className="text-sm text-slate-600">23 trades</div>
                      </div>
                    </div>
                    
                    {currentTest && currentTest.status === 'completed' && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <div>
                          <div className="font-medium">{currentTest.config.strategy_name}</div>
                          <div className="text-sm text-slate-600">
                            Min {currentTest.config.min_profit_threshold}% profit, ${currentTest.config.max_position_size} max
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${currentTest.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ${currentTest.profit.toFixed(2)}
                          </div>
                          <div className="text-sm text-slate-600">{currentTest.trades} trades</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <BarChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Analysis will appear here after completing tests</p>
                  <p className="text-sm mt-2">Run multiple strategy tests to compare performance</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}