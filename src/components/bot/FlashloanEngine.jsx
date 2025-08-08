
import { ethers } from "ethers";
import { tradingSafety } from "./TradingSafetyLayer";

// Aave V3 Pool contract address on Polygon
const AAVE_POOL_ADDRESS = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

// Simplified Aave V3 Pool ABI - just what we need for flashloans
const AAVE_POOL_ABI = [
  "function flashLoan(address receiverAddress, address[] calldata assets, uint256[] calldata amounts, uint256[] calldata modes, address onBehalfOf, bytes calldata params, uint16 referralCode)",
  "function getReserveData(address asset) external view returns (uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt)"
];

// Flash Loan Receiver contract ABI
const FLASHLOAN_RECEIVER_ABI = [
  "constructor(address _addressesProvider)",
  "function executeOperation(address[] calldata assets, uint256[] calldata amounts, uint256[] calldata premiums, address initiator, bytes calldata params) external returns (bool)",
  "function requestFlashLoan(address _token, uint256 _amount, bytes calldata _params) external"
];

// USDC contract address on Polygon
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Bridged USDC
const NATIVE_USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // Native USDC

class FlashloanEngine {
  constructor(provider, wallet) {
    this.provider = provider;
    this.wallet = wallet;
    this.aavePool = new ethers.Contract(AAVE_POOL_ADDRESS, AAVE_POOL_ABI, this.wallet);
  }

  async validateFlashloanAvailability(tokenAddress, amount) {
    try {
      const reserveData = await this.aavePool.getReserveData(tokenAddress);
      
      // Basic validation that the reserve exists and is active
      const isActive = reserveData.configuration !== 0n;
      
      if (!isActive) {
        throw new Error(`Reserve for token ${tokenAddress} is not active on Aave`);
      }

      return {
        available: true,
        aTokenAddress: reserveData.aTokenAddress,
        liquidityIndex: reserveData.liquidityIndex
      };
    } catch (error) {
      console.error("Error validating flashloan availability:", error);
      throw new Error(`Flashloan validation failed: ${error.message}`);
    }
  }

  async estimateFlashloanFee(amount) {
    // Aave V3 flashloan fee is 0.05% (5 basis points)
    const feePercentage = 0.0005;
    const fee = amount * feePercentage;
    return {
      fee: fee,
      feePercentage: feePercentage * 100,
      totalRepayment: amount + fee
    };
  }

  async executeSimpleArbitrageFlashloan(opportunity, loanAmount) {
    // SAFETY CHECK: Validate trade amount for current environment
    try {
      tradingSafety.validateTradeAmount(loanAmount, 'flashloan');
      tradingSafety.logSafetyEvent('Flashloan Validation Passed', { 
        amount: loanAmount, 
        environment: tradingSafety.environment 
      });
    } catch (error) {
      tradingSafety.logSafetyEvent('Flashloan Blocked by Safety Layer', { 
        amount: loanAmount, 
        error: error.message 
      });
      throw error;
    }

    console.log(`🚀 EXECUTING REAL FLASHLOAN [${tradingSafety.environment.toUpperCase()}]: ${opportunity.pair} with $${loanAmount.toLocaleString()}`);
    
    try {
      // Step 1: Validate flashloan availability
      const validation = await this.validateFlashloanAvailability(USDC_ADDRESS, loanAmount);
      console.log("✅ Flashloan availability validated");

      // Step 2: Estimate fees
      const feeEstimate = await this.estimateFlashloanFee(loanAmount);
      console.log(`💰 Estimated fee: $${feeEstimate.fee.toFixed(2)} (${feeEstimate.feePercentage}%)`);

      // Step 3: Environment-specific confirmation
      if (tradingSafety.requiresUserConfirmation()) {
        const confirmed = confirm(
          `🚨 CONFIRM REAL FLASHLOAN:\n` +
          `Amount: $${loanAmount.toLocaleString()}\n` +
          `Fee: $${feeEstimate.fee.toFixed(2)}\n` +
          `Environment: ${tradingSafety.environment.toUpperCase()}\n\n` +
          `This will execute a REAL blockchain transaction. Continue?`
        );
        
        if (!confirmed) {
          throw new Error("User cancelled flashloan execution");
        }
      }

      // Step 4: Prepare flashloan parameters
      const assets = [USDC_ADDRESS];
      const amounts = [ethers.parseUnits(loanAmount.toString(), 6)]; // USDC has 6 decimals
      const modes = [0]; // 0 = no open debt, pay back immediately
      const onBehalfOf = await this.wallet.getAddress();
      
      // Encode arbitrage parameters
      const arbitrageParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "string", "uint256"],
        [opportunity.buy_exchange, opportunity.sell_exchange, opportunity.pair, ethers.parseUnits(opportunity.profit_percentage.toString(), 2)]
      );

