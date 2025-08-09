import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Info,
  CheckCircle,
  XCircle,
  Database
} from "lucide-react";
import { format } from 'date-fns';

const executionIcons = {
  trade: <TrendingUp className="w-4 h-4 text-emerald-500" />,
  flashloan_trade: <Zap className="w-4 h-4 text-purple-500" />,
  error: <AlertTriangle className="w-4 h-4 text-red-500" />,
  alert: <Info className="w-4 h-4 text-yellow-500" />,
  scan: <Database className="w-4 h-4 text-blue-500" />,
};

const statusIcons = {
  completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  failed: <XCircle className="w-4 h-4 text-red-500" />,
  executing: <Zap className="w-4 h-4 text-blue-500 animate-pulse" />,
};

export default function LiveActivityFeed({ executions = [], isRunning }) {
  const feedRef = useRef(null);
  const recentExecutions = executions.slice(0, 50);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [recentExecutions]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={feedRef}
        className="flex-grow overflow-y-auto pr-2 space-y-3"
      >
        <AnimatePresence>
          {recentExecutions.length > 0 ? (
            recentExecutions.map((execution) => (
              <motion.div
                key={execution.id || execution.client_id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="bg-white/70 p-3 rounded-lg shadow-sm border border-slate-100"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {statusIcons[execution.status] || executionIcons[execution.execution_type] || <Info className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 capitalize">
                        {execution.execution_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">
                        {format(new Date(execution.created_date || execution.client_timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {execution.details?.message || `Execution status: ${execution.status}`}
                    </p>
                    {execution.profit_realized !== null && execution.profit_realized !== undefined && (
                       <Badge variant="outline" className={`mt-2 ${execution.profit_realized > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                         P&L: ${execution.profit_realized.toFixed(2)}
                       </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Zap className="w-10 h-10 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Awaiting Bot Activity...</p>
              <p className="text-sm">
                {isRunning ? 'Listening for trades and scans.' : 'Start a strategy to see live updates.'}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}