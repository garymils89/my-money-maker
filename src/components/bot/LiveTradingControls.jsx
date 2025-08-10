import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Wallet,
  DollarSign 
} from "lucide-react";
import { liveTradingEngine } from './LiveTradingEngine';

export default function LiveTradingControls({ onLiveTradeExecuted }) {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletBalances, setWalletBalances] = useState(null);
  const [liveConfig, setLiveConfig] = useState({
    privateKey: '',
    maxLoanAmount: 5000, // Start small for safety
    maxGasCostUSD: 5,
    requireConfirmation: true
  });

  const connectWallet = async () => {
    if (!liveConfig.privateKey) {
      alert('Please enter your private key');
      return;
    }

    setIsConnecting(true);
    try {
      const success = await liveTradingEngine.initialize(liveConfig.privateKey);
      if (success) {
        setIsLiveMode(true);
        const balances = await liveTradingEngine.getWalletBalances();
        setWalletBalances(balances);
        alert('🎉 Live trading engine connected successfully!');
      } else {
        alert('❌ Failed to connect. Check your private key and try again.');
      }
    } catch (error) {
      alert(`Connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    liveTradingEngine.disconnect();
    setIsLiveMode(false);
    setWalletBalances(null);
    setLiveConfig(prev => ({ ...prev, privateKey: '' }));
  };

  const executeLiveTrade = async (opportunity) => {
    if (!isLiveMode) {
      alert('Live trading not connected');
      return;
    }

    if (liveConfig.requireConfirmation) {
      const confirmed = window.confirm(
        `🚨 EXECUTE LIVE TRADE? 🚨\n\n` +
        `Pair: ${opportunity.pair}\n` +
        `Loan Amount: $${liveConfig.maxLoanAmount.toLocaleString()}\n` +
        `Expected Profit: $${opportunity.expectedProfit?.toFixed(2)}\n\n` +
        `This will use REAL money. Continue?`
      );
      if (!confirmed) return;
    }

    try {
      const result = await liveTradingEngine.executeFlashloanTrade(
        opportunity, 
        liveConfig.maxLoanAmount
      );
      
      onLiveTradeExecuted?.(result);
      
      if (result.success) {
        alert(`🎉 LIVE TRADE SUCCESSFUL!\n\nProfit: $${result.profit.toFixed(2)}\nTX: ${result.txHash}`);
      } else {
        alert(`❌ Trade Failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Execution Error: ${error.message}`);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <Zap className="w-6 h-6" />
          🚨 LIVE TRADING CONTROLS 🚨
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>WARNING:</strong> Live trading uses real cryptocurrency. Only proceed if you understand the risks.
            Start with small amounts and test thoroughly.
          </AlertDescription>
        </Alert>

        {!isLiveMode ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="privateKey">Wallet Private Key</Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="0x..."
                value={liveConfig.privateKey}
                onChange={(e) => setLiveConfig(prev => ({ ...prev, privateKey: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Your private key never leaves this browser. Required to sign transactions.
              </p>
            </div>

            <div>
              <Label>Starting Loan Amount (USD)</Label>
              <Input
                type="number"
                value={liveConfig.maxLoanAmount}
                onChange={(e) => setLiveConfig(prev => ({ ...prev, maxLoanAmount: parseFloat(e.target.value) }))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Start with $1,000-$5,000 for your first live trades.
              </p>
            </div>

            <Button
              onClick={connectWallet}
              disabled={isConnecting || !liveConfig.privateKey}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isConnecting ? 'Connecting...' : '🔴 Connect Live Trading Engine'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-100 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Live Trading Connected</span>
              </div>
              <Badge className="bg-green-200 text-green-800">LIVE</Badge>
            </div>

            {walletBalances && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-sm text-slate-600">MATIC Balance</div>
                  <div className="font-bold">{walletBalances.matic.toFixed(4)}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-sm text-slate-600">Max Loan Amount</div>
                  <div className="font-bold">${liveConfig.maxLoanAmount.toLocaleString()}</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // This would integrate with your bot engine to execute the next profitable opportunity
                  const mockOpportunity = {
                    pair: 'USDC/USDT',
                    expectedProfit: 50,
                    buyDex: 'Uniswap',
                    sellDex: 'Curve'
                  };
                  executeLiveTrade(mockOpportunity);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Execute Next Trade
              </Button>
              
              <Button
                onClick={disconnectWallet}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}