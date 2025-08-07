import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target, Zap, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function StatsGrid({ stats }) {
  const statCards = [
    {
      title: "Total Portfolio",
      value: `$${stats?.totalPortfolio?.toLocaleString() || '0'}`,
      change: stats?.portfolioChange || 0,
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      title: "Active Opportunities",
      value: stats?.activeOpportunities || 0,
      change: stats?.opportunityChange || 0,
      icon: Target,
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      title: "Today's Profit",
      value: `$${stats?.todayProfit?.toLocaleString() || '0'}`,
      change: stats?.profitChange || 0,
      icon: TrendingUp,
      gradient: "from-orange-500 to-amber-600"
    },
    {
      title: "Best Opportunity",
      value: `${stats?.bestOpportunity || '0'}%`,
      change: stats?.bestOpportunityChange || 0,
      icon: Zap,
      gradient: "from-purple-500 to-pink-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                  {stat.change !== undefined && (
                    <div className={`flex items-center mt-2 text-sm ${
                      stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {stat.change >= 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      <span className="font-medium">
                        {Math.abs(stat.change).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}