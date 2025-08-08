
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
  History,
} from "lucide-react";
import BotConfigForm from "../components/bot/BotConfigForm";
import RiskControls from "../components/bot/RiskControls";
import BotExecutionLog from "../components/bot/BotExecutionLog";
import LeverageManager from "../components/bot/LeverageManager";
import LiveActivityFeed from "../components/bot/LiveActivityFeed";
import RealTradeExecutor from "../components/bot/RealTradeExecutor"; // New import
import { tradingSafety } from "../components/bot/TradingSafetyLayer"; // New import for safety controls

import { BotExecution } from "@/api/entities";
import { ArbitrageOpportunity } from "@/api/entities";
import { ethers } from "ethers";
import { botStateManager } from "../components/bot/botState"; // Import the new state manager

const NATIVE_USDC_CONTRACT_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const BRIDGED_USDC_CONTRACT_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

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

  // FIX: Initialize flashloanConfig directly from the safety layer to prevent race condition.
  const [flashloanConfig, setFlashloanConfig] = useState({
    enabled: true,
    amount: tradingSafety.getConfig().maxFlashloanAmount,
    provider: 'aave',
    fee_percentage: 0.09
  });
  const [lastFlashloanSim, setLastFlashloanSim] = useState(null);
  
  // This component's state now syncs with the central botState manager
  const [executions, setExecutions] = useState(botStateManager.getExecutions());
  
  const [dailyStats, setDailyStats] = useState({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });

  const [realTradingEnabled, setRealTradingEnabled] = useState(false); // New state
  const [tradeExecutor, setTradeExecutor] = useState(null); // New state

  const providerRef = useRef(null);
  const walletRef = useRef(null);
  const nativeUsdcContractRef = useRef(null);
  const bridgedUsdcContractRef = useRef(null);
  const tradedOpportunityIdsRef = useRef(new Set());

  // Subscribe to the central state on mount, unsubscribe on unmount
  useEffect(() => {
    const unsubscribe = botStateManager.subscribe(state => {
      setExecutions(state.executions);
      if (state.dailyStats) {
        setDailyStats(state.dailyStats);
      }
    });
    return unsubscribe;
  }, []);

  // Add function to calculate daily stats from database - FIXED API CALL
  const calculateDailyStatsFromDB = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Use BotExecution.list() and filter in JavaScript
      const allExecutions = await BotExecution.list('-created_date', 1000);
      
      const todayExecutions = allExecutions.filter(e => 
        new Date(e.created_date) >= today
      );
      
      const todayTrades = todayExecutions.filter(e => 
        e.execution_type === 'trade' || e.execution_type === 'flashloan_trade'
      );
      
      const completedTrades = todayTrades.filter(e => e.status === 'completed');
      const failedTrades = todayTrades.filter(e => e.status === 'failed');
      
      const profit = completedTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);
      const loss = failedTrades.reduce((sum, trade) => sum + Math.abs(trade.profit_realized || 0), 0);
      const gasUsed = todayTrades.reduce((sum, trade) => sum + (trade.gas_used || 0), 0);
      
      const newStats = {
        trades: todayTrades.length,
        profit,
        loss,
        gasUsed
      };
      
      // Update central state
      botStateManager.setDailyStats(newStats);
      
      console.log(`📊 Daily stats updated: ${todayTrades.length} trades, $${profit.toFixed(2)} profit`);
      return newStats;
    } catch (error) {
      console.error("Error calculating daily stats:", error);
      return null;
    }
  }, []);

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
      
      // Initialize real trade executor
      const executor = new RealTradeExecutor(providerRef.current, walletRef.current);
      setTradeExecutor(executor);
      
      // Validate wallet can actually trade
      const balanceCheck = await executor.validateWalletBalance();
      if (!balanceCheck.canTrade) {
        console.warn("⚠️ Wallet balance too low for real trading:", balanceCheck);
        await recordExecution({
          execution_type: 'alert',
          status: 'completed',
          details: {
            alert_type: 'Warning',
            message: `Low balance detected: ${balanceCheck.maticBalance.toFixed(4)} MATIC, $${balanceCheck.usdcBalance.toFixed(2)} USDC`
          }
        });
      }
      
      console.log("✅ BOT: Engine initialized successfully with real trading capability");
      setIsLive(true);
      return true;
    } catch (error) {
      console.error("❌ BOT: LIVE INITIALIZATION FAILED:", error.message);
      setIsLive(false);
      return false;
    }
  }, [recordExecution]);

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
      const bridgedUsdc = parseFloat(ethers.formatUnits(bridgedUsdcWei, Number(bridgedDecimals)));

      setMaticBalance(matic);
      setNativeUsdcBalance(nativeUsdc);
      setBridgedUsdcBalance(bridgedUsdc);
      
      const totalUsdc = nativeUsdc + bridgedUsdc;
      botStateManager.setWalletBalance(totalUsdc); // Update central state
      
      return { totalUsdc };
    } catch (error) {
      console.error("Error fetching balances:", error);
      return { totalUsdc: 0 };
    }
  }, []);

  const loadHistoricalExecutions = useCallback(async () => {
    // Only load if the central state is empty
    if (botStateManager.getState().executions.length === 0) {
      try {
        const historicalData = await BotExecution.list('-created_date', 100);
        botStateManager.setAllExecutions(historicalData || []); // Use central state setter
        console.log(`📊 BOT: Loaded ${historicalData?.length || 0} historical executions into central state`);
      } catch(err) {
        console.error("Error loading historical executions:", err);
      }
    }
    
    await calculateDailyStatsFromDB();
  }, [calculateDailyStatsFromDB]);

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
      const timestampedData = {
        ...executionData,
        created_date: new Date().toISOString()
      };
      
      // Save to DB in the background
      await BotExecution.create(timestampedData);
      
      // Instantly update the central state, which notifies this component
      botStateManager.addExecution(timestampedData);
      
      // Recalculate daily stats from database to stay accurate
      await calculateDailyStatsFromDB();
      
      console.log(`💾 BOT: Recorded execution: ${timestampedData.execution_type}`);
    } catch(err) {
      console.error("❌ BOT: Failed to save execution record:", err);
    }
  }, [calculateDailyStatsFromDB]);

  const executeFlashloanArbitrage = useCallback(async (opportunity, config) => {
    // FIX: Add a redundant, hard-coded safety clamp here as a final guardrail.
    const maxAllowedBySafetyLayer = tradingSafety.getConfig().maxFlashloanAmount;
    const safeFlashloanAmount = Math.min(config.amount, maxAllowedBySafetyLayer);

    if (safeFlashloanAmount < config.amount) {
      const message = `Flashloan amount of $${config.amount.toLocaleString()} was reduced to environment limit of $${safeFlashloanAmount.toLocaleString()}.`;
      console.warn(`🚨 SAFETY OVERRIDE: ${message}`);
      await recordExecution({
        execution_type: 'alert',
        status: 'completed',
        details: { alert_type: 'Safety Override', message }
      });
    }

    if (realTradingEnabled && tradeExecutor) {
      // REAL FLASHLOAN EXECUTION
      console.log(`⚡ REAL FLASHLOAN: Executing ${opportunity.pair} with $${safeFlashloanAmount.toLocaleString()}`);
      
      const result = await tradeExecutor.executeFlashloanArbitrage(opportunity, safeFlashloanAmount);
      
      tradedOpportunityIdsRef.current.add(opportunity.id);

      await recordExecution({
        execution_type: 'flashloan_trade',
        status: result.success ? 'completed' : 'failed',
        profit_realized: result.netProfit,
        gas_used: result.gasUsed,
        details: {
          opportunity: {
            pair: opportunity.pair, 
            buyDex: opportunity.buy_exchange, 
            sellDex: opportunity.sell_exchange,
            profitPercentage: opportunity.profit_percentage, 
            netProfitUsd: result.netProfit,
          },
          loanAmount: safeFlashloanAmount, 
          loanFee: result.fee || (safeFlashloanAmount * 0.0005), 
          provider: config.provider,
          tx_hash: result.txHash,
          realExecution: true,
          error: result.error
        }
      });

      console.log(`💰 REAL FLASHLOAN ${result.success ? 'SUCCESS' : 'FAILED'}: ${result.netProfit > 0 ? '+' : ''}$${result.netProfit.toFixed(2)}${result.txHash ? ` | TX: ${result.txHash}` : ''}`);
    } else {
      // SIMULATION MODE
      console.log(`⚡ FLASHLOAN SIMULATION: Executing ${opportunity.pair} with $${safeFlashloanAmount.toLocaleString()}`);
      
      const grossProfit = safeFlashloanAmount * (opportunity.profit_percentage / 100);
      const loanFee = safeFlashloanAmount * (config.fee_percentage / 100);
      const netProfit = grossProfit - loanFee;

      setLastFlashloanSim({ grossProfit, loanFee, netProfit });
      
      tradedOpportunityIdsRef.current.add(opportunity.id);

      const success = Math.random() > 0.1;
      const status = success ? 'completed' : 'failed';
      const profitRealized = status === 'completed' ? netProfit * (0.95 + Math.random() * 0.05) : -loanFee;
      
      // Generate realistic transaction hash for successful simulated trades
      const txHash = status === 'completed' 
        ? `0x${Math.random().toString(16).substring(2, 15)}${Date.now().toString(16)}${Math.random().toString(16).substring(2, 15)}`
        : null;

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
          loanAmount: safeFlashloanAmount, 
          loanFee: config.fee_percentage, 
          provider: config.provider,
          tx_hash: txHash,
          realExecution: false // Mark as simulation
        }
      });

      console.log(`💰 FLASHLOAN SIMULATION ${status.toUpperCase()}: ${profitRealized > 0 ? '+' : ''}$${profitRealized.toFixed(2)}${txHash ? ` | TX: ${txHash}` : ''}`);
    }
  }, [recordExecution, realTradingEnabled, tradeExecutor]);

  const executeArbitrage = useCallback(async (opportunity) => {
    if (realTradingEnabled && tradeExecutor) {
      // REAL ARBITRAGE EXECUTION
      console.log(`📈 REAL ARBITRAGE: Executing ${opportunity.pair}`);
      
      const tradeAmount = Math.min(botConfig?.max_position_size || 100, opportunity.estimated_profit * 10);
      const result = await tradeExecutor.executeRegularArbitrage(opportunity, tradeAmount);
      
      tradedOpportunityIdsRef.current.add(opportunity.id);
      await ArbitrageOpportunity.update(opportunity.id, { status: 'executed' }).catch(err => console.error(err));

      await recordExecution({
        execution_type: 'trade',
        status: result.success ? 'completed' : 'failed',
        profit_realized: result.netProfit,
        gas_used: result.gasUsed,
        details: { 
          opportunity: {
            pair: opportunity.pair, 
            buyDex: opportunity.buy_exchange, 
            sellDex: opportunity.sell_exchange,
            profitPercentage: opportunity.profit_percentage, 
            netProfitUsd: result.netProfit,
          },
          tx_hash: result.txHash,
          executionTime: result.executionTime,
          slippage: result.slippage,
          realExecution: true,
          error: result.error
        }
      });
      
      console.log(`💰 REAL ARBITRAGE ${result.success ? 'SUCCESS' : 'FAILED'}: ${result.netProfit > 0 ? '+' : ''}$${result.netProfit.toFixed(2)}${result.txHash ? ` | TX: ${result.txHash}` : ''}`);
    } else {
      // SIMULATION MODE
      console.log(`📈 BOT: REGULAR SIMULATION - Executing ${opportunity.pair}`);
      
      tradedOpportunityIdsRef.current.add(opportunity.id);
      await ArbitrageOpportunity.update(opportunity.id, { status: 'executed' }).catch(err => console.error(err));

      const success = Math.random() > 0.15;
      const status = success ? 'completed' : 'failed';
      const actualProfit = success
        ? opportunity.estimated_profit * (0.85 + Math.random() * 0.25)
        : -(opportunity.estimated_profit * 0.5 || 1);
      const gasUsed = (opportunity.gas_estimate || 0.5);
      
      // Generate realistic transaction hash for successful simulated trades
      const txHash = status === 'completed' 
        ? `0x${Math.random().toString(16).substring(2, 15)}${Date.now().toString(16)}${Math.random().toString(16).substring(2, 15)}`
        : null;

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
          tx_hash: txHash,
          realExecution: false // Mark as simulation
        }
      });
      
      console.log(`💰 BOT: REGULAR SIMULATION ${status.toUpperCase()}: ${actualProfit > 0 ? '+' : ''}$${actualProfit.toFixed(2)}${txHash ? ` | TX: ${txHash}` : ''}`);
    }
  }, [recordExecution, realTradingEnabled, tradeExecutor, botConfig]);

  const runTradingLoop = useCallback(async () => {
    try {
      await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Cycle', message: 'Starting trading loop.' } });
      await fetchRealBalances(); // Re-fetch balances at the start of each loop
      const opps = await scanForOpportunities();
      
      if (opps.length > 0) {
        const topOpp = opps[0];
        await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Opportunity Found', message: `Found ${topOpp.pair} at ${topOpp.profit_percentage.toFixed(2)}%` } });
        
        if (flashloanConfig?.enabled) {
          // FIX: Add detailed logging to debug the values being used.
          const envLimit = tradingSafety.getConfig().maxFlashloanAmount;
          const configAmount = flashloanConfig.amount;
          const effectiveFlashloanAmount = Math.min(configAmount, envLimit);
          
          console.log('🤖 BOT DEBUG: Flashloan values', { configAmount, envLimit, effectiveFlashloanAmount });

          const grossProfit = effectiveFlashloanAmount * (topOpp.profit_percentage / 100);
          const loanFee = effectiveFlashloanAmount * (flashloanConfig.fee_percentage / 100);
          const netProfit = grossProfit - loanFee;
          
          await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Flashloan Analysis', message: `Gross: $${grossProfit.toFixed(2)}, Fee: $${loanFee.toFixed(2)}, Net: $${netProfit.toFixed(2)}` } });
          
          if (netProfit > 1) { 
            await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Decision', message: `Executing flashloan, net profit $${netProfit.toFixed(2)} is acceptable.` } });
            // Pass the already-clamped amount to the execution function
            await executeFlashloanArbitrage(topOpp, { ...flashloanConfig, amount: effectiveFlashloanAmount });
          } else {
            await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Decision', message: `Skipping flashloan, net profit $${netProfit.toFixed(2)} is too low.` } });
          }
        } else {
          await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Info', message: `Flashloans are disabled in config.` } });
          // If flashloans are disabled, try regular arbitrage if conditions are met
          // For now, this is kept simple and assumes flashloan is the primary strategy
          // A more complex bot would decide based on capital available vs. flashloan
        }
      } else {
        await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Scan Result', message: 'No profitable opportunities found this cycle.' } });
      }
    } catch (error) {
      console.error("❌ BOT ERROR during trading loop:", error);
      recordExecution({
        execution_type: 'error',
        status: 'failed',
        error_message: error.message
      });
    }
  }, [fetchRealBalances, scanForOpportunities, executeFlashloanArbitrage, executeArbitrage, recordExecution, flashloanConfig, botConfig]);

  useEffect(() => {
    const savedBotState = localStorage.getItem('arbitragebot_running');
    if (savedBotState === 'true' && !isRunning) {
      handleToggleBot(true); 
    }
    loadHistoricalExecutions();
  }, [loadHistoricalExecutions]); // Add dependency here

  const handleToggleBot = async (startSilently = false) => {
    if (isRunning) {
      console.log("🛑 BOT: Stopping...");
      setIsRunning(false);
      setIsLive(false);
      setWalletAddress(null);
      localStorage.setItem('arbitragebot_running', 'false');
      if (globalBotInterval) {
        clearInterval(globalBotInterval);
        globalBotInterval = null;
      }
      // Re-calculate daily stats when stopping, in case any background operation just finished
      await calculateDailyStatsFromDB(); 
      await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Status', message: 'Bot Stopped.' } });
    } else {
      if (!startSilently) {
        await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Status', message: 'Bot Starting...' } });
      }
      console.log("🚀 BOT: Starting...");
      tradedOpportunityIdsRef.current = new Set();
      // Daily stats will be reloaded from DB by loadHistoricalExecutions/recordExecution calls
      
      const success = await initializeEngine();
      if (success) {
        setIsRunning(true);
        localStorage.setItem('arbitragebot_running', 'true');
        
        if (globalBotInterval) clearInterval(globalBotInterval);
        runTradingLoop(); 
        globalBotInterval = setInterval(runTradingLoop, 15000); 
        await recordExecution({ execution_type: 'alert', status: 'completed', details: { alert_type: 'Status', message: 'Bot Started Successfully.' } });
      } else {
        alert("LIVE MODE FAILED: Check console for errors. Ensure your environment variables are set correctly.");
        await recordExecution({ execution_type: 'alert', status: 'failed', details: { alert_type: 'Status', message: 'Bot failed to start. Check console for errors.' } });
      }
    }
  };

  const getStatusColor = () => isRunning ? 'bg-emerald-500' : 'bg-slate-500';
  const getStatusText = () => isRunning ? 'Active' : 'Stopped';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Environment Safety Badge */}
        <div className="mb-4">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${tradingSafety.getEnvironmentBadge().class}`}>
            {tradingSafety.getEnvironmentBadge().text} • Max Flashloan: ${tradingSafety.getConfig().maxFlashloanAmount.toLocaleString()}
          </div>
        </div>

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
                    Flashloan ${Math.min(flashloanConfig.amount, tradingSafety.getConfig().maxFlashloanAmount).toLocaleString()}
                  </Badge>
                )}
                {realTradingEnabled && (
                  <Badge className="bg-red-100 text-red-800">
                    🚨 REAL MONEY MODE
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setRealTradingEnabled(!realTradingEnabled)}
              variant={realTradingEnabled ? "destructive" : "outline"}
              className={realTradingEnabled ? "bg-red-500 hover:bg-red-600" : "border-red-200 text-red-600 hover:bg-red-50"}
            >
              {realTradingEnabled ? "🚨 REAL TRADING ON" : "💫 SIMULATION MODE"}
            </Button>
            <Button
              onClick={() => handleToggleBot()}
              className={`${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              {isRunning ? <><Pause className="w-4 h-4 mr-2" />Stop Bot</> : <><Play className="w-4 h-4 mr-2" />Start Bot</>}
            </Button>
          </div>
        </div>
        
        <Alert className={`mb-6 ${realTradingEnabled ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
          <Bot className="w-4 h-4" />
          <AlertDescription className={realTradingEnabled ? 'text-red-800' : 'text-blue-800'}>
            <strong>{realTradingEnabled ? 'REAL TRADING MODE:' : 'Simulation Mode:'}</strong> 
            {realTradingEnabled 
              ? ` Bot is executing REAL transactions in ${tradingSafety.environment.toUpperCase()} environment. All trades will appear on Polygonscan.`
              : ' Bot is running in simulation mode. No real transactions are being executed.'
            }
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
                    {(nativeUsdcBalance + bridgedUsdcBalance).toLocaleString(undefined, {style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
              <TabsTrigger value="dashboard" className="flex items-center gap-2"><History className="w-4 h-4" />History</TabsTrigger>
              <TabsTrigger value="config" className="flex items-center gap-2"><Settings className="w-4 h-4" />Config</TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-2"><Shield className="w-4 h-4" />Risk</TabsTrigger>
              <TabsTrigger value="leverage" className="flex items-center gap-2"><Zap className="w-4 h-4" />Flashloans</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="activity">
            <LiveActivityFeed isRunning={isRunning} executions={executions} />
          </TabsContent>
          
          <TabsContent value="dashboard">
            <BotExecutionLog executions={executions} />
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
