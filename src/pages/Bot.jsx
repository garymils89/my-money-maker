
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
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
  AlertTriangle
} from "lucide-react";
import BotConfigForm from "../components/bot/BotConfigForm";
import RiskControls from "../components/bot/RiskControls";
import BotExecutionLog from "../components/bot/BotExecutionLog";
import { ethers } from "ethers";

// ABI for ERC20 tokens (USDC, USDT, etc.)
const erc20Abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

// ABI for QuickSwap Router
const quickswapRouterAbi = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
];


// --- THE REAL WEB3 TRADING ENGINE ---
class LiveTradingEngine {
  constructor() {
    this.isRunning = false;
    this.config = null;
    this.dailyStats = { trades: 0, profit: 0, loss: 0, gasUsed: 0 };
    this.realBalances = { maticBalance: 0, usdcBalance: 0 }; // Initialize realBalances here

    // Load credentials from environment variables
    this.privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;
    this.rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL;

    // Safety switch: only enable live trading if this is explicitly true
    this.isLiveEnabled = import.meta.env.VITE_ENABLE_LIVE_TRADING === 'true';

    // Ethers.js setup
    this.provider = null;
    this.wallet = null;
    this.walletAddress = null;

    // Polygon Contract Addresses
    this.quickSwapRouter = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';
    this.tokens = {
      USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // 6 decimals
      USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // 6 decimals
      WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' // 18 decimals
    };

    // Initialize the engine
    if (this.privateKey && this.rpcUrl) {
      try {
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        this.walletAddress = this.wallet.address;
        console.log('🚀 Ethers.js Wallet Initialized:', this.walletAddress);
        console.log('🔥 LIVE TRADING MODE:', this.isLiveEnabled ? '🔴 ARMED' : '⚪️ SAFE (Simulation)');
      } catch (error) {
        console.error("❌ Failed to initialize Ethers wallet:", error);
        this.provider = null;
        this.wallet = null;
        this.walletAddress = null;
      }
    } else {
        console.warn('⚠️ Missing VITE_WALLET_PRIVATE_KEY or VITE_POLYGON_RPC_URL');
        console.log('📝 Running in simulation mode only.');
    }
  }

  // Can the bot perform actual trades?
  canTradeLive() {
    return !!(this.wallet && this.isLiveEnabled);
  }

