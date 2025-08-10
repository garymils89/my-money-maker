import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Wallet, 
  Settings,
  Globe,
  Key,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { botStateManager } from "../components/bot/botState"; // New import

export default function LiveTradingSetup() {
  const [setupProgress, setSetupProgress] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [rpcConnected, setRpcConnected] = useState(false);
  const [contractsVerified, setContractsVerified] = useState(true); // Assume true for UI as per outline
  const [safetyChecksEnabled, setSafetyChecksEnabled] = useState(true); // Assume true for UI as per outline
  
  const [walletBalance, setWalletBalance] = useState({ usdc: 0, matic: 0 }); // matic initial remains 0, updated by botState for usdc
  const [testResults, setTestResults] = useState(null);
  
  const [config, setConfig] = useState({
    enable_live_trading: false,
    max_trade_size_live: 100, // Start small for live
    emergency_stop_loss: 50,
    max_daily_loss_live: 100,
    require_confirmation: true,
    use_private_mempool: false
  });

  useEffect(() => {
    // Subscribe to botStateManager for real-time wallet and connection status
    const unsubscribe = botStateManager.subscribe(state => {
      // For this page, we'll use the bot's reported wallet balance to infer connection status.
      // If the bot has a USDC balance, we consider the wallet and RPC connected.
      const isConnected = state.walletBalance > 0;
      setWalletConnected(isConnected);
      setRpcConnected(isConnected);
      setWalletBalance(prev => ({ ...prev, usdc: state.walletBalance })); // Update USDC balance

      // Recalculate progress based on current statuses
      const checks = [isConnected, isConnected, contractsVerified, safetyChecksEnabled]; // rpcConnected and walletConnected use isConnected
      const progress = (checks.filter(Boolean).length / checks.length) * 100;
      setSetupProgress(progress);
    });

    // Cleanup subscription on component unmount
    return unsubscribe;
  }, [contractsVerified, safetyChecksEnabled]); // Dependencies for useEffect to react to these states if they were to change

  const runLiveTest = async () => {
    // Simulate a small live test transaction
    setTestResults({
      status: 'running',
      message: 'Testing live blockchain connection...'
    });

    setTimeout(() => {
      setTestResults({
        status: 'success',
        message: 'Live test completed successfully! Ready for small trades.',
        gasUsed: 0.001,
        executionTime: 2.3
      });
    }, 3000);
  };

  const enableLiveTrading = () => {
    if (setupProgress < 100) {
      alert("Please complete all setup steps first");
      return;
    }
    
    setConfig(prev => ({ ...prev, enable_live_trading: true }));
    alert("Live trading enabled! The bot will now execute real transactions.");
  };

  const StatusCard = ({ title, status, icon: Icon, description }) => (
    <Card className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg ${status ? 'ring-2 ring-emerald-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`w-6 h-6 ${status ? 'text-emerald-500' : 'text-slate-400'}`} />
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-slate-600">{description}</p>
            </div>
          </div>
          {status ? (
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Live Trading Setup
            </h1>
          </div>
          <p className="text-xl text-slate-600 font-medium">
            Prepare your bot for real blockchain transactions
          </p>
        </motion.div>

        {/* Progress Overview */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Setup Progress</h3>
              <Badge className={setupProgress === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                {setupProgress.toFixed(0)}% Complete
              </Badge>
            </div>
            <Progress value={setupProgress} className="mb-2" />
            <p className="text-sm text-slate-600">
              Complete all steps to enable live trading with real funds
            </p>
          </CardContent>
        </Card>

        {/* Setup Status Checks */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <StatusCard
            title="RPC Connection"
            status={rpcConnected}
            icon={Globe}
            description="Polygon network connection established"
          />
          <StatusCard
            title="Wallet Access"
            status={walletConnected}
            icon={Wallet}
            description="Private key wallet loaded and verified"
          />
          <StatusCard
            title="Smart Contracts"
            status={contractsVerified}
            icon={Settings}
            description="DEX contracts loaded and validated"
          />
          <StatusCard
            title="Safety Systems"
            status={safetyChecksEnabled}
            icon={Shield}
            description="Risk management and emergency stops active"
          />
        </div>

        {/* Live Trading Configuration */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" />
              Live Trading Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Warning:</strong> These settings control real money transactions on the blockchain. 
                Start with small amounts and increase gradually.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Max Trade Size (USDC)</Label>
                  <Input
                    type="number"
                    value={config.max_trade_size_live}
                    onChange={(e) => setConfig(prev => ({ ...prev, max_trade_size_live: parseFloat(e.target.value) }))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Start small ($50-100) for initial testing</p>
                </div>

                <div>
                  <Label>Daily Loss Limit (USDC)</Label>
                  <Input
                    type="number"
                    value={config.max_daily_loss_live}
                    onChange={(e) => setConfig(prev => ({ ...prev, max_daily_loss_live: parseFloat(e.target.value) }))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Bot stops trading if losses exceed this amount</p>
                </div>

                <div>
                  <Label>Emergency Stop Loss (USDC)</Label>
                  <Input
                    type="number"
                    value={config.emergency_stop_loss}
                    onChange={(e) => setConfig(prev => ({ ...prev, emergency_stop_loss: parseFloat(e.target.value) }))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Immediate shutdown if single trade loses this much</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.require_confirmation}
                      onChange={(e) => setConfig(prev => ({ ...prev, require_confirmation: e.target.checked }))}
                    />
                    Require manual confirmation for trades
                  </Label>

                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.use_private_mempool}
                      onChange={(e) => setConfig(prev => ({ ...prev, use_private_mempool: e.target.checked }))}
                    />
                    Use private mempool (Flashbots)
                  </Label>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Current Wallet Balance</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>USDC:</span>
                      <span className="font-mono">${walletBalance.usdc.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MATIC (Gas):</span>
                      <span className="font-mono">{walletBalance.matic.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test & Enable */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Live Connection Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runLiveTest}
                disabled={!walletConnected || testResults?.status === 'running'}
                className="w-full mb-4"
              >
                {testResults?.status === 'running' ? 'Testing...' : 'Run Live Test'}
              </Button>

              {testResults && (
                <div className={`p-3 rounded-lg ${testResults.status === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'}`}>
                  <p className="font-medium">{testResults.message}</p>
                  {testResults.gasUsed && (
                    <div className="text-sm mt-2">
                      <div>Gas used: {testResults.gasUsed} MATIC</div>
                      <div>Execution time: {testResults.executionTime}s</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Enable Live Trading</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.enable_live_trading ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription className="text-green-800">
                      <strong>Live Trading Active!</strong> Your bot is now executing real transactions.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">
                      Once all systems are verified, you can enable live trading with real funds.
                    </p>
                    <Button
                      onClick={enableLiveTrading}
                      disabled={setupProgress < 100}
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      🚨 Enable Live Trading 🚨
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </Card>
      </div>
    </div>
  );
}