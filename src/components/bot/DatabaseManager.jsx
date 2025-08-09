
import { BotExecution } from '@/api/entities';

class DatabaseManager {
  constructor() {
    this.pendingSaves = [];
    this.saveInProgress = false;
    this.retryInterval = null;
    this.startRetryLoop();
  }

  async saveExecution(executionData) {
    console.log("💾 DB Manager: Received save request for:", executionData.execution_type);
    console.log("💾 DB Manager: Data to be saved:", JSON.stringify(executionData, null, 2));

    try {
      const savedRecord = await BotExecution.create(executionData);
      console.log("💾 DB Manager: BotExecution.create response:", JSON.stringify(savedRecord, null, 2));
      
      if (savedRecord && savedRecord.id) {
        console.log("✅ Database save successful. Record ID:", savedRecord.id);
        return savedRecord;
      } else {
        console.error("❌ Database save returned invalid data, queuing for retry:", savedRecord);
        this.pendingSaves.push({...executionData, retryCount: 0, timestamp: Date.now()});
        return {...executionData, id: `temp-${Date.now()}`};
      }
    } catch (error) {
      console.error("❌ Database save FAILED with error, queuing for retry:", error.message);
      this.pendingSaves.push({...executionData, retryCount: 0, timestamp: Date.now()});
      return {...executionData, id: `temp-${Date.now()}`};
    }
  }

  async loadAllExecutions() {
    try {
      console.log("📚 DatabaseManager: Loading all executions from database...");
      
      // Try multiple methods to query the database
      let records = null;
      
      try {
        records = await BotExecution.list('-created_date', 500);
        console.log("📚 Method 1 (BotExecution.list) returned:", records?.length || 0, "records");
      } catch (error) {
        console.log("📚 Method 1 failed:", error.message);
      }
      
      if (!records || !Array.isArray(records) || records.length === 0) {
        try {
          records = await BotExecution.list();
          console.log("📚 Method 2 (BotExecution.list no params) returned:", records?.length || 0, "records");
        } catch (error) {
          console.log("📚 Method 2 failed:", error.message);
        }
      }
      
      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.error("📚 DatabaseManager: Failed to load executions:", error);
      return [];
    }
  }

  startRetryLoop() {
    if (this.retryInterval) return;
    
    this.retryInterval = setInterval(async () => {
      if (this.pendingSaves.length > 0 && !this.saveInProgress) {
        await this.retryPendingSaves();
      }
    }, 30000);
  }

  async retryPendingSaves() {
    if (this.saveInProgress || this.pendingSaves.length === 0) return;
    
    this.saveInProgress = true;
    const toRetry = [...this.pendingSaves];
    console.log(`🔄 DatabaseManager: Retrying ${toRetry.length} pending saves...`);
    
    for (const pendingRecord of toRetry) {
      try {
        const { id, client_id, retryCount, timestamp, ...dataToSave } = pendingRecord;
        const savedRecord = await BotExecution.create(dataToSave);
        
        if (savedRecord && savedRecord.id) {
          console.log(`✅ Retry successful for record:`, savedRecord.id);
          this.pendingSaves = this.pendingSaves.filter(p => (p.client_id || p.id) !== (client_id || id));
        } else {
          pendingRecord.retryCount++;
        }
      } catch (error) {
        console.error(`❌ Retry failed:`, error.message);
        pendingRecord.retryCount++;
        if (pendingRecord.retryCount >= 10) {
          this.pendingSaves = this.pendingSaves.filter(p => (p.client_id || p.id) !== (pendingRecord.client_id || pendingRecord.id));
        }
      }
    }
    this.saveInProgress = false;
  }

  getPendingCount() {
    return this.pendingSaves.length;
  }

  async testDatabaseConnection() {
    try {
      console.log("🧪 Testing database connection...");
      
      const testRecord = {
        execution_type: 'test',
        strategy_type: 'test',
        status: 'completed',
        details: { message: 'Database connectivity test' },
        client_timestamp: Date.now()
      };
      
      const result = await BotExecution.create(testRecord);
      console.log("🧪 Test record created:", result);
      
      const records = await BotExecution.list('-created_date', 10);
      console.log("🧪 Recent records found:", records?.length || 0);
      
      return { 
        success: true, 
        testRecord: result, 
        recentCount: records?.length || 0 
      };
    } catch (error) {
      console.error("🧪 Database test failed:", error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

export const databaseManager = new DatabaseManager();
