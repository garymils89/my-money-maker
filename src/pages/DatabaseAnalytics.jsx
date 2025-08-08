import React, { useState, useEffect } from "react";
import { BotExecution } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Activity,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

export default function DatabaseAnalytics() {
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadDatabaseData();
  }, [dateRange]);

  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      // Load all execution data
      const allExecutions = await BotExecution.list('-created_date', 10000);
      setExecutions(allExecutions);
      
      // Process analytics
      const processedAnalytics = processExecutionData(allExecutions);
      setAnalytics(processedAnalytics);
      
      console.log(`📊 Loaded ${allExecutions.length} execution records for analysis`);
    } catch (error) {
      console.error("Error loading database data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processExecutionData = (data) => {
    const now = new Date();
    const filteredData = data.filter(exec => {
      const execDate = new Date(exec.created_date);
      const daysDiff = (now - execDate) / (1000 * 60 * 60 * 24);
      
      switch (dateRange) {
        case '1d': return daysDiff <= 1;
        case '7d': return daysDiff <= 7;
        case '30d': return daysDiff <= 30;
        case 'all': return true;
        default: return daysDiff <= 7;
      }
    });

    // Execution type breakdown
    const typeBreakdown = filteredData.reduce((acc, exec) => {
      acc[exec.execution_type] = (acc[exec.execution_type] || 0) + 1;
      return acc;
    }, {});

    // Trade performance analysis
    const trades = filteredData.filter(e => e.execution_type === 'trade' || e.execution_type === 'flashloan_trade');
    const completedTrades = trades.filter(e => e.status === 'completed');
    const failedTrades = trades.filter(e => e.status === 'failed');

    const totalProfit = completedTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);
    const totalLoss = failedTrades.reduce((sum, trade) => sum + Math.abs(trade.profit_realized || 0), 0);
    const totalGasUsed = trades.reduce((sum, trade) => sum + (trade.gas_used || 0), 0);

    // Daily performance
    const dailyData = {};
    filteredData.forEach(exec => {
      const day = new Date(exec.created_date).toDateString();
      if (!dailyData[day]) {
        dailyData[day] = { date: day, executions: 0, trades: 0, profit: 0, gasUsed: 0 };
      }
      dailyData[day].executions++;
      
      if (exec.execution_type === 'trade' || exec.execution_type === 'flashloan_trade') {
        dailyData[day].trades++;
        dailyData[day].profit += exec.profit_realized || 0;
        dailyData[day].gasUsed += exec.gas_used || 0;
      }
    });

    const dailyPerformance = Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        executions: day.executions,
        trades: day.trades,
        profit: parseFloat(day.profit.toFixed(2)),
        gasUsed: parseFloat(day.gasUsed.toFixed(4))
      }));

    // Flashloan vs Regular trade comparison
    const flashloanTrades = completedTrades.filter(t => t.execution_type === 'flashloan_trade');
    const regularTrades = completedTrades.filter(t => t.execution_type === 'trade');

    return {
      summary: {
        totalExecutions: filteredData.length,
        totalTrades: trades.length,
        successRate: trades.length > 0 ? (completedTrades.length / trades.length) * 100 : 0,
        totalProfit,
        totalLoss,
        netPL: totalProfit - totalLoss,
        totalGasUsed,
        avgProfitPerTrade: completedTrades.length > 0 ? totalProfit / completedTrades.length : 0
      },
      typeBreakdown,
      dailyPerformance,
      tradeComparison: {
        flashloan: {
          count: flashloanTrades.length,
          profit: flashloanTrades.reduce((sum, t) => sum + (t.profit_realized || 0), 0),
          avgProfit: flashloanTrades.length > 0 ? flashloanTrades.reduce((sum, t) => sum + (t.profit_realized || 0), 0) / flashloanTrades.length : 0
        },
        regular: {
          count: regularTrades.length,
          profit: regularTrades.reduce((sum, t) => sum + (t.profit_realized || 0), 0),
          avgProfit: regularTrades.length > 0 ? regularTrades.reduce((sum, t) => sum + (t.profit_realized || 0), 0) / regularTrades.length : 0
        }
      }
    };
  };

  const downloadCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'Status', 'Profit', 'Gas Used', 'Details'].join(','),
      ...executions.map(exec => [
        new Date(exec.created_date).toISOString(),
        exec.execution_type,
        exec.status,
        exec.profit_realized || 0,
        exec.gas_used || 0,
        JSON.stringify(exec.details || {}).replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arbitragex-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-lg font-medium">Loading database analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Database Analytics
              </h1>
            </div>
            <p className="text-slate-600 font-medium">
              Complete analysis of {executions.length} execution records
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {['1d', '7d', '30d', 'all'].map((range) => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange(range)}
                >
                  {range === 'all' ? 'All Time' : range.toUpperCase()}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCSV}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDatabaseData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {analytics && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Total Executions</p>
                        <h3 className="text-2xl font-bold text-slate-900">{analytics.summary.totalExecutions.toLocaleString()}</h3>
                        <p className="text-xs text-slate-500 mt-1">{analytics.summary.totalTrades} trades</p>
                      </div>
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Net P&L</p>
                        <h3 className={`text-2xl font-bold ${analytics.summary.netPL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {analytics.summary.netPL >= 0 ? '+' : ''}${analytics.summary.netPL.toFixed(2)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          ${analytics.summary.avgProfitPerTrade.toFixed(2)} avg per trade
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Success Rate</p>
                        <h3 className="text-2xl font-bold text-orange-600">{analytics.summary.successRate.toFixed(1)}%</h3>
                        <Progress value={analytics.summary.successRate} className="mt-2 h-2" />
                      </div>
                      <TrendingUp className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Gas Consumed</p>
                        <h3 className="text-2xl font-bold text-purple-600">{analytics.summary.totalGasUsed.toFixed(2)}</h3>
                        <p className="text-xs text-slate-500 mt-1">MATIC spent</p>
                      </div>
                      <Activity className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts */}
            <Tabs defaultValue="performance" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
                <TabsTrigger value="performance">Daily Performance</TabsTrigger>
                <TabsTrigger value="breakdown">Execution Types</TabsTrigger>
                <TabsTrigger value="comparison">Trade Comparison</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="performance">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Daily Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.dailyPerformance}>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                          <Line type="monotone" dataKey="trades" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="breakdown">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Execution Type Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(analytics.typeBreakdown).map(([type, count], index) => (
                          <div key={type} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="capitalize">{type.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{count}</span>
                              <span className="text-sm text-slate-500">
                                ({((count / analytics.summary.totalExecutions) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Gas Usage by Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.dailyPerformance}>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff'
                              }}
                              formatter={(value) => [`${value} MATIC`, 'Gas Used']}
                            />
                            <Bar dataKey="gasUsed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="comparison">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Flashloan vs Regular Trades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-900">Flashloan Trades</h4>
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-700">{analytics.tradeComparison.flashloan.count}</div>
                              <div className="text-xs text-purple-600">Count</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-700">${analytics.tradeComparison.flashloan.profit.toFixed(2)}</div>
                              <div className="text-xs text-purple-600">Total Profit</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-700">${analytics.tradeComparison.flashloan.avgProfit.toFixed(2)}</div>
                              <div className="text-xs text-purple-600">Avg Profit</div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900">Regular Trades</h4>
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-700">{analytics.tradeComparison.regular.count}</div>
                              <div className="text-xs text-blue-600">Count</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-700">${analytics.tradeComparison.regular.profit.toFixed(2)}</div>
                              <div className="text-xs text-blue-600">Total Profit</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-700">${analytics.tradeComparison.regular.avgProfit.toFixed(2)}</div>
                              <div className="text-xs text-blue-600">Avg Profit</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Performance Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Alert className="border-green-200 bg-green-50">
                          <TrendingUp className="w-4 h-4" />
                          <AlertDescription className="text-green-800">
                            <strong>Best Day:</strong> {analytics.dailyPerformance.length > 0 ? 
                              analytics.dailyPerformance.reduce((max, day) => day.profit > max.profit ? day : max).date : 'N/A'} 
                            with ${analytics.dailyPerformance.length > 0 ? 
                              Math.max(...analytics.dailyPerformance.map(d => d.profit)).toFixed(2) : '0.00'} profit
                          </AlertDescription>
                        </Alert>

                        <Alert className="border-blue-200 bg-blue-50">
                          <BarChart3 className="w-4 h-4" />
                          <AlertDescription className="text-blue-800">
                            <strong>Most Active Day:</strong> {analytics.dailyPerformance.length > 0 ? 
                              analytics.dailyPerformance.reduce((max, day) => day.executions > max.executions ? day : max).date : 'N/A'} 
                            with {analytics.dailyPerformance.length > 0 ? 
                              Math.max(...analytics.dailyPerformance.map(d => d.executions)) : 0} executions
                          </AlertDescription>
                        </Alert>

                        <Alert className="border-purple-200 bg-purple-50">
                          <Activity className="w-4 h-4" />
                          <AlertDescription className="text-purple-800">
                            <strong>Efficiency:</strong> {analytics.summary.totalTrades > 0 ? 
                              (analytics.summary.totalProfit / analytics.summary.totalGasUsed).toFixed(2) : '0.00'} 
                            profit per MATIC gas spent
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="raw">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Recent Database Records
                      <Badge variant="outline">{executions.length} total records</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {executions.slice(0, 50).map((exec, index) => (
                          <div key={exec.id || index} className="p-3 bg-slate-50 rounded-lg border text-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {exec.execution_type}
                                </Badge>
                                <Badge className={exec.status === 'completed' ? 'bg-green-100 text-green-800' : exec.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                                  {exec.status}
                                </Badge>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(exec.created_date).toLocaleString()}
                              </span>
                            </div>
                            {exec.profit_realized && (
                              <div className={`font-medium ${exec.profit_realized > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                P&L: {exec.profit_realized > 0 ? '+' : ''}${exec.profit_realized.toFixed(2)}
                              </div>
                            )}
                            {exec.details && (
                              <div className="text-xs text-slate-600 mt-1 font-mono bg-slate-100 p-2 rounded">
                                {JSON.stringify(exec.details, null, 2).substring(0, 200)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}