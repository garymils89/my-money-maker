import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Target, Fuel, Coins } from "lucide-react";

export default function CapitalOptimizer({ capital = 1200, gasBalance = 128 }) {
  const optimizationTips = [
    {
      title: "Maximize Gas Efficiency",
      description: "Your 128 MATIC allows ~850 trades. Focus on higher-margin opportunities (>2%) to maximize profit per trade.",
      priority: "high",
      impact: "+$8-12/day",
      icon: Fuel
    },
    {
      title: "Capital Allocation Strategy", 
      description: "With $1200, split into 3-4 positions of $300-400 each to diversify across different pairs and reduce risk.",
      priority: "medium",
      impact: "+15% success rate",
      icon: Target
    },
    {
      title: "Timing Optimization",
      description: "Peak arbitrage windows are 8-10 AM and 7-9 PM EST when volume is highest and price differences emerge.",
      priority: "medium", 
      impact: "+2-3 opportunities/hour",
      icon: Lightbulb
    },
    {
      title: "Compound Growth",
      description: "Reinvest profits daily. At $12/day profit, you'd have $1560 capital after 30 days (+30% capacity).",
      priority: "high",
      impact: "+$4/day by month end",
      icon: Coins
    }
  ];

  const capitalAnalysis = {
    efficiency: Math.min((capital / 2000) * 100, 100), // Optimal around $2000
    gasCapacity: Math.min((gasBalance / 200) * 100, 100), // Optimal around 200 MATIC
    overallScore: Math.min(((capital / 2000) * 50 + (gasBalance / 200) * 50), 100)
  };

  return (
    <div className="space-y-6">
      {/* Capital Analysis */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Capital Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Capital Efficiency</span>
                <span className="font-medium">{capitalAnalysis.efficiency.toFixed(0)}%</span>
              </div>
              <Progress value={capitalAnalysis.efficiency} className="h-2" />
              <div className="text-xs text-slate-500 mt-1">
                ${capital} / $2000 optimal trading capital
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Gas Reserves</span>
                <span className="font-medium">{capitalAnalysis.gasCapacity.toFixed(0)}%</span>
              </div>
              <Progress value={capitalAnalysis.gasCapacity} className="h-2" />
              <div className="text-xs text-slate-500 mt-1">
                {gasBalance} MATIC / 200 MATIC for optimal coverage
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Overall Setup Score</span>
                <Badge variant={capitalAnalysis.overallScore > 70 ? "default" : "secondary"}>
                  {capitalAnalysis.overallScore.toFixed(0)}/100
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Tips */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationTips.map((tip, index) => (
              <div key={index} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
                    <tip.icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{tip.title}</h4>
                      <Badge 
                        variant={tip.priority === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {tip.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{tip.description}</p>
                    <div className="text-xs font-medium text-emerald-600">
                      Potential impact: {tip.impact}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}