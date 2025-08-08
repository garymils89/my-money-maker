import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Zap,
  TrendingUp,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BotExecution } from "@/api/entities";

export default function LiveActivityFeed({ isRunning }) {
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await BotExecution.list('-created_date', 25);
        setExecutions(data);
        console.log("LiveActivityFeed: Loaded", data.length, "executions from database");
      } catch (error) {
        console.error("LiveActivityFeed: Error fetching data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getExecutionIcon = (execution) => {
    const { execution_type, status, details } = execution;
    if (execution_type === 'flashloan_trade') {
      return status === 'completed' ? <Zap className="w-4 h-4 text-purple-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (execution_type === 'trade') {
      return status === 'completed' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (execution_type === 'alert') {
        switch (details?.alert_type) {
            case 'Opportunity Found': return <Lightbulb className="w-4 h-4 text-yellow-500" />;
            case 'Flashloan Analysis': return <Info className="w-4 h-4 text-blue-500" />;
            case 'Decision': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'Scan Result': return <Search className="w-4 h-4 text-slate-500" />;
            default: return <Info className="w-4 h-4 text-slate-500" />;
        }
    }
    if (execution_type === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-slate-500" />;
  };

  const getStatusColor = (execution) => {
    const { execution_type, status } = execution;
    if (status === 'completed' && (execution_type === 'trade' || execution_type === 'flashloan_trade')) return 'bg-emerald-100 text-emerald-800';
    if (status === 'failed') return 'bg-red-100 text-red-800';
    if (execution_type === 'alert') return 'bg-blue-50 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-600">Loading bot activity...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Live Bot Activity ({executions.length} events)
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-sm text-slate-600">{isRunning ? 'Active' : 'Stopped'}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[450px]">
          <AnimatePresence>
            {executions.length > 0 ? (
              <div className="space-y-3">
                {executions.map((execution) => (
                  <motion.div
                    key={execution.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getExecutionIcon(execution)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900 capitalize text-sm">
                          {execution.execution_type === 'alert' ? execution.details?.alert_type : execution.execution_type.replace('_', ' ')}
                        </span>
                        <Badge className={getStatusColor(execution)}>
                          {execution.status}
                        </Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {formatTime(execution.created_date)}
                        </span>
                      </div>

                      {/* Trade Details (Flashloan and Regular) */}
                      {(execution.execution_type === 'trade' || execution.execution_type === 'flashloan_trade') && (
                         <div className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">
                              {execution.details?.opportunity?.pair}
                              {execution.execution_type === 'flashloan_trade' && execution.details?.loanAmount &&
                                ` • $${execution.details.loanAmount?.toLocaleString()} loan`
                              }
                            </span>
                            <span className={`font-bold flex items-center gap-1 ${ (execution.profit_realized || 0) > 0 ? 'text-emerald-600' : 'text-red-600' }`}>
                              <DollarSign className="w-3 h-3" />
                              {(execution.profit_realized || 0) > 0 ? '+' : ''}
                              {(execution.profit_realized || 0).toFixed(2)}
                            </span>
                          </div>
                          {execution.execution_type === 'flashloan_trade' && execution.details && (
                            <div className="text-xs text-slate-500">
                              {execution.details.opportunity?.buyDex} → {execution.details.opportunity?.sellDex} •
                              Fee: ${execution.details.loanFee?.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Alert Details */}
                      {execution.execution_type === 'alert' && (
                        <div className="text-sm text-slate-600">
                          {execution.details?.message}
                        </div>
                      )}
                      
                      {/* Error Details */}
                      {execution.execution_type === 'error' && (
                        <div className="text-sm text-red-600">
                          {execution.error_message}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No bot activity yet</p>
                <p className="text-sm text-slate-500">
                  {isRunning ? 'Waiting for first scan cycle...' : 'Start the bot to begin trading'}
                </p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}