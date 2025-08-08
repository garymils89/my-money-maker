import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Banknote, Landmark, ShieldCheck, TrendingUp, AlertTriangle, Info } from "lucide-react";

export default function LeverageManager({ engine }) {
  const [collateral, setCollateral] = useState({ usdc: 0 });
  const [borrowed, setBorrowed] = useState({ usdt: 0 });
  const [healthFactor, setHealthFactor] = useState(10); // Start with a high safe number
  const [maxLTV, setMaxLTV] = useState(0.8); // Max Loan-to-Value
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (engine && typeof engine.getAavePosition === 'function') {
      updatePosition();
      setIsReady(true);
    }
  }, [engine]);

  const updatePosition = async () => {
    const position = await engine.getAavePosition();
    setCollateral({ usdc: position.collateralUSDC });
    setBorrowed({ usdt: position.borrowedUSDT });
    setHealthFactor(position.healthFactor);
    setMaxLTV(position.ltv);
  };
  
  const handleDeposit = async () => {
    await engine.depositToAave(depositAmount);
    await updatePosition();
    setDepositAmount('');
  };
  
  const handleBorrow = async () => {
    await engine.borrowFromAave(borrowAmount);
    await updatePosition();
    setBorrowAmount('');
  };
  
  const handleRepay = async () => {
    await engine.repayAaveLoan(repayAmount);
    await updatePosition();
    setRepayAmount('');
  };

  const handleWithdraw = async () => {
    await engine.withdrawFromAave(withdrawAmount);
    await updatePosition();
    setWithdrawAmount('');
  };
  
  const healthColor = healthFactor > 2 ? 'text-emerald-500' : healthFactor > 1.5 ? 'text-amber-500' : 'text-red-500';

  if (!isReady) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6">
          <p>Connecting to Aave Protocol...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="w-4 h-4" />
        <AlertDescription className="text-blue-800">
          This panel allows you to use Aave to borrow funds against your USDC, multiplying your bot's trading capital. More capital means larger profits from each trade.
        </AlertDescription>
      </Alert>

      {/* Position Overview */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-500" />
            Aave Leverage Position
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <Label>Collateral (USDC)</Label>
            <div className="text-2xl font-bold text-slate-900">${collateral.usdc.toFixed(2)}</div>
            <div className="text-xs text-slate-500">Deposited & Earning Interest</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <Label>Borrowed (USDT)</Label>
            <div className="text-2xl font-bold text-slate-900">${borrowed.usdt.toFixed(2)}</div>
            <div className="text-xs text-slate-500">Total debt</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <Label>Health Factor</Label>
            <div className={`text-2xl font-bold ${healthColor}`}>{healthFactor.toFixed(4)}</div>
            <div className="text-xs text-slate-500">Liquidation if &lt; 1.0. Keep &gt; 1.5 for safety.</div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500"/>Increase Position</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deposit">Deposit USDC Collateral</Label>
              <div className="flex gap-2">
                <Input id="deposit" type="number" placeholder="Amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} />
                <Button onClick={handleDeposit}>Deposit</Button>
              </div>
            </div>
            <div>
              <Label htmlFor="borrow">Borrow USDT</Label>
              <div className="flex gap-2">
                <Input id="borrow" type="number" placeholder="Amount" value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} />
                <Button onClick={handleBorrow}>Borrow</Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Max borrow: ${(collateral.usdc * maxLTV - borrowed.usdt).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-red-500"/>Decrease Position</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="repay">Repay USDT Debt</Label>
              <div className="flex gap-2">
                <Input id="repay" type="number" placeholder="Amount" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} />
                <Button onClick={handleRepay} variant="secondary">Repay</Button>
              </div>
            </div>
             <div>
              <Label htmlFor="withdraw">Withdraw USDC Collateral</Label>
              <div className="flex gap-2">
                <Input id="withdraw" type="number" placeholder="Amount" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                <Button onClick={handleWithdraw} variant="secondary">Withdraw</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

       <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          <strong>Risk Warning:</strong> Borrowing funds introduces liquidation risk. If the Health Factor drops below 1.0, your collateral will be sold to cover your debt. Always monitor your position.
        </AlertDescription>
      </Alert>
    </div>
  );
}