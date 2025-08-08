// This is a simple, in-memory state manager for the bot's execution logs.
// Because it's a module, it acts as a singleton, and its state persists
// for the entire user session, surviving page navigation.

let executions = [];
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

  subscribe: (listener) => {
    listeners.push(listener);
    // Return an unsubscribe function
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
};