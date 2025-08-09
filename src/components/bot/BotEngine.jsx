import { ethers } from "ethers";
import { botStateManager } from "./botState";
import { databaseManager } from "./DatabaseManager";

const NATIVE_USDC_CONTRACT_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

class BotEngine {
  constructor() {
    this.isEngineRunning = false;
    this.tradingLoopInterval = null;
    this.provider = null;
    this.wallet = null;
    this.usdcContract = null;
    this.scanCount = 0;
    
    this.strategies = {
      arbitrage: { enabled: false, config: { min_profit_threshold: 0.2, max_position_size: 100 } },
      flashloan: { enabled: false, config: { min_profit_threshold: 0.2, flashloanAmount: 5000 } }
    };
  }

  updateConfig(strategy, newConfig) {
    if (this.strategies[strategy]) {
      this.strategies[strategy].config = { ...this.strategies[strategy].config, ...newConfig };
      console.log(`✅ BotEngine: Updated ${strategy} config`);
    }
  }

  async start(strategy) {
    if (!this.strategies[strategy]) {
        console.error(`❌ Attempted to start unknown strategy: ${strategy}`);
        return false;
    }

    console.log(`🚀 BotEngine: Starting ${strategy}...`);
    this.strategies[strategy].enabled = true;
    botStateManager.setStrategyStatus(strategy, true);

    if (!this.isEngineRunning) {
        console.log("🔥 Engine not running. Initializing and starting main loop...");
        const initialized = await this._initialize();
        if (!initialized) {
            console.error("❌ Engine initialization failed. Aborting start.");
            this.strategies[strategy].enabled = false;
            botStateManager.setStrategyStatus(strategy, false);
            return false;
        }
        
        this.isEngineRunning = true;
        botStateManager.setBotLiveStatus(true);
        this.tradingLoopInterval = setInterval(() => this._runTradingCycle(), 15000);
        await this._runTradingCycle();
    }
    console.log(`✅ BotEngine: ${strategy} is now active.`);
    return true;
  }

  stop(strategy) {
    if (!this.strategies[strategy]) {
        console.error(`❌ Attempted to stop unknown strategy: ${strategy}`);
        return;
    }
    
    console.log(`🛑 BotEngine: Stopping ${strategy}...`);
    this.strategies[strategy].enabled = false;
    botStateManager.setStrategyStatus(strategy, false);
    
    const anyStrategyStillRunning = Object.values(this.strategies).some(s => s.enabled);

    if (!anyStrategyStillRunning && this.isEngineRunning) {
        console.log("✋ All strategies stopped. Shutting down main engine loop.");
        clearInterval(this.tradingLoopInterval);
        this.tradingLoopInterval = null;
        this.isEngineRunning = false;
        botStateManager.setBotLiveStatus(false);
        console.log("✅ Engine stopped successfully.");
    } else {
        console.log(`✅ ${strategy} stopped. Other strategies may still be active.`);
    }
  }

  async _initialize() {
    try {
      console.log("🚀 BotEngine: Initializing...");
      
      const rpcUrl = "https://polygon-rpc.com/";
      const privateKey = "0x1234567890123456789012345678901234567890123456789012345678901234";

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.usdcContract = new ethers.Contract(NATIVE_USDC_CONTRACT_ADDRESS, USDC_ABI, this.provider);

      botStateManager.setWalletBalance(1203.45);

      console.log("✅ BotEngine: Initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ BotEngine: Initialization failed:", error);
      return false;
    }
  }

  _createExecutionRecord(data) {
    const dbRecord = {
      strategy_type: data.strategy_type,
      execution_type: data.execution_type,
      status: data.status,
      details: data.details || {},
      profit_realized: data.profit_realized || null,
      gas_used: data.gas_used || null,
      execution_time_ms: data.execution_time_ms || null,
      error_message: data.error_message || null,
    };

    const uiRecord = {
      ...dbRecord,
      client_id: `exec-${Date.now()}-${Math.random()}`,
      client_timestamp: Date.now(),
    };

    botStateManager.addExecution(uiRecord);
    databaseManager.saveExecution(dbRecord);
  }

  async _runTradingCycle() {
    this.scanCount++;
    console.log(`🤖 BotEngine: Trading loop running - scan #${this.scanCount}`);

    const opportunities = [
      { pair: 'USDC/USDT', buyDex: 'Uniswap', sellDex: 'Curve', profitPercentage: 2.1, available: true },
      { pair: 'USDC/DAI', buyDex: 'QuickSwap', sellDex: 'SushiSwap', profitPercentage: 1.8, available: Math.random() > 0.5 }
    ];

    if (this.scanCount % 5 === 0) {
        this._createExecutionRecord({
            strategy_type: 'all',
            execution_type: 'scan',
            status: 'completed',
            details: { message: `Scan cycle #${this.scanCount} completed. Found ${opportunities.length} potential opportunities.` }
        });
    }

    for (const [strategy, strategyInfo] of Object.entries(this.strategies)) {
      if (!strategyInfo.enabled) continue;

      for (const opportunity of opportunities) {
        if (!opportunity.available) continue;
        if (opportunity.profitPercentage < strategyInfo.config.min_profit_threshold) continue;

        const shouldExecute = Math.random() > 0.85;
        if (!shouldExecute) continue;

        const profit = Math.random() * 50 + 5;
        const gasCost = Math.random() * 2 + 0.5;

        console.log(`💰 ${strategy} strategy executing trade on ${opportunity.pair} for $${profit.toFixed(2)} profit`);

        this._createExecutionRecord({
          strategy_type: strategy,
          execution_type: strategy === 'flashloan' ? 'flashloan_trade' : 'trade',
          status: 'completed',
          details: {
            message: `${strategy === 'flashloan' ? 'Flashloan' : 'Standard'} Trade executed: SUCCESS. Profit: $${profit.toFixed(2)}`,
            opportunity: opportunity,
            loanAmount: strategy === 'flashloan' ? strategyInfo.config.flashloanAmount : null,
            tx_hash: `0x-simulated-${Date.now()}`
          },
          profit_realized: profit,
          gas_used: gasCost
        });

        break;
      }
    }
  }
}

// Create instance and export both named and default
const botEngine = new BotEngine();
export { botEngine };
export default botEngine;