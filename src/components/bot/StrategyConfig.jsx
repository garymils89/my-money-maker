import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function StrategyConfig({ config, onConfigChange, strategyType, isRunning }) {
    const handleInputChange = (field, value) => {
        onConfigChange({ ...config, [field]: parseFloat(value) || 0 });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{strategyType === 'flashloan' ? 'Flashloan' : 'Arbitrage'} Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="min-profit">Min Profit Threshold (%)</Label>
                    <Input
                        id="min-profit"
                        type="number"
                        value={config.min_profit_threshold}
                        onChange={(e) => handleInputChange('min_profit_threshold', e.target.value)}
                        disabled={isRunning}
                    />
                </div>
                {strategyType === 'flashloan' ? (
                    <div>
                        <Label htmlFor="flashloan-amount">Flashloan Amount (USDC)</Label>
                        <Input
                            id="flashloan-amount"
                            type="number"
                            value={config.flashloanAmount}
                            onChange={(e) => handleInputChange('flashloanAmount', e.target.value)}
                            disabled={isRunning}
                        />
                    </div>
                ) : (
                    <div>
                        <Label htmlFor="max-position">Max Position Size (USDC)</Label>
                        <Input
                            id="max-position"
                            type="number"
                            value={config.max_position_size}
                            onChange={(e) => handleInputChange('max_position_size', e.target.value)}
                            disabled={isRunning}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}