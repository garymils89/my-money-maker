import React, { useState, useEffect } from "react";
import { BotExecution } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Database, Download, ExternalLink, Calendar as CalendarIcon, FileText, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays } from 'date-fns';
import { botStateManager } from "@/components/bot/botState";

const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
    executing: 'bg-blue-100 text-blue-800',
    default: 'bg-slate-100 text-slate-800',
  };
  const text = status || 'unknown';
  return <Badge className={styles[status] || styles.default}>{text}</Badge>;
};

export default function Portfolio() {
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalProfit: 0,
    successRate: 0,
    avgProfit: 0
  });
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  useEffect(() => {
    loadData();
    
    // Subscribe to live bot state for real-time updates
    const unsubscribe = botStateManager.subscribe(state => {
      // Add live executions to our data
      const liveFlashloanTrades = state.executions.filter(e => 
        e.strategy_type === 'flashloan' && 
        (e.execution_type === 'trade' || e.execution_type === 'flashloan_trade')
      );
      
      if (liveFlashloanTrades.length > 0) {
        setExecutions(prev => {
          const combined = [...liveFlashloanTrades, ...prev];
          // Remove duplicates based on client_id or id
          const unique = combined.filter((item, index, self) => 
            index === self.findIndex(i => (i.id || i.client_id) === (item.id || item.client_id))
          );
          return unique;
        });
      }
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load from database
      const allRecords = await BotExecution.list('-created_date', 100);
      
      // Filter for flashloan trades only
      const flashloanTrades = allRecords.filter(record => 
        record.strategy_type === 'flashloan' && 
        (record.execution_type === 'trade' || record.execution_type === 'flashloan_trade')
      );
      
      // Apply date filter
      const filteredRecords = flashloanTrades.filter(record => {
        if (!record.created_date) return false;
        
        try {
          const recordDate = new Date(record.created_date);
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return recordDate >= fromDate && recordDate <= toDate;
        } catch (error) {
          console.error("Error parsing date for record:", record);
          return false;
        }
      });

      setExecutions(filteredRecords);
      
      // Calculate statistics
      const completedTrades = filteredRecords.filter(e => e.status === 'completed');
      const totalProfit = completedTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);
      const successRate = filteredRecords.length > 0 ? (completedTrades.length / filteredRecords.length) * 100 : 0;
      const avgProfit = completedTrades.length > 0 ? totalProfit / completedTrades.length : 0;
      
      setStats({
        totalTrades: filteredRecords.length,
        totalProfit: totalProfit,
        successRate: successRate,
        avgProfit: avgProfit
      });
      
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      setExecutions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (executions.length === 0) {
      alert("No flashloan trading data to export.");
      return;
    }

    const headers = ['Date', 'Time', 'Status', 'Loan Provider', 'Loan Amount', 'Profit ($)', 'ROI (%)', 'Gas Used', 'Details'];
    const rows = executions.map(exec => {
      const timestamp = exec.created_date || exec.client_timestamp || Date.now();
      const safeDate = new Date(Number(timestamp));
      const loanAmount = exec.details?.loanAmount || 0;
      const roi = loanAmount > 0 && exec.profit_realized ? ((exec.profit_realized / loanAmount) * 100) : 0;
      
      return [
        format(safeDate, 'yyyy-MM-dd'),
        format(safeDate, 'HH:mm:ss'),
        exec.status || 'unknown',
        exec.details?.loanProvider || 'unknown',
        loanAmount.toLocaleString(),
        exec.profit_realized !== null && exec.profit_realized !== undefined ? exec.profit_realized.toFixed(2) : 'N/A',
        roi.toFixed(3) + '%',
        exec.gas_used || 'N/A',
        exec.details?.tx_hash ? exec.details.tx_hash : exec.details?.message || 'N/A'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      link.setAttribute('download', `flashloan-portfolio-${fromDate}-to-${toDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Flashloan Portfolio
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              Track your flashloan trading performance and generate detailed reports
            </p>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-emerald-500" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">${stats.totalProfit.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">Total Profit</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalTrades}</div>
                  <div className="text-sm text-slate-600">Total Trades</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-slate-600">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-amber-500" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">${stats.avgProfit.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">Avg Profit</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Range and Export */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={dateRange.from} 
                      onSelect={(d) => setDateRange(prev => ({...prev, from: d}))} 
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={dateRange.to} 
                      onSelect={(d) => setDateRange(prev => ({...prev, to: d}))} 
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Button onClick={loadData} disabled={isLoading} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  {isLoading ? 'Loading...' : 'Update Report'}
                </Button>
              </div>

              <div>
                <Button onClick={downloadCSV} disabled={executions.length === 0} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV ({executions.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Flashloan Trading History ({executions.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {executions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Profit ($)</TableHead>
                    <TableHead>ROI (%)</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((exec, index) => {
                    const timestamp = exec.created_date || exec.client_timestamp || Date.now();
                    const safeDate = new Date(Number(timestamp));
                    const loanAmount = exec.details?.loanAmount || 0;
                    const roi = loanAmount > 0 && exec.profit_realized ? ((exec.profit_realized / loanAmount) * 100) : 0;
                    
                    return (
                      <TableRow key={exec.id || exec.client_id || index}>
                        <TableCell>{format(safeDate, 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{format(safeDate, 'HH:mm:ss')}</TableCell>
                        <TableCell><StatusBadge status={exec.status} /></TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {exec.details?.loanProvider || 'AAVE'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">${loanAmount.toLocaleString()}</TableCell>
                        <TableCell className={exec.profit_realized >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {exec.profit_realized !== null && exec.profit_realized !== undefined 
                            ? `$${exec.profit_realized.toFixed(2)}` 
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell className="font-mono">
                          {roi > 0 ? `+${roi.toFixed(3)}%` : roi < 0 ? `${roi.toFixed(3)}%` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {exec.details?.tx_hash ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a 
                                href={`https://polygonscan.com/tx/${exec.details.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Tx
                              </a>
                            </Button>
                          ) : (
                            <span className="text-sm text-slate-500">
                              {exec.details?.message || 'No details'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {isLoading ? 'Loading portfolio data...' : 'No flashloan trades found'}
                </h3>
                <p className="text-slate-600">
                  {isLoading 
                    ? 'Please wait while we fetch your trading history...' 
                    : 'Start the flashloan bot to generate trading data, or adjust your date range.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}