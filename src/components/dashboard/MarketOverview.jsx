import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MarketOverview({ data = [] }) {
  // Sample data if none provided
  const chartData = data.length > 0 ? data : [
    { time: '00:00', profit: 0, opportunities: 15 },
    { time: '04:00', profit: 120, opportunities: 18 },
    { time: '08:00', profit: 280, opportunities: 22 },
    { time: '12:00', profit: 450, opportunities: 28 },
    { time: '16:00', profit: 380, opportunities: 24 },
    { time: '20:00', profit: 520, opportunities: 31 },
    { time: '24:00', profit: 680, opportunities: 26 },
  ];

  const totalProfit = chartData[chartData.length - 1]?.profit || 0;
  const profitChange = chartData.length > 1 
    ? ((totalProfit - chartData[0].profit) / Math.max(chartData[0].profit, 1)) * 100 
    : 0;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-bold text-slate-900">24H Performance</span>
          <div className={`flex items-center gap-1 text-sm font-medium ${
            profitChange >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {profitChange >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(profitChange).toFixed(1)}%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="text-3xl font-bold text-slate-900">${totalProfit.toFixed(2)}</div>
          <p className="text-slate-600">Total profit today</p>
        </div>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value, name) => [`$${value}`, name === 'profit' ? 'Profit' : 'Opportunities']}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="url(#profitGradient)" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#f97316' }}
              />
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}