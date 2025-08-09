import { ethers } from "ethers";
import { botStateManager } from "./botState";
import { BotExecution } from "@/api/entities";
import { ArbitrageOpportunity } from "@/api/entities";
import RealTradeExecutor from "./RealTradeExecutor";
import { tradingSafety } from "./TradingSafetyLayer";

const NATIVE_USDC_CONTRACT_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const BRIDGED_USDC_CONTRACT_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

class Engine {
  constructor() {
    this.isRunning = false;
    this.isLive = false;
    this.intervalId = null;
    this.tradeExecutor = null;
    this.provider = null;
    this.wallet = null;
    this.nativeUsdcContract = null;
    this.bridgedUsdcContract = null;
    this.tradedOpportunityIds = new Set();
    this.botConfig = {};
    this.flashloanConfig = {};
  }

  updateConfig(newBotConfig, newFlashloanConfig) {
      this.botConfig = { ...this.botConfig, ...newBotConfig };
      this.flashloanConfig = { ...this.flashloanConfig, ...newFlashloanConfig };
      console.log("⚙️ BotEngine: Config updated");
  }

  async start() {
    if (this.isRunning) return;
    console.log("🚀 BotEngine: Starting...");
    this.isRunning = true;
    botStateManager.setBotStatus({ isRunning: this.isRunning, isLive: this.isLive });

    const isReady = await this._initialize();
    if (!isReady) {
      this.stop();
      return;
    }

    await this._loadHistoricalExecutions();
    await this._runTradingLoop();
    this.intervalId = setInterval(() => this._runTradingLoop(), 15000);
  }

  stop() {
    if (!this.isRunning) return;
    console.log("🛑 BotEngine: Stopping...");
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    this.isLive = false;
    botStateManager.setBotStatus({ isRunning: this.isRunning, isLive: this.isLive });
  }

  async _initialize() {
    try {
      console.log("🚀 BotEngine: Initializing engine...");
      const rpcUrl = import.meta.env.VITE_POLYGON_RPC_URL;
      const privateKey = import.meta.env.VITE_WALLET_PRIVATE_KEY;
      if (!rpcUrl || !privateKey) throw new Error("Missing VITE_POLYGON_RPC_URL or VITE_WALLET_PRIVATE_KEY.");

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.nativeUsdcContract = new ethers.Contract(NATIVE_USDC_CONTRACT_ADDRESS, USDC_ABI, this.provider);
      this.bridgedUsdcContract = new ethers.Contract(BRIDGED_USDC_CONTRACT_ADDRESS, USDC_ABI, this.provider);
      this.tradeExecutor = new RealTradeExecutor(this.provider, this.wallet);

      await this._fetchRealBalances();
      
      this.isLive = true;
      botStateManager.setBotStatus({ isRunning: this.isRunning, isLive: this.isLive });
      console.log("✅ BotEngine: Engine initialized successfully.");
      return true;
    } catch (error) {
      console.error("❌ BotEngine: INITIALIZATION FAILED:", error.message);
      this.isLive = false;
      botStateManager.setBotStatus({ isRunning: this.isRunning, isLive: this.isLive });
      return false;
    }
  }

  async _recordExecution(executionData) {
    try {
      const timestampedData = { ...executionData, created_date: new Date().toISOString() };
      await BotExecution.create(timestampedData);
      botStateManager.addExecution(timestampedData);
      await this._calculateDailyStatsFromDB();
    } catch(err) {
      console.error("❌ BotEngine: Failed to save execution record:", err);
    }
  }

  async _calculateDailyStatsFromDB() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const allExecutions = await BotExecution.list('-created_date', 1000);
      const todayExecutions = allExecutions.filter(e => new Date(e.created_date) >= today);
      const todayTrades = todayExecutions.filter(e => e.execution_type === 'trade' || e.execution_type === 'flashloan_trade');
      const completedTrades = todayTrades.filter(e => e.status === 'completed');
      const profit = completedTrades.reduce((sum, trade) => sum + (trade.profit_realized || 0), 0);
      botStateManager.setDailyStats({ trades: todayTrades.length, profit, loss: 0, gasUsed: 0 });
    } catch (error) {
      console.error("Error calculating daily stats:", error);
    }
  }

  async _loadHistoricalExecutions() {
    if (botStateManager.getState().executions.length === 0) {
      const data = await BotExecution.list('-created_date', 100);
      botStateManager.setAllExecutions(data || []);
    }
    await this._calculateDailyStatsFromDB();
  }

  async _fetchRealBalances() {
    if (!this.wallet) return;
    try {
      const address = await this.wallet.getAddress();
      const [nativeUsdcWei, bridgedUsdcWei] = await Promise.all([
        this.nativeUsdcContract.balanceOf(address),
        this.bridgedUsdcContract.balanceOf(address)
      ]);
      const nativeUsdc = parseFloat(ethers.formatUnits(nativeUsdcWei, 6));
      const bridgedUsdc = parseFloat(ethers.formatUnits(bridgedUsdcWei, 6));
      botStateManager.setWalletBalance(nativeUsdc + bridgedUsdc);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  }

  async _scanForOpportunities() {
    try {
      const opportunities = await ArbitrageOpportunity.list('-profit_percentage', 10);
      return opportunities.filter(opp => 
        !this.tradedOpportunityIds.has(opp.id) &&
        opp.profit_percentage >= (this.botConfig.min_profit_threshold || 0.2)
      );
    } catch (error) {
      console.error("BotEngine: Error scanning opportunities:", error);
      return [];
    }
  }

  async _executeFlashloan(opportunity) {
    if (!this.tradeExecutor) return;
    try {
      const amount = this.flashloanConfig.amount || 5000;
      tradingSafety.validateTradeAmount(amount, 'flashloan');
      const result = await this.tradeExecutor.executeFlashloanArbitrage(opportunity, amount);
      await this._recordExecution({
        execution_type: 'flashloan_trade', status: result.success ? 'completed' : 'failed',
        details: { opportunity, result }, profit_realized: result.netProfit,
        gas_used: result.gasUsed, error_message: result.error,
      });
    } catch (error) {
      await this._recordExecution({
        execution_type: 'flashloan_trade', status: 'failed',
        details: { opportunity, error: error.message },
      });
    }
  }

  async _runTradingLoop() {
    console.log("🤖 BotEngine: Trading loop running.");
    await this._fetchRealBalances();
    const opportunities = await this._scanForOpportunities();
    if (opportunities.length === 0) {
      console.log("...no profitable opportunities found this cycle.");
      return;
    }
    const opportunity = opportunities[0];
    this.tradedOpportunityIds.add(opportunity.id);

    if (this.flashloanConfig.enabled) {
      await this._executeFlashloan(opportunity);
    }
  }
}

export const BotEngine = new Engine();