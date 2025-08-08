import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Search,
  ExternalLink,
  Filter,
  Calendar,
  Zap // Added Zap icon for flashloans
} from "lucide-react";
import { motion } from "framer-motion";

export default function BotExecutionLog({ executions = [] }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_date');

  const getExecutionIcon = (type) => {
    switch (type) {
      case 'trade':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'flashloan_trade': // New case for flashloan trade
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'scan':
        return <Search className="w-4 h-4 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'executing':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredExecutions = executions
    .filter(exec => {
      if (filter === 'all') return true;
      return exec.execution_type === filter;
    })
    .filter(exec => {
      if (!searchTerm) return true;
      return JSON.stringify(exec).toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'created_date') {
        return new Date(b.created_date) - new Date(a.created_date);
      }
      return 0;
    });

  const totalTrades = executions.filter(e => e.execution_type === 'trade' || e.execution_type === 'flashloan_trade').length;
  const successfulTrades = executions.filter(e => (e.execution_type === 'trade' || e.execution_type === 'flashloan_trade') && e.status === 'completed').length;
  const totalProfit = executions
    .filter(e => (e.execution_type === 'trade' || e.execution_type === 'flashloan_trade') && e.status === 'completed')
    .reduce((sum, e) => sum + (e.profit_realized || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{totalTrades}</div>
                <div className="text-sm text-slate-600">Total Trades</div>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {totalTrades > 0 ? ((successfulTrades / totalTrades) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-slate-600">Success Rate</div>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  ${totalProfit.toFixed(2)}
                </div>
                <div className="text-sm text-slate-600">Total Profit</div>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{executions.length}</div>
                <div className="text-sm text-slate-600">Total Events</div>
              </div>
              <Activity className="w-8 h-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" />
            Execution Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="trade">Regular Trades</SelectItem>
                <SelectItem value="flashloan_trade">Flashloan Trades</SelectItem> {/* New filter item */}
                <SelectItem value="scan">Scans Only</SelectItem>
                <SelectItem value="alert">Alerts Only</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search executions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Execution List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredExecutions.map((execution, index) => (
              <motion.div
                key={execution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getExecutionIcon(execution.execution_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 capitalize">
                          {execution.execution_type.replace(/_/g, ' ')}
                        </span>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                        {execution.execution_time_ms && (
                          <Badge variant="outline" className="text-xs">
                            {execution.execution_time_ms}ms
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-slate-600 mb-2">
                        {new Date(execution.created_date).toLocaleString()}
                      </div>

                      {/* Execution Details */}
                      {execution.details && (
                        <div className="text-sm">
                          {(execution.execution_type === 'trade' || execution.execution_type === 'flashloan_trade') && execution.details.opportunity && (
                            <div className="space-y-1">
                              <div>
                                <span className="font-medium">Pair:</span> {execution.details.opportunity.pair}
                              </div>
                              <div>
                                <span className="font-medium">Route:</span> {execution.details.opportunity.buyDex} → {execution.details.opportunity.sellDex}
                              </div>
                              <div>
                                <span className="font-medium">Profit:</span> 
                                <span className="text-emerald-600 font-semibold ml-1">
                                  {execution.details.opportunity.profitPercentage?.toFixed(2)}% 
                                  (${execution.details.opportunity.netProfitUsd?.toFixed(2)})
                                </span>
                              </div>
                              {execution.details.loanAmount && ( // Display loan amount if present
                                <div>
                                    <span className="font-medium">Loan:</span> ${execution.details.loanAmount.toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {execution.execution_type === 'scan' && (
                            <div>
                              <span className="font-medium">Opportunities Found:</span> {execution.details.found || 0}
                            </div>
                          )}
                          
                          {execution.execution_type === 'alert' && (
                            <div>
                              <span className="font-medium">{execution.details.alert_type}:</span> {execution.details.message}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Profit/Loss */}
                      {execution.profit_realized && execution.profit_realized !== 0 && (
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className={execution.profit_realized > 0 ? 'text-emerald-600' : 'text-red-600'}>
                            <span className="font-medium">P&L:</span> 
                            {execution.profit_realized > 0 ? '+' : ''}${execution.profit_realized.toFixed(2)}
                          </span>
                          {execution.gas_used && (
                            <span className="text-slate-600">
                              <span className="font-medium">Gas:</span> {execution.gas_used.toFixed(4)} MATIC
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {(execution.execution_type === 'trade' || execution.execution_type === 'flashloan_trade') && execution.status === 'completed' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-slate-500 hover:text-slate-700"
                      onClick={() => window.open('https://polygonscan.com/', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {filteredExecutions.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No executions found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}