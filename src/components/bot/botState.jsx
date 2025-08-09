import { BotEngine } from './BotEngine';

let state = {
  executions: [],
  dailyStats: { trades: 0, profit: 0, loss: 0, gasUsed: 0 },
  walletBalance: 0,
  activeStrategies: {
    arbitrage: false,
    flashloan: false,
  },
  isLive: false,
};

let listeners = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener(state));
};

export const botStateManager = {
  updateState: (newState) => {
    state = { ...state, ...newState };
    notifyListeners();
  },

  addExecution: (newExecution) => {
    // FIX: Remove the 200 event limit - keep all executions for proper reporting
    state.executions = [newExecution, ...state.executions];
    notifyListeners();
  },
  
  setAllExecutions: (allExecutions) => {
    state.executions = [...allExecutions];
    notifyListeners();
  },
  
  setDailyStats: (stats) => {
    state.dailyStats = stats;
    notifyListeners();
  },
  
  setWalletBalance: (balance) => {
    state.walletBalance = balance;
    notifyListeners();
  },

  setStrategyStatus: (strategy, isRunning) => {
    state.activeStrategies[strategy] = isRunning;
    notifyListeners();
  },
  
  setBotLiveStatus: (isLive) => {
    state.isLive = isLive;
    notifyListeners();
  },

  getState: () => {
    return { ...state };
  },

  isStrategyRunning: (strategy) => {
    return state.activeStrategies[strategy];
  },

  getExecutions: () => {
    return [...state.executions];
  },

  subscribe: (listener) => {
    listeners.push(listener);
    listener(state); 
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};

export { BotEngine };