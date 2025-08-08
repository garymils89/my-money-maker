import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Rocket, Zap, Info } from "lucide-react";

export default function LeverageManager() {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center">
        <CardHeader>
          <div className="flex justify-center items-center gap-3">
             <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Zap className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
                Flashloans & Leverage
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600 max-w-2xl mx-auto">
            This is the next major step for ArbitrageX. Here, you'll be able to integrate with protocols like Aave to borrow funds using Flashloans, dramatically increasing your trading capital and potential profits without needing to own the funds yourself.
          </p>
          
          <Alert className="border-blue-200 bg-blue-50 text-left">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-blue-800">
              <strong>Coming Soon:</strong> We'll implement the logic to connect to Aave, borrow funds, execute a trade, and repay the loan all in a single transaction.
            </AlertDescription>
          </Alert>

          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Let's Implement Flashloans
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}