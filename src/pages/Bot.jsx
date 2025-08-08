
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
  const [diagnostics, setDiagnostics] = useState({ lastScan: null, errors: [] });
  
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

  const [flashloanConfig, setFlashloanConfig] = useState(null);
  const [lastFlashloanSim, setLastFlashloanSim] = useState(null);
  
  const [executions, setExecutions] = useState([]);
  const [dailyStats, setDailyStats] = useState({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });

  const providerRef = useRef(null);
  const walletRef = useRef(null);
  const nativeUsdcContractRef = useRef(null);
  const bridgedUsdcContractRef = useRef(null);
  const intervalRef = useRef(null);
  const tradedOpportunityIdsRef = useRef(new Set());

  const addDiagnostic = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDiagnostics(prev => ({
      ...prev,
      errors: [{timestamp, message, type}, ...prev.errors.slice(0, 9)]
    }));
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  };

  const initializeEngine = useCallback(async () => {
    try {
      addDiagnostic('Starting bot engine initialization...', 'info');
      
      const rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL;
      const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;

      if (!rpcUrl || !privateKey) {
        addDiagnostic('Missing environment variables', 'error');
        throw new Error("Missing VITE_POLYGON_RPC_URL or VITE_WALLET_PRIVATE_KEY in environment variables.");
      }

      addDiagnostic('Creating Web3 provider...', 'info');
      providerRef.current = new ethers.JsonRpcProvider(rpcUrl);
      walletRef.current = new ethers.Wallet(privateKey, providerRef.current);
      const address = await walletRef.current.getAddress();
      setWalletAddress(address);
      
      addDiagnostic(`Wallet connected: ${address.substring(0, 10)}...`, 'success');
      
      nativeUsdcContractRef.current = new ethers.Contract(NATIVE_USDC_CONTRACT_ADDRESS, USDC_ABI, providerRef.current);
      bridgedUsdcContractRef.current = new ethers.Contract(BRIDGED_USDC_CONTRACT_ADDRESS, USDC_ABI, providerRef.current);
      
      addDiagnostic('Smart contracts initialized', 'success');
      setIsLive(true);
      return true;
    } catch (error) {
      addDiagnostic(`Initialization failed: ${error.message}`, 'error');
      console.error("LIVE INITIALIZATION FAILED:", error.message);
      setIsLive(false);
      return false;
    }
  }, []);

  const fetchRealBalances = useCallback(async () => {
    if (!walletRef.current) {
      addDiagnostic('No wallet available for balance fetch', 'warning');
      return { totalUsdc: 0 };
    }
    
    try {
      addDiagnostic('Fetching wallet balances...', 'info');
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
      const bridgedUsdc = parseFloat(ethers.formatUnits(bridgedUsdcWei, Number(bridgedDecimals))); // Fix: Changed 'briddcUsdcWei' to 'bridgedUsdcWei'

      setMaticBalance(matic);
      setNativeUsdcBalance(nativeUsdc);
      setBridgedUsdcBalance(bridgedUsdc);
      
      addDiagnostic(`Balances updated: ${(nativeUsdc + bridgedUsdc).toFixed(2)} USDC, ${matic.toFixed(2)} MATIC`, 'success');
      return { totalUsdc: nativeUsdc + bridgedUsdc };
    } catch (error) {
      addDiagnostic(`Balance fetch error: ${error.message}`, 'error');
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

  const scanForOpportunities = useCallback(async () => {
    try {
      addDiagnostic('Scanning for opportunities...', 'info');
      
      const opportunities = await base44.entities.ArbitrageOpportunity.list({ 
        filter: { status: 'active' },
        sort: '-profit_percentage',
        limit: 10 
      });
      const untradedOpportunities = opportunities.filter(opp => !tradedOpportunityIdsRef.current.has(opp.id));
      
      const filteredOpps = untradedOpportunities.filter(opp => {
        const minProfit = botConfig?.min_profit_threshold || 0.2;
        return opp.profit_percentage >= minProfit;
      });
      
      addDiagnostic(`Found ${filteredOpps.length} profitable opportunities (${opportunities.length} total)`, 'info');
      setDiagnostics(prev => ({ ...prev, lastScan: new Date() }));
      
      return filteredOpps;
    } catch (error) {
      addDiagnostic(`Scan error: ${error.message}`, 'error');
      console.error("Error scanning for opportunities:", error);
      return [];
    }
  }, [botConfig]);

  const executeFlashloanArbitrage = useCallback(async (opportunity, config) => {
    console.log(`🚀 EXECUTING FLASHLOAN: $${config.amount.toLocaleString()} at ${opportunity.profit_percentage.toFixed(2)}% profit`);
    
    // Calculate potential profits
    const grossProfit = config.amount * (opportunity.profit_percentage / 100);
    const loanFee = config.amount * (config.fee_percentage / 100);
    const netProfit = grossProfit - loanFee;

    // Update simulation result for UI
    setLastFlashloanSim({ grossProfit, loanFee, netProfit });

    if (netProfit <= 0) {
      addDiagnostic(`Flashloan unprofitable for opp ${opportunity.id}. Net: ${netProfit.toFixed(2)}`, 'warning');
      console.log(`❌ Flashloan unprofitable for opp ${opportunity.id}. Net: ${netProfit.toFixed(2)}`);
      return;
    }
    addDiagnostic(`Attempting flashloan for ${opportunity.pair} with net profit ${netProfit.toFixed(2)}`, 'info');

    // Mark opportunity as traded
    tradedOpportunityIdsRef.current.add(opportunity.id);
    base44.entities.ArbitrageOpportunity.update(opportunity.id, { status: 'executed' }).catch(err => console.error(err));

    // Simulate execution (90% success rate)
    const status = Math.random() > 0.1 ? 'completed' : 'failed';
    const profitRealized = status === 'completed' ? netProfit * (0.9 + Math.random() * 0.1) : -loanFee;

    const newExecution = {
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
        tx_hash: '0xFLASH_' + ethers.hexlify(ethers.randomBytes(26)).substring(2)
      }
    };

    // Update UI immediately
    setExecutions(prev => [{ ...newExecution, id: 'temp-' + Date.now(), created_date: new Date().toISOString() }, ...prev].slice(0, 50));
    
    // Save to database
    base44.entities.BotExecution.create(newExecution).catch(err => console.error(err));

    // Update daily stats
    setDailyStats(prev => ({
      ...prev,
      trades: prev.trades + 1,
      profit: prev.profit + (status === 'completed' ? profitRealized : 0),
      loss: prev.loss + (status === 'failed' ? Math.abs(profitRealized) : 0),
    }));

    addDiagnostic(`Flashloan ${status} for ${opportunity.pair}: ${status === 'completed' ? '+' : ''}$${profitRealized.toFixed(2)}`, status === 'completed' ? 'success' : 'error');
    console.log(`✅ FLASHLOAN ${status.toUpperCase()}: ${status === 'completed' ? '+' : ''}$${profitRealized.toFixed(2)}`);
  }, []);

  const executeArbitrage = useCallback(async (opportunity) => {
    addDiagnostic(`Attempting regular arbitrage for ${opportunity.pair}`, 'info');

    tradedOpportunityIdsRef.current.add(opportunity.id);
    base44.entities.ArbitrageOpportunity.update(opportunity.id, { status: 'executed' }).catch(err => console.error(err));

    const success = Math.random() > 0.15;
    const status = success ? 'completed' : 'failed';
    const actualProfit = success
      ? opportunity.estimated_profit * (0.85 + Math.random() * 0.25)
      : -(opportunity.estimated_profit * 0.5 || 1);
    const gasUsed = (opportunity.gas_estimate || 0.5);

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
        tx_hash: '0xREG_' + ethers.hexlify(ethers.randomBytes(30)).substring(2)
      }
    };
    
    setExecutions(prev => [{...newExecution, id: 'temp-' + Date.now(), created_date: new Date().toISOString() }, ...prev].slice(0, 50));
    base44.entities.BotExecution.create(newExecution).catch(err => console.error(err));
    
    setDailyStats(prev => ({
      ...prev,
      trades: prev.trades + 1,
      profit: prev.profit + (success ? actualProfit : 0),
      loss: prev.loss + (success ? 0 : Math.abs(actualProfit)),
      gasUsed: prev.gasUsed + gasUsed
    }));

    addDiagnostic(`Arbitrage ${status} for ${opportunity.pair}: ${status === 'completed' ? '+' : ''}$${actualProfit.toFixed(2)}`, status === 'completed' ? 'success' : 'error');
  }, []);

  const runTradingLoop = useCallback(async () => {
    try {
      addDiagnostic('=== TRADING LOOP START ===', 'info');
      
      const { totalUsdc } = await fetchRealBalances();
      const opps = await scanForOpportunities();
      
      // Log scan results
      setExecutions(prev => [{ 
        id: Date.now(), 
        created_date: new Date().toISOString(), 
        execution_type: 'scan', 
        status: 'completed', 
        details: { 
          found: opps.length, 
          total_traded_this_session: tradedOpportunityIdsRef.current.size,
          flashloan_enabled: flashloanConfig?.enabled || false
        }
      }, ...prev].slice(0, 50));
      
      if (opps.length > 0) {
        const topOpp = opps[0];
        addDiagnostic(`Processing top opportunity: ${topOpp.pair} at ${topOpp.profit_percentage.toFixed(2)}%`, 'info');
        
        // PRIORITIZE FLASHLOAN if configured and profitable
        if (flashloanConfig && flashloanConfig.enabled) {
          const potentialGrossProfit = flashloanConfig.amount * (topOpp.profit_percentage / 100);
          const potentialLoanFee = flashloanConfig.amount * (flashloanConfig.fee_percentage / 100);
          const potentialNetProfit = potentialGrossProfit - potentialLoanFee;
          
          if (potentialNetProfit > 5) { // Must be at least $5 profit to justify flashloan
            addDiagnostic(`Executing flashloan trade: $${flashloanConfig.amount.toLocaleString()}`, 'info');
            await executeFlashloanArbitrage(topOpp, flashloanConfig);
            addDiagnostic('=== TRADING LOOP END (Flashloan executed) ===', 'info');
            return; // Exit after flashloan attempt
          }
        }
        
        // Fallback to regular trade if flashloan not viable
        if (totalUsdc >= botConfig.max_position_size) {
          addDiagnostic('Executing regular arbitrage trade', 'info');
          await executeArbitrage(topOpp);
        } else {
          addDiagnostic(`Insufficient balance: ${totalUsdc.toFixed(2)} < ${botConfig.max_position_size} for regular trade`, 'warning');
        }
      } else {
        addDiagnostic('No profitable opportunities found this cycle', 'info');
      }
      
      addDiagnostic('=== TRADING LOOP END ===', 'info');
    } catch (error) {
      addDiagnostic(`Trading loop error: ${error.message}`, 'error');
      console.error("Trading loop error:", error);
    }
  }, [fetchRealBalances, scanForOpportunities, executeArbitrage, executeFlashloanArbitrage, botConfig, flashloanConfig]);

  const handleToggleBot = async () => {
    if (isRunning) {
      addDiagnostic('Stopping bot...', 'info');
      setIsRunning(false);
      setIsLive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        addDiagnostic('Trading loop stopped', 'success');
      }
      setWalletAddress(null);
    } else {
      addDiagnostic('Starting bot...', 'info');
      tradedOpportunityIdsRef.current = new Set();
      setDailyStats({ trades: 0, profit: 0, loss: 0, gasUsed: 0 });
      
      const success = await initializeEngine();
      if (success) {
        setIsRunning(true);
        addDiagnostic('Running first trading cycle...', 'info');
        
        // Run first cycle immediately with a slight delay
        setTimeout(async () => {
          try {
            await runTradingLoop();
            addDiagnostic('First cycle completed, starting interval...', 'success');
          } catch (error) {
            addDiagnostic(`First cycle error: ${error.message}`, 'error');
          }
        }, 1000); // 1 second delay for first run

        // Set up interval for subsequent cycles
        intervalRef.current = setInterval(() => {
          try {
            addDiagnostic('Interval trigger - starting new cycle', 'info');
            runTradingLoop();
          } catch (error) {
            addDiagnostic(`Interval error: ${error.message}`, 'error');
          }
        }, 15000); // 15 seconds
        
        addDiagnostic('Bot started successfully with 15-second intervals', 'success');
      } else {
        addDiagnostic('Bot startup failed - check environment variables', 'error');
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
            onClick={handleToggleBot}
            className={`${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            {isRunning ? <><Pause className="w-4 h-4 mr-2" />Stop Bot</> : <><Play className="w-4 h-4 mr-2" />Start Bot</>}
          </Button>
        </div>

        {!isRunning ? (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-amber-800">
              <strong>Bot Offline:</strong> Click Start to connect your wallet and begin analysis.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6 border-purple-200 bg-purple-50">
            <Zap className="w-4 h-4 text-purple-700" />
            <AlertDescription className="text-purple-800">
              <strong>Flashloan Mode Active:</strong> Bot will attempt flashloan trades with ${flashloanConfig?.amount.toLocaleString() || '25,000'} 
              when opportunities exceed profit thresholds. Wallet <code className="text-xs">{walletAddress}</code> connected.
              <strong> All transactions are simulated</strong> - no real funds at risk during testing.
            </AlertDescription>
          </Alert>
        )}
        
        {isRunning && (
          <div className="mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">🔧 Diagnostics</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-slate-600">Last Scan:</span>
                  <div className="font-medium">{diagnostics.lastScan ? diagnostics.lastScan.toLocaleTimeString() : 'Never'}</div>
                </div>
                <div>
                  <span className="text-sm text-slate-600">Bot Status:</span>
                  <div className={`font-medium ${isRunning ? 'text-green-600' : 'text-red-600'}`}>
                    {isRunning ? 'Active & Scanning' : 'Stopped'}
                  </div>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto bg-slate-50 rounded p-3">
                <div className="text-xs space-y-1">
                  {diagnostics.errors.map((error, index) => (
                    <div key={index} className={`${
                      error.type === 'error' ? 'text-red-600' :
                      error.type === 'warning' ? 'text-amber-600' :
                      error.type === 'success' ? 'text-green-600' :
                      'text-slate-600'
                    }`}>
                      [{error.timestamp}] {error.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">Trades Today</p><h3 className="text-2xl font-bold text-slate-900">{dailyStats.trades}</h3></div><Activity className="w-8 h-8 text-blue-500" /></div></CardContent></Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">Net P&L</p><h3 className={`text-2xl font-bold ${(dailyStats.profit - dailyStats.loss) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${(dailyStats.profit - dailyStats.loss).toFixed(2)}</h3></div><TrendingUp className="w-8 h-8 text-emerald-500" /></div></CardContent></Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">MATIC Balance</p><h3 className="text-2xl font-bold text-purple-600">{maticBalance.toFixed(4)}</h3></div><Zap className="w-8 h-8 text-purple-500" /></div></CardContent></Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">USDC Balance</p>
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
              <TabsTrigger value="leverage" className="flex items-center gap-2"><Zap className="w-4 h-4" />Flashloans</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="dashboard"><BotExecutionLog executions={executions} /></TabsContent>
          <TabsContent value="config"><BotConfigForm config={botConfig} onSubmit={setBotConfig} /></TabsContent>
          <TabsContent value="risk"><RiskControls config={botConfig} dailyStats={dailyStats} onUpdateConfig={setBotConfig} /></TabsContent>
          <TabsContent value="leverage"><LeverageManager onConfigChange={setFlashloanConfig} simulationResult={lastFlashloanSim} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
