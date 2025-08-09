
import React, { useState, useEffect } from "react";
import { BotExecution } from "@/api/entities";
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
  Download,
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      const allExecutions = await BotExecution.list('-created_date', 5000);
      // FIX: Show ALL executions to ensure data is being saved. We can filter later if needed.
      setExecutions(allExecutions);
    } catch (error) {
      console.error("Error loading execution data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    // Adjusted headers and data to match the new table structure and requirements
    const headers = ['Date', 'Time', 'Type', 'Status', 'Provider', 'Profit ($)', 'Loan Amount ($)', 'Details'];
    const rows = executions.map(exec => [
      format(new Date(exec.created_date), 'yyyy-MM-dd'),
      format(new Date(exec.created_date), 'HH:mm:ss'),
      exec.execution_type,
      exec.status,
      exec.details?.opportunity?.buyDex && exec.details?.opportunity?.sellDex 
        ? `${exec.details.opportunity.buyDex} -> ${exec.details.opportunity.sellDex}`
        : 'N/A',
      exec.profit_realized !== null && exec.profit_realized !== undefined ? exec.profit_realized.toFixed(2) : 'N/A',
      exec.details?.loanAmount?.toLocaleString() || 'N/A',
      exec.details?.tx_hash ? exec.details.tx_hash : exec.details?.message || 'N/A' // Prioritize tx_hash for CSV, then message
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')) // Handle commas and quotes in fields
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bot-executions-${new Date().toISOString().split('T')[0]}.csv`); // Changed filename for general executions
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
              Execution Database
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              Raw execution data from your bot
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={loadDatabaseData}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={downloadCSV}
              disabled={executions.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Bot Execution History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="text-center py-12">Loading execution data...</div>
            ) : executions.length > 0 ? (
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
                  {executions.map((exec, index) => (
                    <TableRow key={exec.id || index}>
                      <TableCell>{format(new Date(exec.created_date), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>{format(new Date(exec.created_date), 'HH:mm:ss')}</TableCell>
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
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No execution data found</h3>
                <p className="text-slate-600">Start your bot to begin recording execution data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
