
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Play, Pause, Power, AlertTriangle } from "lucide-react";
import { ethers } from "ethers";
import { tradingSafety } from "../components/bot/TradingSafetyLayer";
import { BotExecution } from "@/api/entities";
import { ArbitrageOpportunity } from "@/api/entities";
import BotDashboard from "../components/bot/BotDashboard";
import LiveActivityFeed from "../components/bot/LiveActivityFeed";
import RealTradeExecutor from "../components/bot/RealTradeExecutor";
import { botStateManager } from "../components/bot/botState";
import { Badge } from "@/components/ui/badge"; // Added missing import for Badge

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
  const [walletAddress, setWalletAddress] = useState('');
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

  const [flashloanConfig, setFlashloanConfig] = useState({
    enabled: true,
    amount: 5000,
    provider: 'aave',
    fee_percentage: 0.09
  });
  
  // FIX: Initialize with a safe, empty array. State will be populated on mount.
  const [executions, setExecutions] = useState([]);
  const [dailyStats, setDailyStats] = useState({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });

  const [tradeExecutor, setTradeExecutor] = useState(null);

  // --- Refs for wallet and contracts ---
  const providerRef = useRef(null);
  const walletRef = useRef(null);
  const nativeUsdcContractRef = useRef(null);
  const bridgedUsdcContractRef = useRef(null);
  const tradedOpportunityIdsRef = useRef(new Set());

  // --- FIX: Refs to hold latest function versions to break dependency cycles ---
  const functionsRef = useRef({});

  // FIX: Consolidate all on-mount logic into a single useEffect hook.
  useEffect(() => {
    // 1. Sync state from external modules now that they are safely loaded.
    setExecutions(botStateManager.getState().executions);
    setFlashloanConfig(prev => ({
        ...prev,
        amount: tradingSafety.getConfig().maxFlashloanAmount
    }));

    // 2. Subscribe to future updates from the state manager.
    const unsubscribe = botStateManager.subscribe(state => {
      setExecutions(state.executions);
      if (state.dailyStats) setDailyStats(state.dailyStats);
    });
    
    // 3. Return the cleanup function.
    return unsubscribe;
  }, []); // Empty dependency array ensures this runs only once on mount.

  // --- Keep the functionsRef updater ---
  useEffect(() => {
    // Keep the refs updated with the latest functions
    functionsRef.current = {
      calculateDailyStatsFromDB,
      recordExecution,
      initializeEngine,
      fetchRealBalances,
      loadHistoricalExecutions,
      scanForOpportunities,
      executeTrade,
      executeFlashloan,
      runTradingLoop,
      startBot,
      stopBot,
    };
  });

  // --- Core Bot Logic Functions ---

  const calculateDailyStatsFromDB = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const allExecutions = await BotExecution.list('-created_date', 1000);
      const todayExecutions = allExecutions.filter(e => new Date(e.created_date) >= today);
      const todayTrades = todayExecutions.filter(e => e.execution_type === 'trade' || e.execution_type === 'flashloan_trade');
      const completedTrades = todayTrades.filter(e => e.status === 'completed');
      const failedTrades = todayTrades.filter(e => e.status === 'failed');
      const profit = completedTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);
      const loss = failedTrades.reduce((sum, trade) => sum + Math.abs(trade.profit_realized || 0), 0);
      const gasUsed = todayTrades.reduce((sum, trade) => sum + (trade.gas_used || 0), 0);
      const newStats = { trades: todayTrades.length, profit, loss, gasUsed };
      botStateManager.setDailyStats(newStats);
      console.log(`📊 Daily stats updated: ${todayTrades.length} trades, $${profit.toFixed(2)} profit`);
      return newStats;
    } catch (error) {
      console.error("Error calculating daily stats:", error);
      return null;
    }
  }, []);

  const recordExecution = useCallback(async (executionData) => {
    try {
      const timestampedData = { ...executionData, created_date: new Date().toISOString() };
      await BotExecution.create(timestampedData);
      botStateManager.addExecution(timestampedData);
      await functionsRef.current.calculateDailyStatsFromDB();
      console.log(`💾 BOT: Recorded execution: ${timestampedData.execution_type}`);
    } catch(err) {
      console.error("❌ BOT: Failed to save execution record:", err);
    }
  }, []);

  const initializeEngine = useCallback(async () => {
    try {
      console.log("🚀 BOT: Starting engine initialization...");
      const rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL;
      const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;

      if (!rpcUrl || !privateKey) throw new Error("Missing VITE_POLYGON_RPC_URL or VITE_WALLET_PRIVATE_KEY.");

      providerRef.current = new ethers.JsonRpcProvider(rpcUrl);
      walletRef.current = new ethers.Wallet(privateKey, providerRef.current);
      const address = await walletRef.current.getAddress();
      setWalletAddress(address);
      
      nativeUsdcContractRef.current = new ethers.Contract(NATIVE_USDC_CONTRACT_ADDRESS, USDC_ABI, providerRef.current);
      bridgedUsdcContractRef.current = new ethers.Contract(BRIDGED_USDC_CONTRACT_ADDRESS, USDC_ABI, providerRef.current);
      
      const executor = new RealTradeExecutor(providerRef.current, walletRef.current);
      setTradeExecutor(executor);
      
      const balanceCheck = await executor.validateWalletBalance();
      if (!balanceCheck.canTrade) {
        console.warn("⚠️ Wallet balance too low for real trading:", balanceCheck);
        await functionsRef.current.recordExecution({
          execution_type: 'alert', status: 'completed',
          details: { alert_type: 'Warning', message: `Low balance: ${balanceCheck.maticBalance.toFixed(4)} MATIC, $${balanceCheck.usdcBalance.toFixed(2)} USDC` }
        });
      }
      
      console.log("✅ BOT: Engine initialized successfully.");
      setIsLive(true);
      return true;
    } catch (error) {
      console.error("❌ BOT: INITIALIZATION FAILED:", error.message);
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
      const bridgedUsdc = parseFloat(ethers.formatUnits(bridgedUsdcWei, Number(bridgedDecimals)));
      setMaticBalance(matic);
      setNativeUsdcBalance(nativeUsdc);
      setBridgedUsdcBalance(bridgedUsdc);
      const totalUsdc = nativeUsdc + bridgedUsdc;
      botStateManager.setWalletBalance(totalUsdc);
      return { totalUsdc };
    } catch (error) {
      console.error("Error fetching balances:", error);
      return { totalUsdc: 0 };
    }
  }, []);

  const loadHistoricalExecutions = useCallback(async () => {
    if (botStateManager.getState().executions.length === 0) {
      try {
        const historicalData = await BotExecution.list('-created_date', 100);
        botStateManager.setAllExecutions(historicalData || []);
        console.log(`📊 BOT: Loaded ${historicalData?.length || 0} historical executions.`);
      } catch(err) {
        console.error("Error loading historical executions:", err);
      }
    }
    await functionsRef.current.calculateDailyStatsFromDB();
  }, []);

  const scanForOpportunities = useCallback(async () => {
    try {
      const opportunities = await ArbitrageOpportunity.list('-profit_percentage', 10);
      const untradedOpportunities = opportunities.filter(opp => !tradedOpportunityIdsRef.current.has(opp.id));
      const filteredOpps = untradedOpportunities.filter(opp => opp.profit_percentage >= (botConfig?.min_profit_threshold || 0.2));
      return filteredOpps;
    } catch (error) {
      console.error("BOT: Error scanning opportunities:", error);
      return [];
    }
  }, [botConfig]);

  const executeTrade = useCallback(async (opportunity) => {
    console.log(`📈 TRADE: Executing ${opportunity.pair} with $${botConfig.max_position_size}`);
    // ... Trade logic would go here
  }, [botConfig.max_position_size]);

  const executeFlashloan = useCallback(async (opportunity) => {
    if (!tradeExecutor) return console.error("Trade executor not initialized.");
    
    try {
      tradingSafety.validateTradeAmount(flashloanConfig.amount, 'flashloan');
      console.log(`⚡ FLASHLOAN TRADE: Executing ${opportunity.pair} with $${flashloanConfig.amount}`);
      const result = await tradeExecutor.executeFlashloanArbitrage(opportunity, flashloanConfig.amount);
      
      await functionsRef.current.recordExecution({
        execution_type: 'flashloan_trade',
        opportunity_id: opportunity.id,
        status: result.success ? 'completed' : 'failed',
        details: { opportunity, result },
        profit_realized: result.netProfit,
        gas_used: result.gasUsed,
        execution_time_ms: result.executionTime,
        error_message: result.error,
      });
      console.log(`💰 FLASHLOAN COMPLETED: +$${result.netProfit?.toFixed(2)} | TX: ${result.txHash}`);
    } catch (error) {
      console.error(`❌ FLASHLOAN FAILED: ${error.message}`);
      await functionsRef.current.recordExecution({
        execution_type: 'flashloan_trade', status: 'failed',
        details: { opportunity, error: error.message },
      });
    }
  }, [tradeExecutor, flashloanConfig]);

  const runTradingLoop = useCallback(async () => {
    console.log("🤖 BOT: Trading loop started.");
    await functionsRef.current.fetchRealBalances();
    const opportunities = await functionsRef.current.scanForOpportunities();
    if (opportunities.length === 0) {
      console.log("...no profitable opportunities found this cycle.");
      return;
    }
    const opportunity = opportunities[0];
    console.log(`✅ BOT: Found opportunity! ${opportunity.pair} at ${opportunity.profit_percentage.toFixed(2)}%`);
    tradedOpportunityIdsRef.current.add(opportunity.id);

    if (flashloanConfig.enabled) {
      await functionsRef.current.executeFlashloan(opportunity);
    } else {
      await functionsRef.current.executeTrade(opportunity);
    }
  }, [flashloanConfig.enabled]);

  const startBot = useCallback(async () => {
    console.log("🚀 BOT: Starting...");
    setIsRunning(true);
    const isReady = await functionsRef.current.initializeEngine();
    if (!isReady) {
      setIsRunning(false);
      return;
    }
    await functionsRef.current.loadHistoricalExecutions();
    functionsRef.current.runTradingLoop();
    globalBotInterval = setInterval(() => functionsRef.current.runTradingLoop(), 15000);
  }, []);

  const stopBot = useCallback(() => {
    console.log("🛑 BOT: Stopping...");
    if (globalBotInterval) clearInterval(globalBotInterval);
    setIsRunning(false);
    setIsLive(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-orange-500" />
                  <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Trading Bot Controls
                  </span>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-emerald-100 text-emerald-800" : ""}>
                    {isLive ? "LIVE" : "OFFLINE"}
                  </Badge>
                  <Button
                    onClick={isRunning ? functionsRef.current.stopBot : functionsRef.current.startBot}
                    className={`transition-all duration-300 ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                  >
                    {isRunning ? (
                      <><Pause className="w-4 h-4 mr-2" /><span>Stop Bot</span></>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" /><span>Start Bot</span></>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <BotDashboard
                  stats={{ ...dailyStats, isRunning }}
                  wallet={{ address: walletAddress, nativeUsdc: nativeUsdcBalance, bridgedUsdc: bridgedUsdcBalance, matic: maticBalance }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <LiveActivityFeed executions={executions} />
          </div>
        </div>
      </div>
    </div>
  );
}
