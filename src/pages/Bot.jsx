
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bot,
  Play,
  Pause,
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Settings,
  Shield,
  ShieldCheck,
} from "lucide-react";
import BotConfigForm from "../components/bot/BotConfigForm";
import RiskControls from "../components/bot/RiskControls";
import BotExecutionLog from "../components/bot/BotExecutionLog";
import LeverageManager from "../components/bot/LeverageManager";

import { base44 } from "@/api/base44Client";
import { ethers } from "ethers";

const NATIVE_USDC_CONTRACT_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const BRIDGED_USDC_CONTRACT_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export default function BotPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  
  const [nativeUsdcBalance, setNativeUsdcBalance] = useState(0);
  const [bridgedUsdcBalance, setBridgedUsdcBalance] = useState(0);
  const [maticBalance, setMaticBalance] = useState(0);
  
  const [botConfig, setBotConfig] = useState({
    bot_name: 'ArbitrageBot',
    min_profit_threshold: 0.2,
    max_position_size: 300,
    max_daily_trades: 20,
    daily_loss_limit: 50,
    max_slippage_percentage: 0.5,
    stop_loss_percentage: 5
  });
  
  const [executions, setExecutions] = useState([]);
  const [dailyStats, setDailyStats] = useState({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });

  const providerRef = useRef(null);
  const walletRef = useRef(null);
  const nativeUsdcContractRef = useRef(null);
  const bridgedUsdcContractRef = useRef(null);
  const intervalRef = useRef(null);

  const initializeEngine = useCallback(async (currentConfig) => {
    try {
      const rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL;
      const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;

      if (!rpcUrl || !privateKey) {
        throw new Error("Missing VITE_POLYGON_RPC_URL or VITE_WALLET_PRIVATE_KEY in environment variables.");
      }

      providerRef.current = new ethers.JsonRpcProvider(rpcUrl);
      walletRef.current = new ethers.Wallet(privateKey, providerRef.current);
      const address = await walletRef.current.getAddress();
      setWalletAddress(address);
      
      nativeUsdcContractRef.current = new ethers.Contract(NATIVE_USDC_CONTRACT_ADDRESS, USDC_ABI, providerRef.current);
      bridgedUsdcContractRef.current = new ethers.Contract(BRIDGED_USDC_CONTRACT_ADDRESS, USDC_ABI, providerRef.current);
      
      setIsLive(true);
      console.log(`✅ LIVE MODE INITIALIZED. Wallet connected: ${address}`);
      return true;
    } catch (error) {
      console.error("❌ LIVE INITIALIZATION FAILED:", error.message);
      setIsLive(false);
      return false;
    }
  }, []);

  const fetchRealBalances = useCallback(async () => {
    if (!walletRef.current || !nativeUsdcContractRef.current || !bridgedUsdcContractRef.current) return { totalUsdc: 0 };
    try {
      const address = await walletRef.current.getAddress();
      const [maticWei, nativeUsdcWei, bridgedUsdcWei, nativeDecimals, bridgedDecimals] = await Promise.all([
        providerRef.current.getBalance(address),
        nativeUsdcContractRef.current.balanceOf(address),
        bridgedUsdcContractRef.current.balanceOf(address),
        nativeUsdcContractRef.current.decimals(),
        bridgedUsdcContractRef.current.decimals()
      ]);
      
      const matic = parseFloat(ethers.formatEther(maticWei));
      const nativeUsdc = parseFloat(ethers.formatUnits(nativeUsdcWei, Number(nativeDecimals)));
      const bridgedUsdc = parseFloat(ethers.formatUnits(bridgedUsdcWei, Number(bridgedDecimals)));

      setMaticBalance(matic);
      setNativeUsdcBalance(nativeUsdc);
      setBridgedUsdcBalance(bridgedUsdc); // Fix: Changed 'briddcUsdc' to 'bridgedUsdc'
      
      return { totalUsdc: nativeUsdc + bridgedUsdc };
    } catch (error) {
      console.error("Error fetching balances:", error);
      return { totalUsdc: 0 };
    }
  }, []);

  const loadHistoricalExecutions = useCallback(async () => {
    try {
      const historicalExecutions = await base44.entities.BotExecution.list({ sort: '-created_date', limit: 100 });
      setExecutions(historicalExecutions);
    } catch (error) {
      console.error("Could not load historical executions:", error);
    }
  }, []);

  const executeArbitrage = useCallback(async (opportunity) => {
    // FIXED: Simulate success/failure for realism
    const success = Math.random() > 0.15; // 85% success rate
    const actualProfit = success
      ? opportunity.estimated_profit * (0.85 + Math.random() * 0.25) // Simulate slippage
      : -(opportunity.estimated_profit * 0.5 || 1); // Failed trade costs something
    const status = success ? 'completed' : 'failed';
    const gasUsed = (opportunity.gas_estimate || 0.5);

    console.log(`✅ SIMULATING TRADE: ${opportunity.pair} | Status: ${status} | P&L: $${actualProfit.toFixed(2)}`);

    // CRITICAL FIX: Mark opportunity as executed IMMEDIATELY and await it
    try {
      console.log(`🔄 MARKING OPPORTUNITY ${opportunity.id} AS EXECUTED...`);
      await base44.entities.ArbitrageOpportunity.update(opportunity.id, { status: 'executed' });
      console.log(`✅ OPPORTUNITY ${opportunity.id} MARKED AS EXECUTED SUCCESSFULLY`);
    } catch (error) {
      console.error(`❌ FAILED TO MARK OPPORTUNITY ${opportunity.id} AS EXECUTED:`, error);
    }

    const newExecution = {
      execution_type: 'trade',
      status: status,
      profit_realized: actualProfit,
      gas_used: gasUsed,
      details: { 
        opportunity: {
          pair: opportunity.pair,
          buyDex: opportunity.buy_exchange,
          sellDex: opportunity.sell_exchange,
          profitPercentage: opportunity.profit_percentage,
          netProfitUsd: actualProfit,
        },
        tx_hash: '0xSIMULATED_' + ethers.hexlify(ethers.randomBytes(30)).substring(2)
      }
    };
    
    // Instantly update the UI with a temporary ID
    setExecutions(prev => [{...newExecution, id: 'temp-' + Date.now(), created_date: new Date().toISOString() }, ...prev].slice(0, 50));

    // Save execution log to database
    try {
      await base44.entities.BotExecution.create(newExecution);
      console.log(`✅ EXECUTION LOG SAVED SUCCESSFULLY`);
    } catch (error) {
      console.error(`❌ FAILED TO SAVE EXECUTION LOG:`, error);
    }
    
    // Update daily stats correctly
    setDailyStats(prev => ({
      ...prev,
      trades: prev.trades + 1,
      profit: prev.profit + (success ? actualProfit : 0),
      loss: prev.loss + (success ? 0 : Math.abs(actualProfit)),
      gasUsed: prev.gasUsed + gasUsed
    }));

  }, []);

  const scanForOpportunities = useCallback(async () => {
    try {
      console.log(`🔍 SCANNING: Looking for opportunities with status='active'...`);
      
      const opportunities = await base44.entities.ArbitrageOpportunity.list({ 
        filter: { status: 'active' },
        sort: '-profit_percentage',
        limit: 10 
      });

      console.log(`📊 SCAN RESULT: Found ${opportunities.length} active opportunities`);
      if (opportunities.length > 0) {
        console.log(`🔍 First opportunity details:`, {
          id: opportunities[0].id,
          pair: opportunities[0].pair,
          status: opportunities[0].status,
          profit: opportunities[0].profit_percentage
        });
      }

      return opportunities.filter(opp => {
        const minProfit = botConfig?.min_profit_threshold || 0.2;
        return opp.profit_percentage >= minProfit;
      });
    } catch (error) {
      console.error("❌ ERROR SCANNING FOR OPPORTUNITIES:", error);
      return [];
    }
  }, [botConfig]);
  
  const runTradingLoop = useCallback(async () => {
    console.log("🔍 Scanning for opportunities...");
    const { totalUsdc } = await fetchRealBalances();
    const opps = await scanForOpportunities();
    
    console.log(`Found ${opps.length} opportunities. Current balance: $${totalUsdc.toFixed(2)}`);
    
    setExecutions(prev => [{ 
      id: Date.now(), 
      created_date: new Date().toISOString(), 
      execution_type: 'scan', 
      status: 'completed', 
      details: { found: opps.length }
    }, ...prev].slice(0, 50));
    
    if (opps.length > 0 && totalUsdc >= botConfig.max_position_size) {
      console.log('💎 Executing top opportunity:', opps[0]);
      await executeArbitrage(opps[0]);
    } else if (opps.length > 0) {
        console.log(`💰 Opportunity found, but balance $${totalUsdc.toFixed(2)} is less than required $${botConfig.max_position_size} to trade.`);
    }
  }, [fetchRealBalances, scanForOpportunities, executeArbitrage, botConfig]);

  const handleToggleBot = async () => {
    if (isRunning) {
      console.log("🛑 Stopping bot...");
      setIsRunning(false);
      setIsLive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setWalletAddress(null);
    } else {
      console.log("🚀 Starting bot...");
      const success = await initializeEngine(botConfig);
      if (success) {
        setIsRunning(true);
        await runTradingLoop();
        
        intervalRef.current = setInterval(() => {
          console.log("⏰ Running scheduled scan...");
          runTradingLoop();
        }, 15000);
        
        console.log("✅ Bot started successfully.");
      } else {
        alert("LIVE MODE FAILED: Check console for errors. Ensure your environment variables are set correctly.");
      }
    }
  };

  useEffect(() => {
    loadHistoricalExecutions();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadHistoricalExecutions]);

  const getStatusColor = () => isRunning ? 'bg-emerald-500' : 'bg-slate-500';
  const getStatusText = () => isRunning ? 'Active' : 'Stopped';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${getStatusColor()} bg-opacity-20`}>
              <Bot className={`w-8 h-8 ${getStatusColor().replace('bg-', 'text-')}`} />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Trading Bot
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isRunning ? 'animate-pulse' : ''}`} />
                <span className="text-slate-600">{getStatusText()}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleToggleBot}
            className={`${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            {isRunning ? <><Pause className="w-4 h-4 mr-2" />Stop Bot</> : <><Play className="w-4 h-4 mr-2" />Start Bot</>}
          </Button>
        </div>

        {/* FIXED: Clearer UI messaging about the bot's status */}
        {!isRunning ? (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-amber-800">
              <strong>Bot Stopped:</strong> The bot is currently offline. Click Start to connect to your wallet.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-emerald-200 bg-emerald-50">
            <ShieldCheck className="w-4 h-4" />
            <AlertDescription className="text-emerald-800">
              <strong>Bot Active (Live Simulation):</strong> Connected to wallet <code className="text-xs">{walletAddress}</code>. Using live market data to <strong>simulate</strong> trades. No real funds are being spent.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">Simulated Trades</p><h3 className="text-2xl font-bold text-slate-900">{dailyStats.trades}</h3></div><Activity className="w-8 h-8 text-blue-500" /></div></CardContent></Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">Simulated P&L</p><h3 className={`text-2xl font-bold ${(dailyStats.profit - dailyStats.loss) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${(dailyStats.profit - dailyStats.loss).toFixed(2)}</h3></div><TrendingUp className="w-8 h-8 text-emerald-500" /></div></CardContent></Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">MATIC Balance</p><h3 className="text-2xl font-bold text-purple-600">{maticBalance.toFixed(4)}</h3></div><Zap className="w-8 h-8 text-purple-500" /></div></CardContent></Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total USDC Balance</p>
                  <h3 className="text-2xl font-bold text-orange-600">
                    ${(nativeUsdcBalance + bridgedUsdcBalance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Native: ${nativeUsdcBalance.toFixed(2)} | Bridged: ${bridgedUsdcBalance.toFixed(2)}
                  </div>
                </div>
                <Zap className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2"><Activity className="w-4 h-4" />Dashboard</TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2"><Settings className="w-4 h-4" />Configuration</TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-2"><Shield className="w-4 h-4" />Risk Controls</TabsTrigger>
              <TabsTrigger value="leverage" className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Leverage</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="dashboard"><BotExecutionLog executions={executions} /></TabsContent>
          <TabsContent value="config"><BotConfigForm config={botConfig} onSubmit={setBotConfig} /></TabsContent>
          <TabsContent value="risk"><RiskControls config={botConfig} dailyStats={dailyStats} onUpdateConfig={setBotConfig} /></TabsContent>
          <TabsContent value="leverage"><LeverageManager /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
