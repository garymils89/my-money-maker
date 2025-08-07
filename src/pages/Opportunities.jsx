import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Search, Filter, RefreshCw, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import OpportunityCard from "../components/opportunities/OpportunityCard";

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [minProfit, setMinProfit] = useState("");

  useEffect(() => {
    loadOpportunities();
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadOpportunities, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOpportunities();
  }, [opportunities, searchTerm, riskFilter, minProfit]);

  const loadOpportunities = async () => {
    try {
      const data = await base44.entities.ArbitrageOpportunity.filter({ status: 'active' });
      setOpportunities(data);
    } catch (error) {
      console.error("Error loading opportunities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOpportunities = () => {
    let filtered = [...opportunities];

    if (searchTerm) {
      filtered = filtered.filter(opp => 
        opp.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.buy_exchange.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.sell_exchange.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (riskFilter !== "all") {
      filtered = filtered.filter(opp => opp.risk_level === riskFilter);
    }

    if (minProfit) {
      filtered = filtered.filter(opp => opp.profit_percentage >= parseFloat(minProfit));
    }

    // Sort by profit percentage descending
    filtered.sort((a, b) => b.profit_percentage - a.profit_percentage);
    
    setFilteredOpportunities(filtered);
  };

  const handleExecuteTrade = (opportunity) => {
    // This would integrate with exchange APIs
    alert(`Would execute trade for ${opportunity.pair} with ${opportunity.profit_percentage.toFixed(2)}% profit`);
  };

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
              Live Opportunities
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              {filteredOpportunities.length} active arbitrage opportunities detected
            </p>
          </div>
          
          <Button
            onClick={loadOpportunities}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search pairs, exchanges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Min Profit %"
              type="number"
              step="0.1"
              value={minProfit}
              onChange={(e) => setMinProfit(e.target.value)}
            />

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter className="w-4 h-4" />
              <span>{filteredOpportunities.length} results</span>
            </div>
          </div>
        </motion.div>

        {/* Demo Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-blue-800">
            <strong>Demo Data:</strong> These are simulated opportunities. In production, this would show real-time data from multiple exchanges.
          </AlertDescription>
        </Alert>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <OpportunityCard
                opportunity={opportunity}
                onExecute={handleExecuteTrade}
              />
            </motion.div>
          ))}
        </div>

        {filteredOpportunities.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No opportunities found</h3>
            <p className="text-slate-600">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}