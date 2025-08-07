import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, AlertCircle, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProfitCalculator from "../components/calculator/ProfitCalculator";
import CapitalOptimizer from "../components/calculator/CapitalOptimizer";

export default function CalculatorPage() {
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const data = await base44.entities.ArbitrageOpportunity.filter({ status: 'active' });
      setOpportunities(data);
    } catch (error) {
      console.error("Error loading opportunities:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
            Profit Calculator
          </h1>
          <p className="text-slate-600 font-medium">
            Calculate potential returns with your current capital: 1200 USDC + 128 MATIC
          </p>
        </motion.div>

        {/* Key Insights Alert */}
        <Alert className="mb-6 border-emerald-200 bg-emerald-50">
          <TrendingUp className="w-4 h-4" />
          <AlertDescription className="text-emerald-800">
            <strong>Quick Answer:</strong> With 1200 USDC and 128 MATIC, you can potentially earn <strong>$8-15/day</strong> through conservative arbitrage, 
            or <strong>$20-35/day</strong> with higher-risk strategies. Your gas allows for ~850 trades total.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Profit Calculator
            </TabsTrigger>
            <TabsTrigger value="optimizer" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Optimization Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <ProfitCalculator opportunities={opportunities} />
          </TabsContent>

          <TabsContent value="optimizer">
            <CapitalOptimizer capital={1200} gasBalance={128} />
          </TabsContent>
        </Tabs>

        {/* Reality Check */}
        <Alert className="mt-6 border-amber-200 bg-amber-50">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-amber-800">
            <strong>Important:</strong> These are theoretical calculations based on current market conditions. 
            Actual profits depend on market volatility, execution speed, competition, and gas price fluctuations. 
            Start with smaller amounts to test strategies before scaling up.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}