
let state = {
  executions: [],
  dailyStats: null,
  walletBalance: 0,
  isRunning: false,
  isLive: false,
};

let listeners = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener(state));
};

// FIX: Removing default export to avoid ambiguity for the build process.
// Only named export will be used.
export const botStateManager = {
  updateState: (newState) => {
    state = { ...state, ...newState };
    notifyListeners();
  },

  addExecution: (newExecution) => {
    const isDuplicate = state.executions.some(existing => 
      existing.execution_type === newExecution.execution_type &&
      existing.status === newExecution.status &&
      Math.abs(new Date(existing.created_date).getTime() - new Date(newExecution.created_date).getTime()) < 1000
    );

    if (!isDuplicate) {
      state.executions = [newExecution, ...state.executions.slice(0, 199)];
      notifyListeners();
    }
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

  setBotStatus: (status) => {
    if (typeof status.isRunning === 'boolean') {
      state.isRunning = status.isRunning;
    }
    if (typeof status.isLive === 'boolean') {
      state.isLive = status.isLive;
    }
    notifyListeners();
  },

  getState: () => {
    return { ...state };
  },

  getExecutions: () => {
    return [...state.executions];
  },

  subscribe: (listener) => {
    listeners.push(listener);
    // This is key: the subscription immediately sends the current state to the new listener.
    listener(state); 
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};
