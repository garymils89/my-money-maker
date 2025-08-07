// Mock base44 client for local development - no authentication required
export const base44 = {
  entities: {
    ArbitrageOpportunity: {
      list: async () => [
        {
          id: '1',
          pair: 'USDC/USDT',
          buy_exchange: 'Uniswap',
          sell_exchange: 'Curve',
          buy_price: 0.9998,
          sell_price: 1.0021,
          profit_percentage: 0.23,
          estimated_profit: 2.76,
          risk_level: 'low',
          status: 'active'
        }
      ],
      filter: async () => [],
      create: async (data) => ({ id: Date.now(), ...data }),
      update: async (id, data) => ({ id, ...data }),
    },
    Portfolio: {
      list: async () => [
        {
          id: '1',
          exchange: 'Binance',
          asset: 'USDC',
          balance: 1200,
          current_value: 1200
        }
      ]
    },
    Trade: {
      list: async () => []
    },
    BotConfig: {
      list: async () => [
        {
          id: '1',
          bot_name: 'Test Bot',
          max_position_size: 500,
          min_profit_threshold: 0.2,
          is_active: false
        }
      ],
      create: async (data) => ({ id: Date.now(), ...data }),
      update: async (id, data) => ({ id, ...data }),
    },
    BotExecution: {
      list: async () => [],
      create: async (data) => ({ id: Date.now(), ...data })
    }
  }
};