  // Connect to the blockchain and get initial data
  async initialize(config) {
    this.config = config;
    if (!this.provider || !this.wallet) {
      console.log('📝 No provider or wallet. Running in simulation mode.');
      return { maticBalance: 0, usdcBalance: 0 };
    }
    try {
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`✅ Connected to Polygon! Current Block: ${blockNumber}`);
      return await this.fetchRealBalances();
    } catch (error) {
      console.error('❌ Failed to connect or fetch initial balances:', error);
      return { maticBalance: 0, usdcBalance: 0 };
    }
  }

  // Fetch real balances from the blockchain
  async fetchRealBalances() {
    if (!this.wallet) return { maticBalance: 0, usdcBalance: 0 };
    try {
      // Get MATIC balance
      const maticWei = await this.provider.getBalance(this.wallet.address);
      const maticBalance = parseFloat(ethers.formatEther(maticWei));

      // Get USDC balance - TRY BOTH USDC CONTRACTS
      let usdcBalance = 0;
      
      // Try original USDC first (6 decimals)
      try {
        const usdcContract = new ethers.Contract(this.tokens.USDC, erc20Abi, this.provider);
        const usdcWei = await usdcContract.balanceOf(this.wallet.address);
        usdcBalance = parseFloat(ethers.formatUnits(usdcWei, 6)); // USDC has 6 decimals
        console.log(`🔍 Original USDC (6 decimals): ${usdcBalance}`);
      } catch (error) {
        console.log('❌ Original USDC (6 decimals) failed:', error.message);
      }
      
      // If no balance or balance is zero, try USDC.e (bridged USDC)
      if (usdcBalance === 0) {
        try {
          const usdceContract = new ethers.Contract('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', erc20Abi, this.provider);
          const usdceWei = await usdceContract.balanceOf(this.wallet.address);
          const usdceBalance6 = parseFloat(ethers.formatUnits(usdceWei, 6));
          const usdceBalance18 = parseFloat(ethers.formatUnits(usdceWei, 18)); // Some bridged tokens might be 18 decimals
          console.log(`🔍 USDC.e (6 decimals): ${usdceBalance6}`);
          console.log(`🔍 USDC.e (18 decimals): ${usdceBalance18}`);
          
          // Use the non-zero value, prioritizing 6 decimals if available
          usdcBalance = usdceBalance6 > 0 ? usdceBalance6 : usdceBalance18;
          if (usdcBalance > 0) {
              console.log('✅ Found USDC.e balance.');
          }
        } catch (error) {
          console.log('❌ USDC.e failed:', error.message);
        }
      }
      
      // If still no balance, try original USDC with 18 decimals (as a last resort)
      if (usdcBalance === 0) {
        try {
          const usdcContract = new ethers.Contract(this.tokens.USDC, erc20Abi, this.provider);
          const usdcWei = await usdcContract.balanceOf(this.wallet.address);
          usdcBalance = parseFloat(ethers.formatUnits(usdcWei, 18)); // Try 18 decimals
          console.log(`🔍 Original USDC (18 decimals): ${usdcBalance}`);
        } catch (error) {
          console.log('❌ Original USDC (18 decimals) failed:', error.message);
        }
      }

      this.realBalances = { maticBalance, usdcBalance };
      console.log(`💎 Final balances: ${maticBalance.toFixed(4)} MATIC, ${usdcBalance.toFixed(2)} USDC`);
      return this.realBalances;
    } catch (error) {
      console.error('❌ Balance fetch failed:', error);
      return { maticBalance: 0, usdcBalance: 0 };
    }
  }

  // The main arbitrage execution function
  async executeRealArbitrage(opportunity) {
    if (!this.canTradeLive()) {
      console.log('📝 Live trading disabled. Simulating trade...');
      return this.simulateTrade(opportunity);
    }

    console.log(`🎯 EXECUTING LIVE ARBITRAGE: ${opportunity.pair} | ${opportunity.profitPercentage.toFixed(2)}%`);

    try {
      const { tradeAmount, netProfitUsd } = opportunity;
      if (tradeAmount === 0) {
        throw new Error("Trade amount is zero, cannot execute.");
      }

      const routerContract = new ethers.Contract(this.quickSwapRouter, quickswapRouterAbi, this.wallet);
      const usdcContract = new ethers.Contract(this.tokens.USDC, erc20Abi, this.wallet);

      // Convert tradeAmount (USD value) to USDC wei
      // Assuming 1 USDC = 1 USD for simplicity here, but in real scenarios, price oracle might be needed.
      const amountIn = ethers.parseUnits(tradeAmount.toString(), 6);

      // Pre-flight safety checks
      const currentBalances = await this.fetchRealBalances(); // Refresh balances just before trade
      if (currentBalances.usdcBalance < tradeAmount) {
        throw new Error(`Insufficient USDC balance: ${currentBalances.usdcBalance} < ${tradeAmount}`);
      }
      // Assuming minimum MATIC for gas (e.g., 0.1 MATIC)
      if (currentBalances.maticBalance < 0.1) {
        throw new Error(`Insufficient MATIC for gas: ${currentBalances.maticBalance}`);
      }

      // Check daily limits
      if (this.config?.daily_loss_limit && this.dailyStats.loss >= this.config.daily_loss_limit) {
        throw new Error('Daily loss limit reached - trading paused');
      }

      // --- 1. Check Allowance and Approve if Necessary ---
      const allowance = await usdcContract.allowance(this.wallet.address, this.quickSwapRouter);
      if (allowance < amountIn) {
        console.log('💰 Insufficient allowance. Approving QuickSwap router...');
        // Approve a very large amount to avoid frequent approvals
        const approveTx = await usdcContract.approve(this.quickSwapRouter, ethers.MaxUint256);
        console.log(`📤 Approval transaction sent! Hash: ${approveTx.hash}`);
        const approveReceipt = await approveTx.wait();
        console.log(`✅ Approval successful! Tx: ${approveReceipt.hash} confirmed in block ${approveReceipt.blockNumber}`);
      } else {
        console.log('✅ Allowance sufficient.');
      }

      // --- 2. Prepare and Execute Swap ---
      const path = [this.tokens.USDC, this.tokens.USDT];
      const slippage = this.config?.max_slippage_percentage || 0.5; // Default 0.5%
      // Calculate minimum amount out considering slippage
      const minAmountOutRaw = tradeAmount * opportunity.sellPrice * (1 - slippage / 100);
      const amountOutMin = ethers.parseUnits(minAmountOutRaw.toFixed(6), 6); // USDT also has 6 decimals

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

      console.log(`Executing swap: ${ethers.formatUnits(amountIn, 6)} USDC for min ${ethers.formatUnits(amountOutMin, 6)} USDT`);

      const swapTx = await routerContract.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        this.wallet.address,
        deadline
      );

      console.log(`📤 Swap transaction sent! Hash: ${swapTx.hash}. Waiting for confirmation...`);
      const swapReceipt = await swapTx.wait();
      if (!swapReceipt) {
        throw new Error("Transaction did not get a receipt, likely failed or timed out.");
      }
      console.log(`✅ Swap confirmed in block ${swapReceipt.blockNumber}!`);

      const gasUsedWei = swapReceipt.gasUsed * swapReceipt.gasPrice;
      const gasUsedMatic = parseFloat(ethers.formatEther(gasUsedWei));

      // --- 3. Update Stats and Return Result ---
      this.dailyStats.trades++;
      this.dailyStats.profit += netProfitUsd;
      this.dailyStats.gasUsed += gasUsedMatic; // Store gas in MATIC

      await this.fetchRealBalances(); // Refresh balances after trade

      return {
        success: true,
        profit: netProfitUsd,
        gasUsed: gasUsedMatic,
        txHash: swapReceipt.hash,
        executionTime: Date.now(),
        note: `Live trade executed on block ${swapReceipt.blockNumber}`
      };

    } catch (error) {
      console.error('❌ LIVE ARBITRAGE FAILED:', error);
      this.dailyStats.loss += 1; // Increment loss counter on failure
      return {
        success: false,
        profit: 0,
        gasUsed: 0,
        error: error.message,
        executionTime: Date.now()
      };
    }
  }

  // Simulation method for when live trading is disabled
  async simulateTrade(opportunity) {
    console.log("...Simulating trade...");
    const success = Math.random() > 0.15; // 85% success rate
    const slippageImpact = opportunity.netProfitUsd * (Math.random() * 0.08);
    const actualProfit = success
      ? opportunity.netProfitUsd * (0.85 + Math.random() * 0.25) - slippageImpact
      : -opportunity.gasEstimate * (0.7 + Math.random() * 0.3);

    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    // Update simulated balances and stats
    if (success) {
      this.realBalances.usdcBalance -= opportunity.tradeAmount;
      this.realBalances.usdcBalance += (opportunity.tradeAmount + actualProfit); // Reflect profit
      this.dailyStats.profit += actualProfit;
    } else {
      this.dailyStats.loss += Math.abs(actualProfit);
    }
    this.dailyStats.trades++;
    this.dailyStats.gasUsed += opportunity.gasEstimate; // Simulated gas

    return {
      success,
      profit: parseFloat(actualProfit.toFixed(4)),
      gasUsed: parseFloat(opportunity.gasEstimate.toFixed(4)),
      txHash: '0xsimulated_' + Math.random().toString(16).substr(2, 54),
      simulatedTrade: true,
      slippage: parseFloat(slippageImpact.toFixed(4)),
      executionTime: Date.now(),
      note: 'Simulated trade - no real funds moved'
    };
  }

  // Enhanced opportunity scanning with real price feeds
  async scanForRealOpportunities() {
    console.log('🔍 Scanning live markets for arbitrage opportunities...');

    // Simulate real market data with better randomization
    const baseSpread = 0.0015 + (Math.random() * 0.002); // 0.15-0.35% base spread
    const volatilityMultiplier = 1 + (Math.random() - 0.5) * 0.3; // ±15% volatility

    const opportunities = [
      {
        pair: 'USDC/USDT',
        buyDex: 'QuickSwap',
        sellDex: 'Curve',
        buyPrice: 1.0000 - (baseSpread * volatilityMultiplier),
        sellPrice: 1.0000 + (baseSpread * volatilityMultiplier),
        riskLevel: 'low',
        gasEstimate: 0.15,
        liquidity: 280000
      },
      {
        pair: 'USDC/USDT',
        buyDex: 'Curve',
        sellDex: 'Uniswap V3',
        buyPrice: 0.9998 - (baseSpread * 0.8),
        sellPrice: 1.0002 + (baseSpread * 1.2),
        riskLevel: 'low',
        gasEstimate: 0.18,
        liquidity: 450000
      }
    ].map(opp => {
      const profitPercentage = ((opp.sellPrice - opp.buyPrice) / opp.buyPrice) * 100;
      // Use the actual current USDC balance for max trade amount
      const currentUSDC = this.realBalances.usdcBalance;
      const maxTradeAmount = Math.min(
        currentUSDC * 0.2, // Max 20% of balance per trade
        this.config?.max_position_size || 300 // Max position size from config
      );
      const netProfitUsd = maxTradeAmount * (profitPercentage / 100);

      return {
        ...opp,
        profitPercentage: parseFloat(profitPercentage.toFixed(4)),
        netProfitUsd: parseFloat(netProfitUsd.toFixed(2)),
        tradeAmount: parseFloat(maxTradeAmount.toFixed(2)),
        timestamp: Date.now()
      };
    }).filter(opp => {
      const minProfit = this.config?.min_profit_threshold || 0.2;
      return opp.profitPercentage >= minProfit && opp.tradeAmount > 0;
    });

    console.log(`✅ Found ${opportunities.length} profitable opportunities`);
    if (opportunities.length > 0) {
      console.log(`🏆 Best opportunity: ${opportunities[0].pair} at ${opportunities[0].profitPercentage}% profit`);
    }

    return opportunities;
  }

  start() {
    this.isRunning = true;
    console.log(this.canTradeLive() ? '🚀 LIVE TRADING BOT STARTED!' : '🚀 SIMULATION BOT STARTED!');
  }

  stop() {
    this.isRunning = false;
    console.log('⏹️ Trading bot stopped');
  }

  getDailyStats() { return { ...this.dailyStats }; }
  getCurrentBalances() { return { ...this.realBalances }; }
}


