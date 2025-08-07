import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      const [portfolioData, tradesData] = await Promise.all([
        base44.entities.Portfolio.list(),
        base44.entities.Trade.list('-created_date', 10)
      ]);
      setPortfolio(portfolioData);
      setTrades(tradesData);
    } catch (error) {
      console.error("Error loading portfolio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalValue = portfolio.reduce((sum, p) => sum + (p.current_value || 0), 0);
    const totalInvested = portfolio.reduce((sum, p) => sum + (p.total_invested || 0), 0);
    const totalPnL = portfolio.reduce((sum, p) => sum + (p.profit_loss || 0), 0);
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    
    return { totalValue, totalInvested, totalPnL, totalPnLPercentage };
  };

  const { totalValue, totalInvested, totalPnL, totalPnLPercentage } = calculateTotals();

  const pieData = portfolio.map(p => ({
    name: `${p.asset} (${p.exchange})`,
    value: p.current_value || 0,
    color: p.asset === 'USDC' ? '#f97316' : p.asset === 'USDT' ? '#eab308' : '#64748b'
  }));

  const COLORS = ['#f97316', '#eab308', '#64748b', '#06b6d4', '#8b5cf6'];

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Portfolio Overview
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              Track your USDC positions across exchanges
            </p>
          </div>
          
          <Button className="bg-gradient-to-r from-orange-500 to-amber-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Position
          </Button>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Portfolio Value</p>
                    <h3 className="text-3xl font-bold text-slate-900">
                      ${totalValue.toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total P&L</p>
                    <h3 className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${totalPnL >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-pink-600'}`}>
                    {totalPnL >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-white" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">P&L Percentage</p>
                    <h3 className={`text-3xl font-bold ${totalPnLPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}%
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                    <ArrowUpRight className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Portfolio Distribution */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Asset Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-medium">${entry.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Positions List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Active Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.length > 0 ? (
                    portfolio.map((position, index) => (
                      <motion.div
                        key={position.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{position.asset}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{position.asset}</div>
                            <div className="text-sm text-slate-600">{position.exchange}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold">{position.balance?.toLocaleString()}</div>
                          <div className="text-sm text-slate-600">
                            ${position.current_value?.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`font-semibold ${
                            (position.profit_loss || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {(position.profit_loss || 0) >= 0 ? '+' : ''}${(position.profit_loss || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-slate-600">P&L</div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No positions yet</h3>
                      <p className="text-slate-600 mb-4">Start by adding your first position</p>
                      <Button className="bg-gradient-to-r from-orange-500 to-amber-500">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Position
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}