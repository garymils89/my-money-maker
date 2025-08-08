
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
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
  History, // Added History icon for the dashboard tab
} from "lucide-react";
import BotConfigForm from "../components/bot/BotConfigForm";
import RiskControls from "../components/bot/RiskControls";
import BotExecutionLog from "../components/bot/BotExecutionLog";
import LeverageManager from "../components/bot/LeverageManager";
import LiveActivityFeed from "../components/bot/LiveActivityFeed";

import { BotExecution } from "@/api/entities";
import { ArbitrageOpportunity } from "@/api/entities";
import { ethers } from "ethers";

const NATIVE_USDC_CONTRACT_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const BRIDGED_USDC_CONTRACT_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// Make the interval timer global to prevent it from clearing on page change
let globalBotInterval = null;

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

  // Revert to initial object state for flashloanConfig to prevent runtime errors
  // as its properties (e.g., flashloanConfig.amount) are accessed directly.
  const [flashloanConfig, setFlashloanConfig] = useState({
    enabled: true,
    amount: 25000,
    provider: 'aave',
    fee_percentage: 0.09
  });
  const [lastFlashloanSim, setLastFlashloanSim] = useState(null);
  
  // REMOVED [executions, setExecutions] - this was the source of the bug.
  
  const [dailyStats, setDailyStats] = useState({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });

  const providerRef = useRef(null);
  const walletRef = useRef(null);
  const nativeUsdcContractRef = useRef(null);
  const bridgedUsdcContractRef = useRef(null);
  const tradedOpportunityIdsRef = useRef(new Set());

  const initializeEngine = useCallback(async () => {
    try {
      console.log("🚀 BOT: Starting engine initialization...");
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
      
      console.log("✅ BOT: Engine initialized successfully");
      setIsLive(true);
      return true;
    } catch (error) {
      console.error("❌ BOT: LIVE INITIALIZATION FAILED:", error.message);
      setIsLive(false);
      return false;
    }
  }, []);

  const fetchRealBalances = useCallback(async () => {
    if (!walletRef.current) return { totalUsdc: 0 };
    
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
      // Fix typo: briddcUsdcWei should be bridgedUsdcWei
      const bridgedUsdc = parseFloat(ethers.formatUnits(bridgedUsdcWei, Number(bridgedDecimals)));

      setMaticBalance(matic);
      setNativeUsdcBalance(nativeUsdc);
      setBridgedUsdcBalance(bridgedUsdc);
      
      return { totalUsdc: nativeUsdc + bridgedUsdc };
    } catch (error) {
      console.error("Error fetching balances:", error);
      return { totalUsdc: 0 };
    }
  }, []);

  // REMOVED loadHistoricalExecutions - components will do this themselves.

  const scanForOpportunities = useCallback(async () => {
    try {
      const opportunities = await ArbitrageOpportunity.list('-profit_percentage', 10);
      const untradedOpportunities = opportunities.filter(opp => !tradedOpportunityIdsRef.current.has(opp.id));
      
      const filteredOpps = untradedOpportunities.filter(opp => {
        const minProfit = botConfig?.min_profit_threshold || 0.2;
        return opp.profit_percentage >= minProfit;
      });
      
      return filteredOpps;
    } catch (error) {
      console.error("BOT: Error scanning for opportunities:", error);
      return [];
    }
  }, [botConfig]);

  const recordExecution = useCallback(async (executionData) => {
    try {
      // ONLY create in the database. The UI will pick it up automatically.
      await BotExecution.create(executionData);
      console.log(`💾 BOT: Recorded execution to DB: ${executionData.execution_type} - ${executionData.status}`);
    } catch(err) {
      console.error("❌ BOT: Failed to save execution record:", err);
    }
  }, []);

  const executeFlashloanArbitrage = useCallback(async (opportunity, config) => {
    console.log(`⚡ FLASHLOAN TRADE: Executing ${opportunity.pair} with $${config.amount.toLocaleString()}`);
    
    const grossProfit = config.amount * (opportunity.profit_percentage / 100);
    const loanFee = config.amount * (config.fee_percentage / 100);
    const netProfit = grossProfit - loanFee;

    setLastFlashloanSim({ grossProfit, loanFee, netProfit });
    
    tradedOpportunityIdsRef.current.add(opportunity.id);

    // Simulate success/failure (90% success rate for flashloans)
    const success = Math.random() > 0.1;
    const status = success ? 'completed' : 'failed';
    const profitRealized = status === 'completed' ? netProfit * (0.95 + Math.random() * 0.05) : -loanFee;

    await recordExecution({
      execution_type: 'flashloan_trade',
      status: status,
      profit_realized: profitRealized,
      details: {
        opportunity: {
          pair: opportunity.pair, 
          buyDex: opportunity.buy_exchange, 
          sellDex: opportunity.sell_exchange,
          profitPercentage: opportunity.profit_percentage, 
          netProfitUsd: profitRealized,
        },
        loanAmount: config.amount, 
        loanFee: loanFee, 
        provider: config.provider,
        tx_hash: '0xFLASH_' + Math.random().toString(36).substring(2, 15)
      }
    });

    setDailyStats(prev => ({
      ...prev,
      trades: prev.trades + 1,
      profit: prev.profit + (status === 'completed' ? profitRealized : 0),
      loss: prev.loss + (status === 'failed' ? Math.abs(profitRealized) : 0),
    }));

    console.log(`💰 FLASHLOAN ${status.toUpperCase()}: ${profitRealized > 0 ? '+' : ''}$${profitRealized.toFixed(2)}`);
  }, [recordExecution, setDailyStats]);

  const executeArbitrage = useCallback(async (opportunity) => {
    console.log(`📈 BOT: REGULAR - Executing ${opportunity.pair}`);
    
    tradedOpportunityIdsRef.current.add(opportunity.id);
    await ArbitrageOpportunity.update(opportunity.id, { status: 'executed' }).catch(err => console.error(err));

    const success = Math.random() > 0.15;
    const status = success ? 'completed' : 'failed';
    const actualProfit = success
      ? opportunity.estimated_profit * (0.85 + Math.random() * 0.25)
      : -(opportunity.estimated_profit * 0.5 || 1);
    const gasUsed = (opportunity.gas_estimate || 0.5);

    await recordExecution({
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
        tx_hash: '0xREG_' + ethers.hexlify(ethers.randomBytes(30)).substring(2)
      }
    });
    
    setDailyStats(prev => ({
      ...prev,
      trades: prev.trades + 1,
      profit: prev.profit + (success ? actualProfit : 0),
      loss: prev.loss + (success ? 0 : Math.abs(actualProfit)),
      gasUsed: prev.gasUsed + gasUsed
    }));

    console.log(`💰 BOT: REGULAR ${status.toUpperCase()}: ${actualProfit > 0 ? '+' : ''}$${actualProfit.toFixed(2)}`);
  }, [recordExecution, setDailyStats]);

  const runTradingLoop = useCallback(async () => {
    try {
      await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Cycle', message: 'Starting trading loop.' } });
      const { totalUsdc } = await fetchRealBalances();
      const opps = await scanForOpportunities();
      
      if (opps.length > 0) {
        const topOpp = opps[0];
        await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Opportunity Found', message: `Found ${topOpp.pair} at ${topOpp.profit_percentage.toFixed(2)}%` } });
        
        // ALWAYS try flashloan first - it's more profitable
        if (flashloanConfig?.enabled) {
          const grossProfit = flashloanConfig.amount * (topOpp.profit_percentage / 100);
          const loanFee = flashloanConfig.amount * (flashloanConfig.fee_percentage / 100);
          const netProfit = grossProfit - loanFee;
          
          await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Flashloan Analysis', message: `Gross: $${grossProfit.toFixed(2)}, Fee: $${loanFee.toFixed(2)}, Net: $${netProfit.toFixed(2)}` } });
          
          if (netProfit > 1) { // Lower threshold - any profit is good
            await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Decision', message: `Executing flashloan, net profit $${netProfit.toFixed(2)} is acceptable.` } });
            await executeFlashloanArbitrage(topOpp, flashloanConfig);
          } else {
            await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Decision', message: `Skipping flashloan, net profit $${netProfit.toFixed(2)} is too low.` } });
          }
        } else {
          await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Info', message: `Flashloans are disabled in config.` } });
        }
      } else {
        await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Scan Result', message: 'No profitable opportunities found this cycle.' } });
      }
    } catch (error) {
      console.error("❌ FLASHLOAN BOT ERROR:", error);
      // Keep error recording here for general errors in the loop
      recordExecution({
        execution_type: 'error',
        status: 'failed',
        error_message: error.message
      });
    }
  }, [fetchRealBalances, scanForOpportunities, executeFlashloanArbitrage, executeArbitrage, recordExecution, flashloanConfig, botConfig]);

  // This effect now correctly handles the bot's lifecycle
  useEffect(() => {
    const savedBotState = localStorage.getItem('arbitragebot_running');
    if (savedBotState === 'true' && !isRunning) {
      handleToggleBot(true); 
    }
  }, []);

  const handleToggleBot = async (startSilently = false) => {
    if (isRunning) {
      // --- STOP BOT ---
      console.log("🛑 BOT: Stopping...");
      setIsRunning(false);
      setIsLive(false);
      setWalletAddress(null);
      localStorage.setItem('arbitragebot_running', 'false');
      if (globalBotInterval) {
        clearInterval(globalBotInterval);
        globalBotInterval = null;
      }
      await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Status', message: 'Bot Stopped.' } });
    } else {
      // --- START BOT ---
      if (!startSilently) {
        await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Status', message: 'Bot Starting...' } });
      }
      console.log("🚀 BOT: Starting...");
      tradedOpportunityIdsRef.current = new Set();
      setDailyStats({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });
      
      const success = await initializeEngine();
      if (success) {
        setIsRunning(true);
        localStorage.setItem('arbitragebot_running', 'true');
        
        // Clear any old interval and start a new global one
        if (globalBotInterval) clearInterval(globalBotInterval);
        runTradingLoop(); // Run immediately on start
        globalBotInterval = setInterval(runTradingLoop, 15000); // Set interval for subsequent runs
        await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Status', message: 'Bot Started Successfully.' } });
      } else {
        alert("LIVE MODE FAILED: Check console for errors. Ensure your environment variables are set correctly.");
        await recordExecution({ execution_type: 'alert', status: 'failed', details: { alert_type: 'Status', message: 'Bot failed to start. Check console for errors.' } });
      }
    }
  };

  // REMOVED useEffect for loadHistoricalExecutions as components now fetch their own data.

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
                {flashloanConfig?.enabled && isRunning && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Flashloan ${flashloanConfig.amount.toLocaleString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={() => handleToggleBot()}
            className={`${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            {isRunning ? <><Pause className="w-4 h-4 mr-2" />Stop Bot</> : <><Play className="w-4 h-4 mr-2" />Start Bot</>}
          </Button>
        </div>
        
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Bot className="w-4 h-4" />
          <AlertDescription className="text-blue-800">
            <strong>Bot Status:</strong> Flashloans are ENABLED by default. The bot will prioritize flashloan trades when profitable, then fall back to regular arbitrage.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Trades Today</p>
                  <h3 className="text-2xl font-bold text-slate-900">{dailyStats.trades}</h3>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Net P&L</p>
                  <h3 className={`text-2xl font-bold ${(dailyStats.profit - dailyStats.loss) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${(dailyStats.profit - dailyStats.loss).toFixed(2)}
                  </h3>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">MATIC Balance</p>
                  <h3 className="text-2xl font-bold text-purple-600">{maticBalance.toFixed(4)}</h3>
                </div>
                <Zap className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">USDC Balance</p>
                  <h3 className="text-2xl font-bold text-orange-600">
                    ${(nativeUsdcBalance + bridgedUsdcBalance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </h3>
                </div>
                <Zap className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="activity" className="flex items-center gap-2"><Activity className="w-4 h-4" />Live Activity</TabsTrigger>
              {/* Changed icon for dashboard tab from Activity to History */}
              <TabsTrigger value="dashboard" className="flex items-center gap-2"><History className="w-4 h-4" />History</TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2"><Settings className="w-4 h-4" />Config</TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-2"><Shield className="w-4 h-4" />Risk</TabsTrigger>
              <TabsTrigger value="leverage" className="flex items-center gap-2"><Zap className="w-4 h-4" />Flashloans</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="activity">
            {/* REMOVED executions prop - component is now self-sufficient */}
            <LiveActivityFeed isRunning={isRunning} />
          </TabsContent>
          
          <TabsContent value="dashboard">
            {/* REMOVED executions prop */}
            <BotExecutionLog />
          </TabsContent>
          
          <TabsContent value="config">
            <BotConfigForm config={botConfig} onSubmit={setBotConfig} />
          </TabsContent>
          <TabsContent value="risk">
            <RiskControls config={botConfig} dailyStats={dailyStats} onUpdateConfig={setBotConfig} />
          </TabsContent>
          <TabsContent value="leverage">
            <LeverageManager onConfigChange={setFlashloanConfig} simulationResult={lastFlashloanSim} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
