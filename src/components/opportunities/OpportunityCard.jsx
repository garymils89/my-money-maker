import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export default function OpportunityCard({ opportunity, onExecute }) {
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getProfitColor = (profit) => {
    if (profit >= 3) return 'text-emerald-600';
    if (profit >= 2) return 'text-amber-600';
    return 'text-slate-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-900">{opportunity.pair}</h3>
              <Badge className={getRiskColor(opportunity.risk_level)}>
                {opportunity.risk_level} risk
              </Badge>
            </div>
            <div className={`text-2xl font-bold ${getProfitColor(opportunity.profit_percentage)}`}>
              +{opportunity.profit_percentage.toFixed(2)}%
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">{opportunity.buy_exchange}</span>
              <ArrowRight className="w-4 h-4" />
              <span className="font-medium">{opportunity.sell_exchange}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Live</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Buy Price</div>
              <div className="font-semibold text-slate-900">${opportunity.buy_price.toFixed(4)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Sell Price</div>
              <div className="font-semibold text-slate-900">${opportunity.sell_price.toFixed(4)}</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-slate-500">Available Volume</div>
              <div className="font-semibold">${opportunity.volume_available.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Estimated Profit</div>
              <div className="font-semibold text-emerald-600">
                ${opportunity.estimated_profit.toFixed(2)}
              </div>
            </div>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
            onClick={() => onExecute(opportunity)}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Execute Trade
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}