      // Step 5: Execute flashloan
      console.log("📡 Sending flashloan transaction to Aave...");
      
      const gasLimit = tradingSafety.environment === 'production' ? 1200000 : 800000; // More gas in prod
      const gasPrice = await this.provider.getFeeData();
      
      const tx = await this.aavePool.flashLoan(
        onBehalfOf, // receiver (we'll use a simple receiver contract)
        assets,
        amounts,
        modes,
        onBehalfOf,
        arbitrageParams,
        0, // referral code
        {
          gasLimit: gasLimit,
          maxFeePerGas: gasPrice.maxFeePerGas,
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas
        }
      );

      console.log(`📝 Transaction hash: ${tx.hash}`);
      console.log("⏳ Waiting for transaction confirmation...");

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        const actualGasUsed = receipt.gasUsed;
        const actualGasCost = actualGasUsed * receipt.gasPrice / 1e18; // Convert to MATIC
        
        console.log(`✅ FLASHLOAN SUCCESSFUL [${tradingSafety.environment.toUpperCase()}]!`);
        console.log(`Gas used: ${actualGasUsed.toString()} (${actualGasCost.toFixed(4)} MATIC)`);
        
        tradingSafety.logSafetyEvent('Flashloan Success', {
          txHash: tx.hash,
          gasUsed: actualGasCost,
          environment: tradingSafety.environment
        });
        
        return {
          success: true,
          txHash: tx.hash,
          gasUsed: actualGasCost,
          block: receipt.blockNumber,
          fee: feeEstimate.fee,
          netProfit: (loanAmount * opportunity.profit_percentage / 100) - feeEstimate.fee - actualGasCost,
          environment: tradingSafety.environment
        };
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error) {
      console.error(`❌ FLASHLOAN FAILED [${tradingSafety.environment.toUpperCase()}]:`, error);
      
      tradingSafety.logSafetyEvent('Flashloan Failed', {
        error: error.message,
        environment: tradingSafety.environment
      });
      
      // Parse common error types
      let errorMessage = error.message;
      if (error.message.includes('insufficient funds')) {
        errorMessage = "Insufficient MATIC for gas fees";
      } else if (error.message.includes('execution reverted')) {
        errorMessage = "Smart contract execution failed - likely insufficient arbitrage profit";
      }
      
      return {
        success: false,
        error: errorMessage,
        originalError: error.message,
        environment: tradingSafety.environment
      };
    }
  }

  async simulateFlashloanGasCost() {
    try {
      const gasPrice = await this.provider.getFeeData();
      const estimatedGasLimit = 800000; // Conservative estimate for flashloan + arbitrage
      
      const estimatedCost = (estimatedGasLimit * gasPrice.gasPrice) / 1e18;
      
      return {
        estimatedGasLimit,
        gasPrice: gasPrice.gasPrice,
        estimatedCostMATIC: estimatedCost,
        estimatedCostUSD: estimatedCost * 0.5 // Rough MATIC price
      };
    } catch (error) {
      console.error("Error estimating gas cost:", error);
      return {
        estimatedCostMATIC: 0.02,
        estimatedCostUSD: 0.01
      };
    }
  }
}

export default FlashloanEngine;
