
import { ethers } from "ethers";
import { botStateManager } from "./botState";
import { BotExecution } from "@/api/entities";

const NATIVE_USDC_CONTRACT_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.tradingLoopInterval = null;
    this.provider = null;
    this.wallet = null;
    this.usdcContract = null;
    
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
        this.tradingLoopInterval = setInterval(() => this._runTradingLoop(), 15000);
        await this._runTradingLoop(); // Run once immediately
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
      const privateKey = "0x1234567890123456789012345678901234567890123456789012345678901234"; // Dummy key

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.usdcContract = new ethers.Contract(NATIVE_USDC_CONTRACT_ADDRESS, USDC_ABI, this.provider);

      // Simulate balance check
      botStateManager.setWalletBalance(1203.45);

      console.log("✅ BotEngine: Initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ BotEngine: Initialization failed:", error);
      return false;
    }
  }

  async _runTradingLoop() {
    if (!this.isEngineRunning) return;

    console.log("🤖 BotEngine: Trading loop running");

    if (this.strategies.flashloan.enabled) {
        await this._executeFlashloanTrade();
    }
    
    if (this.strategies.arbitrage.enabled) {
        // Placeholder for future arbitrage logic
    }

    const scanData = {
      execution_type: 'scan',
      strategy_type: 'system',
      status: 'completed',
      details: { message: 'Market scan completed' }
    };
    botStateManager.addExecution({
      client_id: `scan-${Date.now()}`,
      ...scanData
    });
    // Scans are not critical to save to DB, so we skip BotExecution.create()
  }

  async _executeFlashloanTrade() {
    const profit = (Math.random() * 50 - 5);
    const success = profit > this.strategies.flashloan.config.min_profit_threshold;

    const executionData = {
      execution_type: 'flashloan_trade',
      strategy_type: 'flashloan',
      status: success ? 'completed' : 'failed',
      profit_realized: success ? profit : 0,
      gas_used: 0.5,
      details: {
        opportunity: { buyDex: 'Uniswap', sellDex: 'QuickSwap', pair: 'USDC/USDT' },
        loanAmount: this.strategies.flashloan.config.flashloanAmount,
        loanFee: this.strategies.flashloan.config.flashloanAmount * 0.0009,
        tx_hash: success ? `0x${Math.random().toString(16).substr(2, 40)}` : null
      },
      bot_config_id: 'simulated_bot_1',
      opportunity_id: `opp-${Date.now()}`
    };

    // Add to live feed for immediate UI update
    botStateManager.addExecution({
      client_id: `trade-${Date.now()}`,
      ...executionData
    });
    
    try {
      console.log('--- ATTEMPTING TO SAVE TO DATABASE ---', executionData);
      const savedRecord = await BotExecution.create(executionData);
      console.log('--- ✅ SUCCESS: Record saved to database! ---', savedRecord);
      
      // IMMEDIATELY TEST READ-BACK
      console.log('--- 🔍 TESTING IMMEDIATE READ-BACK ---');
      const allRecords = await BotExecution.list('-created_date', 10);
      console.log('--- 📊 IMMEDIATE READ RESULT:', allRecords.length, 'records found');
      
    } catch (error) { // Removed ': any' type annotation
      console.error('--- ❌ FAILED TO SAVE TO DATABASE! ---', error);
      // Also add an error execution to the live feed so it's visible in the UI
      botStateManager.addExecution({
        client_id: `error-${Date.now()}`,
        execution_type: 'error',
        strategy_type: 'system',
        status: 'failed',
        details: { message: error.message || 'An unknown error occurred.' } // Ensure message is always present
      });
    }

    console.log(`💰 Flashloan Trade executed: ${success ? 'SUCCESS' : 'FAILED'} - $${profit.toFixed(2)}`);
  }
}

export const BotEngine = new Engine();
