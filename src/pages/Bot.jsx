
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Pause, BarChart3, Activity, Shield, Settings, SlidersHorizontal, History } from "lucide-react";
import { botStateManager, BotEngine } from "@/components/bot/botState";
import LiveActivityFeed from "@/components/bot/LiveActivityFeed";
import StrategyConfig from "@/components/bot/StrategyConfig";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotExecution } from "@/api/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Sub-Components for Tabs ---

const BotDashboard = ({ stats }) => (
    <Card>
        <CardHeader><CardTitle>Bot Performance</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">Today's P&L</p>
                <p className={`text-xl font-bold ${stats.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${stats.pnl.toFixed(2)}</p>
            </div>
             <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">Total Trades</p>
                <p className="text-xl font-bold">{stats.trades}</p>
            </div>
             <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">Success Rate</p>
                <p className="text-xl font-bold">{stats.successRate.toFixed(1)}%</p>
            </div>
             <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">Avg. Profit</p>
                <p className="text-xl font-bold text-emerald-600">${stats.avgProfit.toFixed(2)}</p>
            </div>
        </CardContent>
    </Card>
);

const HistoryLog = () => {
    const [history, setHistory] = useState([]);
    useEffect(() => {
        const loadHistory = async () => {
            const data = await BotExecution.list('-created_date', 100);
            // FIX: Remove filter to show all activity
            setHistory(data);
        };
        loadHistory();
        
        // Refresh every 30 seconds
        const interval = setInterval(loadHistory, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card>
            <CardHeader><CardTitle>Recent Bot History</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Profit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length > 0 ? history.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{format(new Date(item.created_date), 'HH:mm:ss')}</TableCell>
                                <TableCell><Badge variant="outline">{item.execution_type}</Badge></TableCell>
                                <TableCell><Badge variant={item.status === 'completed' ? 'default' : 'destructive'}>{item.status}</Badge></TableCell>
                                <TableCell className={item.profit_realized >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                    {item.profit_realized !== null && item.profit_realized !== undefined ? `$${item.profit_realized.toFixed(2)}` : 'N/A'}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan="4" className="text-center">No history yet. Start the bot.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const RiskControls = () => (
    <Card>
        <CardHeader><CardTitle>Risk Controls</CardTitle></CardHeader>
        <CardContent className="space-y-4">
             <div>
                <Label>Daily Loss Limit (USDC)</Label>
                <Input defaultValue="50" disabled />
            </div>
            <div>
                <Label>Max Slippage (%)</Label>
                <Input defaultValue="0.5" disabled />
            </div>
        </CardContent>
    </Card>
);

const FlashloanControls = ({ config, onConfigChange, isRunning }) => (
     <Card>
        <CardHeader><CardTitle>Flashloan Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Label>Loan Provider</Label>
                <Select defaultValue="aave" disabled={isRunning}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="aave">AAVE V3</SelectItem>
                        <SelectItem value="maker">MakerDAO</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label>Loan Amount (USDC)</Label>
                <Input 
                    type="number" 
                    value={config.flashloanAmount} 
                    onChange={(e) => onConfigChange({ ...config, flashloanAmount: parseFloat(e.target.value) })}
                    disabled={isRunning} 
                />
            </div>
        </CardContent>
    </Card>
);


// --- Main Bot Page Component ---

export default function BotPage() {
  const [isFlashloanRunning, setIsFlashloanRunning] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [botStats, setBotStats] = useState({ pnl: 0, trades: 0, successRate: 0, avgProfit: 0 });
  const [flashloanConfig, setFlashloanConfig] = useState({
    min_profit_threshold: 0.2,
    flashloanAmount: 5000,
  });

  useEffect(() => {
    const unsubscribe = botStateManager.subscribe((state) => {
      setIsFlashloanRunning(state.activeStrategies.flashloan || false);
      
      const relevantExecutions = state.executions.filter(e => 
        e.strategy_type === 'flashloan' || ['alert', 'error', 'scan'].includes(e.execution_type)
      ).slice(0, 50); // Keep the feed snappy
      setExecutions(relevantExecutions);

      // Calculate stats
      const trades = state.executions.filter(e => e.execution_type === 'flashloan_trade');
      const successfulTrades = trades.filter(t => t.status === 'completed');
      const totalPnl = successfulTrades.reduce((sum, t) => sum + (t.profit_realized || 0), 0);
      
      setBotStats({
          pnl: totalPnl,
          trades: trades.length,
          successRate: trades.length > 0 ? (successfulTrades.length / trades.length) * 100 : 0,
          avgProfit: successfulTrades.length > 0 ? totalPnl / successfulTrades.length : 0
      });
    });
    
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    if (isFlashloanRunning) {
      BotEngine.stop('flashloan');
    } else {
      BotEngine.start('flashloan');
    }
  };

  const handleConfigChange = (newConfig) => {
    setFlashloanConfig(newConfig);
    BotEngine.updateConfig('flashloan', newConfig);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">
              Flashloan Arbitrage Bot
            </h1>
            <p className="text-slate-600 mt-2 font-medium">Executes complex, leveraged arbitrage using borrowed funds from lending protocols.</p>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant={isFlashloanRunning ? "default" : "secondary"} className={isFlashloanRunning ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600"}>
              {isFlashloanRunning ? "LIVE" : "STOPPED"}
            </Badge>
            <Button
              onClick={handleToggle}
              className={`w-40 transition-all duration-300 ${isFlashloanRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}
            >
              {isFlashloanRunning ? <><Pause className="w-4 h-4 mr-2" /> Stop Bot</> : <><Zap className="w-4 h-4 mr-2" /> Start Bot</>}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-2"/>Dashboard</TabsTrigger>
                <TabsTrigger value="feed"><Activity className="w-4 h-4 mr-2"/>Live Feed</TabsTrigger>
                <TabsTrigger value="config"><Settings className="w-4 h-4 mr-2"/>Configuration</TabsTrigger>
                <TabsTrigger value="risk"><Shield className="w-4 h-4 mr-2"/>Risk Controls</TabsTrigger>
                <TabsTrigger value="history"><History className="w-4 h-4 mr-2"/>History</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="mt-6">
                <BotDashboard stats={botStats}/>
            </TabsContent>
            <TabsContent value="feed" className="mt-6">
                <LiveActivityFeed executions={executions} isRunning={isFlashloanRunning} />
            </TabsContent>
            <TabsContent value="config" className="mt-6 grid md:grid-cols-2 gap-6">
                <StrategyConfig 
                    config={flashloanConfig}
                    onConfigChange={handleConfigChange}
                    strategyType="flashloan"
                    isRunning={isFlashloanRunning}
                />
                <FlashloanControls 
                    config={flashloanConfig}
                    onConfigChange={handleConfigChange}
                    isRunning={isFlashloanRunning}
                />
            </TabsContent>
            <TabsContent value="risk" className="mt-6">
                <RiskControls />
            </TabsContent>
            <TabsContent value="history" className="mt-6">
                <HistoryLog />
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
