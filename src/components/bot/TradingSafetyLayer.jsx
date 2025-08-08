// Trading Safety Layer - Environment-based configuration without separate branches
class TradingSafetyLayer {
  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadEnvironmentConfig();
  }

  detectEnvironment() {
    const hostname = window.location.hostname;
    
    // Production: main deployment URL without git prefix
    if (hostname.includes('arbitrage-x.vercel.app') && !hostname.includes('git-')) {
      return 'production';
    }
    
    // Preview: Vercel preview deployments (git-branch-name.vercel.app)
    if (hostname.includes('vercel.app') && hostname.includes('git-')) {
      return 'preview';
    }
    
    // Local development
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
    
    // Fallback to most restrictive
    return 'production';
  }

  loadEnvironmentConfig() {
    // Load limits from environment variables with sensible defaults
    return {
      maxFlashloanAmount: parseFloat(import.meta.env.VITE_MAX_FLASHLOAN_AMOUNT) || this.getDefaultLimits().maxFlashloanAmount,
      maxTradeSize: parseFloat(import.meta.env.VITE_MAX_TRADE_SIZE) || this.getDefaultLimits().maxTradeSize,
      requiresConfirmation: import.meta.env.VITE_REQUIRE_CONFIRMATION === 'true' || this.getDefaultLimits().requiresConfirmation,
      allowsExperimental: import.meta.env.VITE_ALLOW_EXPERIMENTAL !== 'false' || this.getDefaultLimits().allowsExperimental,
      environment: this.environment
    };
  }

  getDefaultLimits() {
    // Fallback limits if environment variables aren't set
    const defaults = {
      production: {
        maxFlashloanAmount: 10000,
        maxTradeSize: 1000,
        requiresConfirmation: true,
        allowsExperimental: false
      },
      preview: {
        maxFlashloanAmount: 500,
        maxTradeSize: 100,
        requiresConfirmation: false,
        allowsExperimental: true
      },
      development: {
        maxFlashloanAmount: 50,
        maxTradeSize: 25,
        requiresConfirmation: false,
        allowsExperimental: true
      }
    };
    
    return defaults[this.environment] || defaults.production;
  }

  validateTradeAmount(amount, tradeType) {
    const maxAmount = tradeType === 'flashloan' ? this.config.maxFlashloanAmount : this.config.maxTradeSize;
    
    if (amount > maxAmount) {
      throw new Error(
        `🚨 SAFETY BLOCK: ${tradeType} amount $${amount} exceeds ${this.environment} limit of $${maxAmount}`
      );
    }
    
    return true;
  }

  requiresUserConfirmation() {
    return this.config.requiresConfirmation;
  }

  allowsExperimentalFeatures() {
    return this.config.allowsExperimental;
  }

  getEnvironmentBadge() {
    const badges = {
      production: { text: '🔴 PRODUCTION', class: 'bg-red-500 text-white' },
      preview: { text: '🟡 PREVIEW', class: 'bg-yellow-500 text-black' },
      development: { text: '🟢 DEVELOPMENT', class: 'bg-green-500 text-white' }
    };
    
    return badges[this.environment];
  }

  getConfig() {
    return {
      ...this.config,
      environment: this.environment
    };
  }

  logSafetyEvent(event, data) {
    console.log(`🛡️ SAFETY [${this.environment.toUpperCase()}]: ${event}`, data);
  }
}

export const tradingSafety = new TradingSafetyLayer();