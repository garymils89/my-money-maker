
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
        await this._runTradingCycle(); // Run immediately on start
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
      const privateKey = "0x1234567890123456789012345678901234567890123456789012345678901234"; // Placeholder for a real private key

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.usdcContract = new ethers.Contract(NATIVE_USDC_CONTRACT_ADDRESS, USDC_ABI, this.provider);

      botStateManager.setWalletBalance(1203.45); // Simulated balance

      console.log("✅ BotEngine: Initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ BotEngine: Initialization failed:", error);
      return false;
    }
  }

  // Helper for logging various events
  log(level, strategy, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}][${level.toUpperCase()}][${strategy}] ${message}`);
  }

  // Helper to find an opportunity (mocked)
  _findBestOpportunity() {
    const opportunities = [
      { pair: 'USDC/USDT', buyDex: 'Uniswap', sellDex: 'Curve', profitPercentage: 2.1, available: true },
      { pair: 'USDC/DAI', buyDex: 'QuickSwap', sellDex: 'SushiSwap', profitPercentage: 1.8, available: Math.random() > 0.5 },
      { pair: 'WETH/USDC', buyDex: 'Balancer', sellDex: 'Sushiswap', profitPercentage: 0.3, available: true },
      { pair: 'WBTC/USDT', buyDex: 'Curve', sellDex: 'Uniswap', profitPercentage: 0.7, available: Math.random() > 0.7 }
    ];
    // Simulate finding the "best" opportunity (e.g., highest profit, available)
    const availableOpportunities = opportunities.filter(op => op.available);
    if (availableOpportunities.length === 0) return null;
    return availableOpportunities.sort((a, b) => b.profitPercentage - a.profitPercentage)[0];
  }

  // A helper function to estimate gas, returning a dollar value.
  _estimateGasCost(type) {
      // In a real scenario, this would involve complex calculations.
      // For simulation, we return a realistic random value.
      const baseCosts = {
          'trade': 1.00,
          'flashloan_trade': 1.50, // Flashloans are more complex, higher gas
      };
      // Add some variability (from -0.25 to +0.25 USD)
      return (baseCosts[type] || 0.5) + (Math.random() * 0.5 - 0.25);
  }

  // Renamed and modified from _createExecutionRecord to align with outline's _addExecution
  _addExecution(data) {
    // 'data' is expected to be an object containing properties like:
    // strategy_type, execution_type, status, details, profit_realized, gas_used, execution_time_ms, error_message
    const dbRecord = {
      strategy_type: data.strategy_type,
      execution_type: data.execution_type,
      status: data.status,
      details: data.details || {},
      profit_realized: data.profit_realized || null,
      gas_used: data.gas_used || null, // This is expected to be in MATIC units (or similar native token)
      execution_time_ms: data.execution_time_ms || null,
      error_message: data.error_message || null,
    };

    const uiRecord = {
      ...dbRecord,
      client_id: `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique ID for UI
      client_timestamp: Date.now(),
    };

    botStateManager.addExecution(uiRecord);
    databaseManager.saveExecution(dbRecord);
    
    // Add to queue for further processing/persistent storage as per outline's implied behavior
    // The outline implies passing a structure like uiRecord (which has an 'id' equivalent via client_id)
    databaseManager.addExecutionToQueue(uiRecord, uiRecord.strategy_type);
  }

  async _runFlashloanStrategy() {
    // Ensure the flashloan strategy is enabled before proceeding
    if (!this.strategies.flashloan.enabled) return;

    try {
      this.log('info', 'flashloan', 'Scanning for flashloan opportunities...');
      
      const opportunity = this._findBestOpportunity();
      if (!opportunity) {
        this.log('info', 'flashloan', 'No flashloan opportunities found.');
        return;
      }
      
      const config = this.strategies.flashloan.config;
      const loanAmount = config.flashloanAmount || 50000;
      const minProfitThreshold = config.min_profit_threshold || 0.2; 

      // CRITICAL FIX: Calculate profit based on the large loan amount.
      // estimatedGrossProfitUSD is in USD based on percentage
      const estimatedGrossProfitUSD = loanAmount * (opportunity.profitPercentage / 100);
      const estimatedGasCostUSD = this._estimateGasCost('flashloan_trade'); // Returns gas cost in USD
      const estimatedNetProfitUSD = estimatedGrossProfitUSD - estimatedGasCostUSD;

      this.log('info', 'flashloan', `Found opportunity ${opportunity.pair}. Est. Profit: $${estimatedNetProfitUSD.toFixed(2)} from a $${loanAmount.toLocaleString()} loan.`);

      if (estimatedNetProfitUSD > minProfitThreshold) {
        this.log('alert', 'flashloan', `High-profit opportunity detected! Profit: $${estimatedNetProfitUSD.toFixed(2)}. Executing trade.`);
        
        const MATIC_PRICE_USD = 0.72; // Simulated MATIC price for converting gas cost from USD to MATIC
        const gasUsedMATIC = estimatedGasCostUSD / MATIC_PRICE_USD; // Convert USD gas cost to MATIC units

        // SIMULATE TRADE EXECUTION
        const executionData = {
            strategy_type: 'flashloan',
            execution_type: 'flashloan_trade',
            status: 'completed',
            profit_realized: estimatedNetProfitUSD,
            gas_used: gasUsedMATIC, // Store gas used in MATIC units
            details: {
                message: `Flashloan Trade executed: SUCCESS. Profit: $${estimatedNetProfitUSD.toFixed(2)}`,
                opportunity: opportunity,
                loanAmount: loanAmount,
                tx_hash: `0x-simulated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            },
            // execution_time_ms and error_message are optional for successful trade
        };

        this._addExecution(executionData);
      } else {
        this.log('info', 'flashloan', `Opportunity profit $${estimatedNetProfitUSD.toFixed(2)} below threshold $${minProfitThreshold}. Skipping.`);
      }
    } catch (error) {
      console.error("Error in flashloan strategy:", error);
      this.log('error', 'flashloan', error.message);
    }
  }

  async _runTradingCycle() {
    this.scanCount++;
    this.log('info', 'engine', `Trading loop running - scan #${this.scanCount}`);

    // Create a scan execution record every 5 cycles
    if (this.scanCount % 5 === 0) {
        this._addExecution({
            strategy_type: 'all',
            execution_type: 'scan',
            status: 'completed',
            details: { message: `Scan cycle #${this.scanCount} completed. Checking for opportunities.` }
        });
    }

    // Run each enabled strategy
    for (const [strategy, strategyInfo] of Object.entries(this.strategies)) {
      if (!strategyInfo.enabled) continue;

      if (strategy === 'flashloan') {
        await this._runFlashloanStrategy();
      } else if (strategy === 'arbitrage') {
        // Existing arbitrage logic, adapted to use _addExecution
        // This part uses the simplified opportunities list from the original code
        const opportunities = [
            { pair: 'USDC/USDT', buyDex: 'Uniswap', sellDex: 'Curve', profitPercentage: 2.1, available: true },
            { pair: 'USDC/DAI', buyDex: 'QuickSwap', sellDex: 'SushiSwap', profitPercentage: 1.8, available: Math.random() > 0.5 }
        ];

        for (const opportunity of opportunities) {
          if (!opportunity.available) continue;
          // Check if opportunity profit meets the strategy's minimum threshold
          if (opportunity.profitPercentage < strategyInfo.config.min_profit_threshold) continue;

          const shouldExecute = Math.random() > 0.85; // Simulate execution probability
          if (!shouldExecute) continue;

          const profitUSD = Math.random() * 50 + 5; // Simulated profit for arbitrage
          const gasCostUSD = this._estimateGasCost('trade'); // Get gas cost in USD

          const MATIC_PRICE_USD = 0.72; // Simulated MATIC price for conversion
          const gasUsedMATIC = gasCostUSD / MATIC_PRICE_USD; // Convert USD gas cost to MATIC units

          this.log('info', strategy, `Executing trade on ${opportunity.pair} for $${profitUSD.toFixed(2)} profit`);

          this._addExecution({
            strategy_type: strategy,
            execution_type: 'trade',
            status: 'completed',
            details: {
              message: `Standard Trade executed: SUCCESS. Profit: $${profitUSD.toFixed(2)}`,
              opportunity: opportunity,
              tx_hash: `0x-simulated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            },
            profit_realized: profitUSD,
            gas_used: gasUsedMATIC // Pass gas in MATIC units
          });

          break; // Simulate only one arbitrage trade per cycle for simplicity
        }
      }
      // Add logic for other strategies here if they exist
    }
  }
}

// Create instance and export both named and default
const botEngine = new BotEngine();
export { botEngine };
export default botEngine;