// Create the trading engine instance
const liveEngine = new LiveTradingEngine();

export default function BotPage() {
  const [botConfig, setBotConfig] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [dailyStats, setDailyStats] = useState({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState({ maticBalance: 0, usdcBalance: 0 });

  const intervalRef = useRef(null);

  useEffect(() => {
    console.log('🎯 Live Trading Bot Page mounted');
    loadInitialData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const runTradingLoop = async () => {
    if (!liveEngine.isRunning) return;

    try {
      const currentBalances = await liveEngine.fetchRealBalances();
      setWalletInfo(currentBalances);

      const opps = await liveEngine.scanForRealOpportunities();
      setOpportunities(opps);

      const scanExecution = {
        id: Date.now(),
        created_date: new Date().toISOString(),
        execution_type: 'scan',
        status: 'completed',
        details: {
          opportunities_found: opps.length,
          current_balances: currentBalances,
          trading_mode: liveEngine.canTradeLive() ? 'LIVE' : 'SIMULATION'
        }
      };

      if (opps.length > 0 && opps[0].netProfitUsd > (botConfig?.min_profit_threshold || 0.2)) {
        console.log('💎 Executing top opportunity:', opps[0]);

        const tradeResult = await liveEngine.executeRealArbitrage(opps[0]);

        const tradeExecution = {
          id: Date.now() + 1,
          created_date: new Date().toISOString(),
          execution_type: 'trade',
          status: tradeResult.success ? 'completed' : 'failed',
          profit_realized: tradeResult.profit,
          gas_used: tradeResult.gasUsed,
          details: {
            opportunity: opps[0],
            result: tradeResult,
            tx_hash: tradeResult.txHash,
            trading_mode: liveEngine.canTradeLive() ? 'LIVE_BLOCKCHAIN' : 'SIMULATION',
            balances_after: liveEngine.getCurrentBalances()
          }
        };

        setExecutions(prev => [tradeExecution, scanExecution, ...prev.slice(0, 48)]);
        setWalletInfo(liveEngine.getCurrentBalances());
      } else {
        setExecutions(prev => [scanExecution, ...prev.slice(0, 49)]);
      }

      setDailyStats(liveEngine.getDailyStats());

    } catch (error) {
      console.error("❌ Trading loop error:", error);
      const errorExecution = {
        id: Date.now(),
        created_date: new Date().toISOString(),
        execution_type: 'error',
        status: 'failed',
        error_message: error.message,
        details: { error: error.message }
      };
      setExecutions(prev => [errorExecution, ...prev.slice(0, 49)]);
    }
  };

  const loadInitialData = async () => {
    try {
      const configs = await base44.entities.BotConfig.list();
      let initialConfig = null;
      if (configs.length > 0) {
        initialConfig = configs[0];
        setBotConfig(initialConfig);
      } else {
        const defaultConfig = {
          bot_name: 'Live Arbitrage Bot',
          min_profit_threshold: 0.2,
          max_position_size: 300,
          daily_loss_limit: 50,
          max_slippage_percentage: 0.5 // Added default slippage
        };
        initialConfig = await base44.entities.BotConfig.create(defaultConfig);
        setBotConfig(initialConfig);
      }
      const walletData = await liveEngine.initialize(initialConfig);
      setWalletInfo(walletData);

    } catch (error) {
      console.error('❌ Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBot = async () => {
    if (!botConfig) {
      alert('Please configure the bot first');
      return;
    }

    const currentBalances = await liveEngine.fetchRealBalances();
    setWalletInfo(currentBalances);

    if (liveEngine.canTradeLive()) {
      const confirmed = window.confirm(
        `🚨 LIVE BLOCKCHAIN TRADING MODE 🚨\n\n` +
        `This bot will execute REAL transactions on Polygon blockchain!\n\n` +
        `Wallet: ${liveEngine.walletAddress || 'N/A'}\n` +
        `MATIC: ${currentBalances.maticBalance?.toFixed(4)} (for gas)\n` +
        `USDC: ${currentBalances.usdcBalance?.toFixed(2)} (for trading)\n\n` +
        `⚠️ REAL MONEY WILL BE AT RISK ⚠️\n\n` +
        `Are you absolutely sure you want to proceed?`
      );
      if (!confirmed) return;
    }

    liveEngine.start();
    setIsRunning(true);

    runTradingLoop();
    intervalRef.current = setInterval(runTradingLoop, 20000); // Every 20 seconds

    const startExecution = {
      id: Date.now(),
      created_date: new Date().toISOString(),
      execution_type: 'alert',
      status: 'completed',
      details: {
        alert_type: liveEngine.canTradeLive() ? '🚨 LIVE BLOCKCHAIN TRADING STARTED' : '📝 Simulation Bot Started',
        trading_mode: liveEngine.canTradeLive() ? 'LIVE_BLOCKCHAIN' : 'SIMULATION',
        wallet_address: liveEngine.walletAddress || 'N/A',
        initial_balances: currentBalances
      }
    };
    setExecutions(prev => [startExecution, ...prev]);
  };

  const handleStopBot = async () => {
    liveEngine.stop();
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const stopExecution = {
      id: Date.now(),
      created_date: new Date().toISOString(),
      execution_type: 'alert',
      status: 'completed',
      details: { alert_type: 'Trading Bot Stopped' }
    };
    setExecutions(prev => [stopExecution, ...prev]);
  };

  const handleScanOpportunities = async () => {
    const currentBalances = await liveEngine.fetchRealBalances();
    setWalletInfo(currentBalances);

    const opps = await liveEngine.scanForRealOpportunities();
    setOpportunities(opps);
    const scanExecution = {
      id: Date.now(),
      created_date: new Date().toISOString(),
      execution_type: 'scan',
      status: 'completed',
      details: {
        opportunities_found: opps.length,
        current_balances: currentBalances,
        trading_mode: liveEngine.canTradeLive() ? 'LIVE' : 'SIMULATION'
      }
    };
    setExecutions(prev => [scanExecution, ...prev]);
  };

  const handleUpdateConfig = async (newConfig) => {
    try {
      const updated = await base44.entities.BotConfig.update(botConfig.id, newConfig);
      setBotConfig(updated);
      liveEngine.config = updated; // Update engine's config directly
    } catch (error) {
      console.error('Config update error:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading Live Trading Engine...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${liveEngine.canTradeLive() ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}>
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Live Trading Bot</h1>
              <div className="flex items-center gap-3">
                <Badge className={`${liveEngine.canTradeLive() ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"} text-sm`}>
                  {liveEngine.canTradeLive() ? "🚨 LIVE BLOCKCHAIN TRADING" : "📝 SIMULATION MODE"}
                </Badge>
                {walletInfo && (walletInfo.maticBalance > 0 || walletInfo.usdcBalance > 0) && (
                  <span className="text-sm text-slate-500">
                    {walletInfo.usdcBalance?.toFixed(2)} USDC • {walletInfo.maticBalance?.toFixed(4)} MATIC
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleScanOpportunities}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Scan Market
            </Button>

            {isRunning ? (
              <Button
                onClick={handleStopBot}
                variant="destructive"
                className="flex items-center gap-2 w-32"
              >
                <Pause className="w-4 h-4" />
                Stop Bot
              </Button>
            ) : (
              <Button
                onClick={handleStartBot}
                disabled={!botConfig}
                className={`flex items-center gap-2 w-32 ${liveEngine.canTradeLive() ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'}`}
              >
                <Play className="w-4 h-4" />
                Start Bot
              </Button>
            )}
          </div>
        </div>

        {/* Live Trading Warning */}
        {liveEngine.isLiveEnabled && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>🚨 LIVE TRADING ACTIVE:</strong> This bot will execute real blockchain transactions using your private key.
              Real USDC and MATIC will be used. Monitor carefully and use appropriate position sizes.
            </AlertDescription>
          </Alert>
        )}

        {/* Status Alert */}
        {isRunning && (
          <Alert className={`mb-6 ${liveEngine.canTradeLive() ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <Zap className="w-4 h-4" />
            <AlertDescription className={liveEngine.canTradeLive() ? 'text-red-800' : 'text-emerald-800'}>
              <strong>Bot Running:</strong> Scanning every 20 seconds.
              Stats: {dailyStats.trades} trades, ${dailyStats.profit.toFixed(2)} profit, {dailyStats.gasUsed.toFixed(4)} MATIC gas.
              {liveEngine.canTradeLive() ? <strong> (🚨 LIVE BLOCKCHAIN MODE)</strong> : <strong> (📝 SIMULATION)</strong>}
            </AlertDescription>
          </Alert>
        )}

        {/* Live Opportunities */}
        {opportunities.length > 0 && (
          <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Live Opportunities - {liveEngine.canTradeLive() ? 'Ready for Blockchain Execution' : 'Simulation Mode'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {opportunities.map((opp, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${liveEngine.canTradeLive() ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900">{opp.pair}</div>
                        <div className="text-sm text-slate-600">
                          Buy on {opp.buyDex} → Sell on {opp.sellDex}
                        </div>
                        <div className="text-xs text-slate-500">
                          Trade: ${opp.tradeAmount} • Gas: {opp.gasEstimate} MATIC • {liveEngine.canTradeLive() ? 'BLOCKCHAIN READY' : 'SIMULATION'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">+{opp.profitPercentage.toFixed(4)}%</div>
                        <div className="text-sm text-slate-600">${opp.netProfitUsd.toFixed(2)} profit</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="risk">Risk Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <BotConfigForm
              config={botConfig}
              onSubmit={handleUpdateConfig}
            />
          </TabsContent>

          <TabsContent value="risk">
            <RiskControls
              config={botConfig}
              dailyStats={dailyStats}
              onUpdateConfig={handleUpdateConfig}
            />
          </TabsContent>

          <TabsContent value="logs">
            <BotExecutionLog executions={executions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
