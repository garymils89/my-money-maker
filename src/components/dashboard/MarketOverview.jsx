import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, CartesianGrid } from 'recharts';
import { TrendingUp, AlertTriangle } from "lucide-react";

export default function MarketOverview({ data = [] }) {
  const totalProfit = data.length > 0 ? data[data.length - 1].profit : 0;
  
  const profitChange = data.length > 1 
    ? ((data[data.length-1].profit - data[0].profit) / Math.max(Math.abs(data[0].profit), 1)) * 100
    : (totalProfit > 0 ? 100 : 0);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-bold text-slate-900">Cumulative P&L</span>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            profitChange >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {profitChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(profitChange).toFixed(1)}%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            ${totalProfit.toFixed(2)}
          </div>
          <p className="text-slate-600">Total realized profit from bot</p>
        </div>
        
        {data.length > 1 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis 
                  hide
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => [`$${value.toFixed(2)}`, name === 'profit' ? 'Cumulative Profit' : 'Trades']}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#f97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#profitGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Not enough trade data to build a chart.</p>
            <p className="text-sm text-slate-500">Let the bot run to collect more performance history.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}