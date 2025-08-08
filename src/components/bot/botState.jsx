// Enhanced state manager with daily stats persistence

let executions = [];
let dailyStats = null;
let listeners = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener(executions));
};

export const botStateManager = {
  addExecution: (newExecution) => {
    // Prevent duplicates within a short time frame
    const isDuplicate = executions.some(existing => 
      existing.execution_type === newExecution.execution_type &&
      existing.status === newExecution.status &&
      Math.abs(new Date(existing.created_date).getTime() - new Date(newExecution.created_date).getTime()) < 1000
    );

    if (!isDuplicate) {
      executions = [newExecution, ...executions.slice(0, 199)]; // Keep latest 200
      notifyListeners();
    }
  },

  setAllExecutions: (allExecutions) => {
    executions = [...allExecutions];
    notifyListeners();
  },

  getExecutions: () => {
    return executions;
  },

  setDailyStats: (stats) => {
    dailyStats = stats;
  },

  getDailyStats: () => {
    return dailyStats;
  },

  subscribe: (listener) => {
    listeners.push(listener);
    // Return an unsubscribe function
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};