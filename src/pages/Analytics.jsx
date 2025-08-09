
import React, { useState, useEffect } from "react";
import { botStateManager } from "../components/bot/botState";
import { databaseManager } from "../components/bot/DatabaseManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Database, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800',
    executing: 'bg-blue-100 text-blue-800',
    default: 'bg-slate-100 text-slate-800',
  };
  return <Badge className={styles[status] || styles.default}>{status}</Badge>;
};

export default function Analytics() {
  const [executions, setExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadAllData();
    
    // Subscribe to live updates from botStateManager
    const unsubscribe = botStateManager.subscribe(state => {
      console.log("📊 Analytics page received state update with", state.executions.length, "live executions.");
      setExecutions(prev => {
        // Merge live data with existing database data
        const liveIds = state.executions.map(e => e.client_id || e.id);
        const existingDataNotLive = prev.filter(e => !liveIds.includes(e.id));
        
        const combined = [...state.executions, ...existingDataNotLive];
        const uniqueCombined = combined.filter((item, index, self) => 
          index === self.findIndex(i => (i.id || i.client_id) === (item.id || item.client_id))
        );
        return uniqueCombined;
      });
      setPendingCount(databaseManager.getPendingCount());
    });

    return unsubscribe;
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const dbRecords = await databaseManager.loadAllExecutions();
      const liveState = botStateManager.getState();
      
      const combined = [...liveState.executions, ...dbRecords];
      const unique = combined.filter((item, index, self) => 
        index === self.findIndex(i => (i.id || i.client_id) === (item.id || item.client_id))
      );
      
      setExecutions(unique);
      setPendingCount(databaseManager.getPendingCount());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshView = () => {
    console.log("🖱️ Refresh button clicked. Loading all data from state manager and database.");
    loadAllData(); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Live Trading Database
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              Real-time view of all bot activity and trade executions
            </p>
            <div className="bg-green-100 border border-green-300 rounded p-3 mt-3">
              <p className="text-green-800 font-mono text-sm">
                📊 Showing {executions.length} total records 
                {pendingCount > 0 && <span className="text-amber-700"> ({pendingCount} pending database sync)</span>}
              </p>
              <p className="text-green-600 text-xs">Live data + persistent database storage with retry logic</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={refreshView}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh View
            </Button>
          </div>
        </motion.div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Bot Execution History ({executions.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {executions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Profit ($)</TableHead>
                    <TableHead>Loan Amount ($)</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((exec, index) => {
                    // COMPLETELY SAFE DATE HANDLING - NO .split() ANYWHERE
                    const timestamp = exec.created_date || exec.client_timestamp || Date.now();
                    const safeDate = new Date(Number(timestamp));
                    
                    return (
                    <TableRow key={exec.id || exec.client_id || index}>
                      <TableCell>{format(safeDate, 'yyyy-MM-dd')}</TableCell>
                      <TableCell>{format(safeDate, 'HH:mm:ss')}</TableCell>
                      <TableCell><Badge variant="outline">{exec.execution_type}</Badge></TableCell>
                      <TableCell><StatusBadge status={exec.status} /></TableCell>
                      <TableCell>
                        {exec.details?.opportunity?.buyDex && exec.details?.opportunity?.sellDex 
                          ? `${exec.details.opportunity.buyDex} → ${exec.details.opportunity.sellDex}`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell className={exec.profit_realized >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {exec.profit_realized !== null && exec.profit_realized !== undefined ? `$${exec.profit_realized.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>${exec.details?.loanAmount?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>
                        {exec.details?.tx_hash ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a 
                              href={`https://polygonscan.com/tx/${exec.details.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Tx
                            </a>
                          </Button>
                        ) : (
                          exec.details?.message || 'No details'
                        )}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No execution data found</h3>
                <p className="text-slate-600">Start the bot to see live activity here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
