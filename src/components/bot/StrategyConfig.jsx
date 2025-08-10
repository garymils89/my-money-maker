
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const strategyConfigs = {
  arbitrage: [
    // Configuration fields for arbitrage strategy go here, if any.
    // As per the outline, existing code for arbitrage config should be kept,
    // but no specific arbitrage config was provided in the initial file.
  ],
  flashloan: [
    {
      key: 'flashloanAmount',
      label: 'Flashloan Amount ($)',
      type: 'number',
      step: "1000",
      placeholder: "e.g., 50000",
      description: 'The amount of USDC to borrow for each trade. High amounts amplify profits.',
    },
    {
      key: 'minProfitThreshold',
      label: 'Min Profit Threshold ($)',
      type: 'number',
      step: "0.01", // Step for dollar amounts (cents)
      placeholder: "e.g., 0.25", // Example for dollar amount profit
      description: 'The minimum dollar profit required to execute a trade after estimated fees.',
    },
    {
      key: 'loanProvider',
      label: 'Loan Provider',
      type: 'select',
      options: [
        { value: 'aave', label: 'AAVE (Recommended)' },
        { value: 'dydx', label: 'dYdX' },
        { value: 'maker', label: 'MakerDAO' } // Changed 'maker' to 'MakerDAO' for better UI
      ],
      description: 'The protocol to borrow the flashloan from.',
    },
    {
      key: 'dailyLossLimit',
      label: 'Daily Loss Limit ($)',
      type: 'number',
      step: "10",
      placeholder: "e.g., 100",
      description: 'Automatically stop the bot if total daily losses exceed this amount.',
    },
    {
      key: 'maxSlippage',
      label: 'Max Slippage (%)',
      type: 'number',
      step: "0.1",
      placeholder: "e.g., 0.5",
      description: 'Maximum price change allowed during trade execution.',
    },
  ],
};

export default function StrategyConfig({ strategy, config = {}, onConfigChange = () => {}, isRunning }) {
  
  const handleNumberChange = (field, value) => {
    const newConfig = { ...config };
    const numValue = parseFloat(value);
    
    if (value === '') {
      newConfig[field] = '';
    } else if (!isNaN(numValue)) {
      newConfig[field] = numValue;
    } else {
       return; // Do not update if input is not a valid number (and not empty)
    }
    
    onConfigChange(strategy, newConfig);
  };

  const handleSelectChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    onConfigChange(strategy, newConfig);
  };

  // Get the configuration fields for the current strategy
  const currentStrategyConfig = strategyConfigs[strategy] || [];

  if (!config || Object.keys(config).length === 0) {
      return <div className="text-sm text-slate-500">Loading flashloan configuration...</div>
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {currentStrategyConfig.map((fieldDef) => (
          <div key={fieldDef.key}>
            <Label className="text-sm font-medium text-slate-700">{fieldDef.label}</Label>
            {fieldDef.type === 'number' && (
              <Input
                type="number"
                step={fieldDef.step}
                value={config[fieldDef.key] || ''} // Use || '' to display empty for 0 or undefined
                onChange={(e) => handleNumberChange(fieldDef.key, e.target.value)}
                disabled={isRunning}
                placeholder={fieldDef.placeholder}
                className="mt-1"
              />
            )}
            {fieldDef.type === 'select' && (
              <Select 
                value={config[fieldDef.key] || (fieldDef.options && fieldDef.options[0]?.value)} // Default to first option's value
                onValueChange={(value) => handleSelectChange(fieldDef.key, value)}
                disabled={isRunning}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={`Select ${fieldDef.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {fieldDef.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-slate-500 mt-1">{fieldDef.description}</p>
          </div>
        ))}

        {isRunning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Configuration is locked while the bot is running. Stop the bot to make changes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
