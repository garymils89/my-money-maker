
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, TrendingUp, AlertTriangle, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function BotExecutionLog({ executions = [] }) {
  const getExecutionIcon = (type) => {
    switch (type) {
      case 'trade': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'flashloan_trade': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'executing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          Execution History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {executions.length > 0 ? (
              executions.map((execution, index) => (
                <motion.div
                  key={execution.client_id || execution.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50"
                >
                  <div className="flex items-start gap-3">
                    {getExecutionIcon(execution.execution_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900 capitalize">
                          {execution.execution_type.replace('_', ' ')}
                        </span>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-slate-600 mb-2">
                        {new Date(execution.created_date).toLocaleString()}
                      </div>
                      
                      {execution.details && (
                        <div className="text-xs text-slate-500">
                          {execution.details.opportunity?.pair && (
                            <span>Pair: {execution.details.opportunity.pair} • </span>
                          )}
                          {execution.details.alert_type && (
                            <span>Alert: {execution.details.alert_type} • </span>
                          )}
                          {execution.error_message && (
                            <span className="text-red-600">Error: {execution.error_message.substring(0, 50)}...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {execution.profit_realized !== undefined && (
                      <div className={`font-semibold ${
                        execution.profit_realized >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {execution.profit_realized >= 0 ? '+' : ''}${execution.profit_realized.toFixed(2)}
                      </div>
                    )}
                    {execution.gas_used && (
                      <div className="text-xs text-slate-500">
                        Gas: {execution.gas_used.toFixed(4)} MATIC
                      </div>
                    )}
                    {execution.execution_time_ms && (
                      <div className="text-xs text-slate-500">
                        {(execution.execution_time_ms / 1000).toFixed(2)}s
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No execution history yet</p>
                <p className="text-sm mt-2">Start the bot to begin recording activities</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
