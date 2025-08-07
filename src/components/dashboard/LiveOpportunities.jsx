import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveOpportunities({ opportunities = [] }) {
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-bold text-slate-900">Live Opportunities</span>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {opportunities.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.slice(0, 5).map((opp, index) => (
            <motion.div
              key={opp.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">{opp.pair || 'USDC/USDT'}</span>
                    <Badge className={getRiskColor(opp.risk_level || 'low')}>
                      {opp.risk_level || 'low'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span>{opp.buy_exchange || 'Binance'}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span>{opp.sell_exchange || 'Coinbase'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-lg font-bold text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  {(opp.profit_percentage || 2.4).toFixed(2)}%
                </div>
                <div className="text-sm text-slate-600">
                  ${(opp.estimated_profit || 120).toFixed(0)} profit
                </div>
              </div>
            </motion.div>
          ))}
          
          {opportunities.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No active opportunities</p>
              <p className="text-sm text-slate-500">New opportunities will appear here automatically</p>
            </div>
          )}
        </div>
        
        {opportunities.length > 5 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button variant="outline" className="w-full">
              View All {opportunities.length} Opportunities
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}