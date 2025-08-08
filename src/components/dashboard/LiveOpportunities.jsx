import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, AlertCircle, Clock, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveOpportunities({ executions = [] }) {
  // Extract recent trading activity from bot execution data
  const recentTrades = executions
    .filter(e => (e.execution_type === 'trade' || e.execution_type === 'flashloan_trade') && e.status === 'completed')
    .slice(0, 5);

  const getTradeIcon = (executionType) => {
    return executionType === 'flashloan_trade' ? 
      <Zap className="w-4 h-4 text-purple-500" /> : 
      <TrendingUp className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-bold text-slate-900">Recent Bot Activity</span>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {recentTrades.length} Recent Trades
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTrades.map((trade, index) => (
            <motion.div
              key={trade.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getTradeIcon(trade.execution_type)}
                    <span className="font-semibold text-slate-900">
                      {trade.details?.opportunity?.pair || 'USDC/USDT'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {trade.execution_type === 'flashloan_trade' ? 'Flashloan' : 'Regular'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(trade.created_date).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-lg font-bold text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  +${trade.profit_realized?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-slate-600">
                  {trade.details?.opportunity?.profitPercentage?.toFixed(2) || '0.00'}% profit
                </div>
              </div>
            </motion.div>
          ))}
          
          {recentTrades.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No trading activity yet</p>
              <p className="text-sm text-slate-500">Start the bot to begin recording trades</p>
            </div>
          )}
        </div>
        
        {recentTrades.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-center text-sm text-slate-600">
              Total Profit: <span className="font-bold text-emerald-600">
                +${recentTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}