import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Rocket, Info, TrendingUp, TrendingDown } from "lucide-react";

export default function LeverageManager({ onConfigChange, simulationResult }) {
  const [loanAmount, setLoanAmount] = useState(25000);
  const [provider, setProvider] = useState('aave');

  const handleConfigChange = () => {
    onConfigChange({
      enabled: true,
      amount: loanAmount,
      provider: provider,
      fee_percentage: 0.09 // Aave's fee is 0.09%
    });
  };
  
  React.useEffect(() => {
    handleConfigChange();
  }, [loanAmount, provider]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Flashloan Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-blue-800">
              Configure the parameters for your simulated Flashloan trades. The bot will use these settings when an opportunity is profitable enough to cover the loan fees.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="provider">Loan Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aave">Aave</SelectItem>
                <SelectItem value="dydx" disabled>dYdX (coming soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanAmount">Loan Amount: ${loanAmount.toLocaleString()}</Label>
            <Slider
              id="loanAmount"
              min={5000}
              max={100000}
              step={1000}
              value={[loanAmount]}
              onValueChange={(value) => setLoanAmount(value[0])}
            />
             <div className="flex justify-between text-xs text-slate-500">
              <span>$5,000</span>
              <span>$100,000</span>
            </div>
          </div>
          
           <div className="text-sm p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between">
                  <span className="text-slate-600">Provider Fee (Aave):</span>
                  <span className="font-medium">0.09%</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-slate-600">Fee on ${loanAmount.toLocaleString()}:</span>
                  <span className="font-medium text-red-600">${(loanAmount * 0.0009).toFixed(2)}</span>
              </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-500" />
                Live Simulation Results
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             <p className="text-sm text-slate-600">
               When the bot finds an opportunity, the potential results of a Flashloan trade will appear here.
             </p>
            {simulationResult ? (
                <div className="p-4 bg-emerald-50 rounded-lg space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-emerald-800">Gross Profit:</span>
                        <span className="font-medium text-emerald-600">${simulationResult.grossProfit.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-emerald-800">Loan Fee:</span>
                        <span className="font-medium text-red-600">-${simulationResult.loanFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-emerald-200 pt-2 flex justify-between font-bold">
                        <span className="text-emerald-900">Net Profit:</span>
                        <span className="text-emerald-700">${simulationResult.netProfit.toFixed(2)}</span>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-slate-100 rounded-lg text-center">
                    <p className="text-slate-600 font-medium">Waiting for profitable opportunity...</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}