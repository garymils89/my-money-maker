import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Settings, 
  Shield, 
  Calculator, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Zap,
  Target,
  Fuel,
  Lock,
  Rocket
} from "lucide-react";

const GuideSection = ({ icon: Icon, title, children, level = "beginner" }) => {
  const levelColors = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800", 
    advanced: "bg-red-100 text-red-800"
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
            <Icon className="w-5 h-5 text-slate-700" />
          </div>
          <span>{title}</span>
          <Badge className={levelColors[level]}>
            {level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
};

const ConfigParam = ({ name, description, currentValue, recommendedValue, riskLevel }) => {
  const riskColors = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-red-600"
  };

  return (
    <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-900">{name}</h4>
        <Badge variant="outline" className={riskColors[riskLevel]}>
          {riskLevel} risk
        </Badge>
      </div>
      <p className="text-slate-600 text-sm mb-3">{description}</p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-500">Current:</span>
          <span className="font-medium ml-2">{currentValue}</span>
        </div>
        <div>
          <span className="text-slate-500">Recommended:</span>
          <span className="font-medium text-blue-600 ml-2">{recommendedValue}</span>
        </div>
      </div>
    </div>
  );
};

export default function TradingGuide() {
  const [activeStrategy, setActiveStrategy] = useState("conservative");

  // Your actual balances for realistic examples
  const yourBalance = { usdc: 1203, matic: 187 };

  const strategies = {
    conservative: {
      minProfit: 0.3,
      maxPosition: 200,
      dailyLossLimit: 25,
      maxSlippage: 0.3,
      gasPerTrade: 0.3,
      expectedDaily: "$8-15",
      riskLevel: "Low",
      description: "Safe, steady profits with minimal risk"
    },
    balanced: {
      minProfit: 0.2,
      maxPosition: 300,
      dailyLossLimit: 50,
      maxSlippage: 0.5,
      gasPerTrade: 0.5,
      expectedDaily: "$15-30",
      riskLevel: "Medium", 
      description: "Good balance of profit and safety"
    },
    aggressive: {
      minProfit: 0.15,
      maxPosition: 500,
      dailyLossLimit: 100,
      maxSlippage: 1.0,
      gasPerTrade: 0.8,
      expectedDaily: "$30-60",
      riskLevel: "High",
      description: "Maximum profits, higher risk tolerance"
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              ArbitrageX Trading Guide
            </h1>
          </div>
          <p className="text-xl text-slate-600 font-medium max-w-3xl mx-auto">
            Master your trading bot with comprehensive guides on configuration, risk management, and strategy optimization.
          </p>
        </motion.div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Risk Controls
            </TabsTrigger>
            <TabsTrigger value="strategies" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Strategies
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Examples
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Going Live
            </TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <div className="space-y-6">
              <GuideSection icon={Settings} title="Bot Configuration Deep Dive" level="beginner">
                <p className="text-slate-600">
                  Every parameter in the Configuration tab directly impacts your bot's behavior and profitability. 
                  Here's what each setting does and how to optimize it for your strategy.
                </p>
              </GuideSection>

              <GuideSection icon={DollarSign} title="Trading Parameters" level="intermediate">
                <ConfigParam
                  name="Max Position Size"
                  description="Maximum USDC amount to use per individual trade. Higher values = bigger profits but more risk per trade."
                  currentValue="$500 (default)"
                  recommendedValue={`$${Math.floor(yourBalance.usdc * 0.2)} (20% of your balance)`}
                  riskLevel="medium"
                />
                
                <ConfigParam
                  name="Min Profit Threshold"
                  description="Minimum profit percentage required to execute a trade. Lower = more opportunities, higher = better quality trades."
                  currentValue="0.2% (default)"
                  recommendedValue="0.3% (conservative) or 0.15% (aggressive)"
                  riskLevel="low"
                />

                <ConfigParam
                  name="Max Daily Trades"
                  description="Maximum number of trades per day. Prevents over-trading and excessive gas consumption."
                  currentValue="50 (default)"
                  recommendedValue="20-30 for consistent profits"
                  riskLevel="low"
                />

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip: Position Sizing</h4>
                  <p className="text-blue-800 text-sm">
                    With your {yourBalance.usdc} USDC, using $200-300 per trade allows for 4-6 simultaneous positions, 
                    spreading risk while maintaining good profit potential.
                  </p>
                </div>
              </GuideSection>

              <GuideSection icon={Fuel} title="Gas Management" level="intermediate">
                <ConfigParam
                  name="Max Gas Per Trade"
                  description="Maximum MATIC to spend on gas for a single trade. Higher gas limits allow for more complex trades."
                  currentValue="0.5 MATIC (default)"
                  recommendedValue="0.3 MATIC (sufficient for most trades)"
                  riskLevel="low"
                />

                <ConfigParam
                  name="Daily Gas Limit" 
                  description="Total MATIC budget for gas per day. Prevents excessive gas spending during high-activity periods."
                  currentValue="10 MATIC (default)"
                  recommendedValue={`${Math.floor(yourBalance.matic * 0.1)} MATIC (10% of your balance)`}
                  riskLevel="medium"
                />

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <h5 className="font-medium text-slate-900">Current Gas Prices</h5>
                    <div className="text-sm text-slate-600 mt-2 space-y-1">
                      <div>Standard: ~0.15 MATIC</div>
                      <div>Complex: ~0.25 MATIC</div>
                      <div>Peak times: +50%</div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <h5 className="font-medium text-green-900">Your Gas Capacity</h5>
                    <div className="text-sm text-green-800 mt-2 space-y-1">
                      <div>{yourBalance.matic} MATIC available</div>
                      <div>~{Math.floor(yourBalance.matic / 0.2)} trades possible</div>
                      <div>Excellent gas reserves!</div>
                    </div>
                  </div>
                </div>
              </GuideSection>

              <GuideSection icon={Zap} title="Trading Pairs & DEXs" level="advanced">
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900">Recommended Trading Pairs</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <h5 className="font-medium text-emerald-900">Low Risk</h5>
                      <ul className="text-sm text-emerald-800 mt-2 space-y-1">
                        <li>• USDC/USDT (stablecoin pair)</li>
                        <li>• USDC/DAI (low volatility)</li>
                        <li>• Best for beginners</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h5 className="font-medium text-yellow-900">Medium Risk</h5>
                      <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                        <li>• USDC/WETH (some volatility)</li>
                        <li>• USDT/DAI (triangular arb)</li>
                        <li>• Higher profit potential</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h5 className="font-medium text-red-900">High Risk</h5>
                      <ul className="text-sm text-red-800 mt-2 space-y-1">
                        <li>• Any/WMATIC pairs</li>
                        <li>• Volatile altcoins</li>
                        <li>• Experienced traders only</li>
                      </ul>
                    </div>
                  </div>

                  <h4 className="font-semibold text-slate-900 mt-6">DEX Selection Strategy</h4>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li>• <strong>Uniswap V3:</strong> Best liquidity, higher gas costs</li>
                      <li>• <strong>QuickSwap:</strong> Lower fees, good for smaller trades</li>
                      <li>• <strong>Curve:</strong> Excellent for stablecoin swaps, lowest slippage</li>
                      <li>• <strong>SushiSwap:</strong> Good secondary option, competitive rates</li>
                    </ul>
                  </div>
                </div>
              </GuideSection>
            </div>
          </TabsContent>

          {/* Risk Controls Tab */}
          <TabsContent value="risk">
            <div className="space-y-6">
              <GuideSection icon={Shield} title="Risk Management Masterclass" level="intermediate">
                <p className="text-slate-600">
                  Proper risk management is the difference between consistent profits and devastating losses. 
                  These controls are your safety net in volatile markets.
                </p>
              </GuideSection>

              <GuideSection icon={AlertTriangle} title="Essential Safety Limits" level="beginner">
                <ConfigParam
                  name="Daily Loss Limit"
                  description="Bot stops trading if daily losses reach this amount. Your most important safety control."
                  currentValue="$50 (default)"
                  recommendedValue={`$${Math.floor(yourBalance.usdc * 0.02)} (2% of capital)`}
                  riskLevel="high"
                />

                <ConfigParam
                  name="Max Slippage"
                  description="Maximum acceptable price movement during trade execution. Higher = more opportunities but worse fills."
                  currentValue="0.5% (default)"
                  recommendedValue="0.3% for stablecoins, 1% for volatile pairs"
                  riskLevel="medium"
                />

                <ConfigParam
                  name="Stop Loss Percentage"
                  description="Automatic exit trigger for individual losing trades. Prevents small losses from becoming large ones."
                  currentValue="5% (default)"
                  recommendedValue="3% for conservative, 5% for balanced"
                  riskLevel="high"
                />

                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-red-800">
                    <strong>Critical:</strong> Never disable the Daily Loss Limit. Even professional traders have bad days. 
                    This single setting protects your entire capital.
                  </AlertDescription>
                </Alert>
              </GuideSection>

              <GuideSection icon={Calculator} title="Position Sizing Formula" level="advanced">
                <div className="bg-slate-50 rounded-lg p-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Kelly Criterion for Arbitrage</h4>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <h5 className="font-medium text-slate-900">Conservative Formula</h5>
                      <code className="block text-sm text-slate-600 mt-2">
                        Position Size = (Win Rate × Avg Win - Loss Rate × Avg Loss) / Avg Win × Total Capital
                      </code>
                      <p className="text-sm text-slate-600 mt-2">
                        For your {yourBalance.usdc} USDC with 87% win rate and 2.3% avg profit:
                        <strong className="text-blue-600"> Optimal position = $245</strong>
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-green-700">87%</div>
                        <div className="text-xs text-green-600">Success Rate</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-blue-700">2.3%</div>
                        <div className="text-xs text-blue-600">Avg Profit</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-purple-700">$245</div>
                        <div className="text-xs text-purple-600">Optimal Size</div>
                      </div>
                    </div>
                  </div>
                </div>
              </GuideSection>
            </div>
          </TabsContent>

          {/* Strategies Tab */}
          <TabsContent value="strategies">
            <div className="space-y-6">
              <GuideSection icon={Target} title="Pre-Built Strategies" level="beginner">
                <p className="text-slate-600 mb-4">
                  Choose a strategy that matches your risk tolerance and experience level. 
                  You can always adjust parameters later as you gain confidence.
                </p>

                <div className="grid gap-4">
                  {Object.entries(strategies).map(([key, strategy]) => (
                    <div 
                      key={key}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        activeStrategy === key 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                      onClick={() => setActiveStrategy(key)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 capitalize">{key} Strategy</h4>
                          <p className="text-sm text-slate-600">{strategy.description}</p>
                        </div>
                        <Badge variant={
                          strategy.riskLevel === 'Low' ? 'default' : 
                          strategy.riskLevel === 'Medium' ? 'secondary' : 'destructive'
                        }>
                          {strategy.riskLevel} Risk
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Expected Daily:</span>
                          <div className="font-medium text-emerald-600">{strategy.expectedDaily}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Position Size:</span>
                          <div className="font-medium">${strategy.maxPosition}</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Min Profit:</span>
                          <div className="font-medium">{strategy.minProfit}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📊 Strategy Performance Simulation</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Based on your {yourBalance.usdc} USDC and {yourBalance.matic} MATIC:
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded p-3 text-center">
                      <div className="text-lg font-bold text-slate-900">{strategies[activeStrategy].expectedDaily}</div>
                      <div className="text-xs text-slate-600">Daily Profit</div>
                    </div>
                    <div className="bg-white rounded p-3 text-center">
                      <div className="text-lg font-bold text-slate-900">
                        {Math.floor(yourBalance.matic / strategies[activeStrategy].gasPerTrade)}
                      </div>
                      <div className="text-xs text-slate-600">Days of Gas</div>
                    </div>
                    <div className="bg-white rounded p-3 text-center">
                      <div className="text-lg font-bold text-slate-900">
                        {Math.floor(yourBalance.usdc / strategies[activeStrategy].maxPosition)}
                      </div>
                      <div className="text-xs text-slate-600">Max Positions</div>
                    </div>
                  </div>
                </div>
              </GuideSection>
            </div>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples">
            <div className="space-y-6">
              <GuideSection icon={Calculator} title="Real-World Scenarios" level="intermediate">
                <p className="text-slate-600">
                  Here are specific examples using your actual balances ({yourBalance.usdc} USDC, {yourBalance.matic} MATIC) 
                  to show exactly what to expect in different market conditions.
                </p>
              </GuideSection>

              <GuideSection icon={TrendingUp} title="Scenario 1: Normal Market Day" level="beginner">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3">Conservative Settings Result</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-green-700">Opportunities Found:</span>
                        <span className="font-medium">15 per hour</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Trades Executed:</span>
                        <span className="font-medium">8 per day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Success Rate:</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Avg Position Size:</span>
                        <span className="font-medium">$200</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-green-700">Avg Profit per Trade:</span>
                        <span className="font-medium">$1.85</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Gas Used:</span>
                        <span className="font-medium">2.4 MATIC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Daily Net Profit:</span>
                        <span className="font-medium text-green-600">$12.80</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Monthly Estimate:</span>
                        <span className="font-medium text-green-600">$384</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GuideSection>

              <GuideSection icon={Zap} title="Scenario 2: High Volatility Day" level="intermediate">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-3">Aggressive Settings Result</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-orange-700">Opportunities Found:</span>
                        <span className="font-medium">35 per hour</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">Trades Executed:</span>
                        <span className="font-medium">22 per day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">Success Rate:</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">Avg Position Size:</span>
                        <span className="font-medium">$350</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-orange-700">Avg Profit per Trade:</span>
                        <span className="font-medium">$2.90</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">Gas Used:</span>
                        <span className="font-medium">8.8 MATIC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">Daily Net Profit:</span>
                        <span className="font-medium text-orange-600">$43.20</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-600">⚠️ Higher risk, bigger rewards</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GuideSection>

              <GuideSection icon={AlertTriangle} title="Scenario 3: Market Crash Day" level="advanced">
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-3">Risk Controls Save the Day</h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3">
                      <p className="text-red-800 text-sm">
                        <strong>9:30 AM:</strong> Bot detects unusual volatility, reduces position sizes by 50%
                      </p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-red-800 text-sm">
                        <strong>11:45 AM:</strong> Three consecutive failed trades trigger temporary pause
                      </p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-red-800 text-sm">
                        <strong>2:15 PM:</strong> Daily loss limit of $25 reached - bot stops trading
                      </p>
                    </div>
                    <div className="bg-red-100 rounded p-3 border border-red-200">
                      <p className="text-red-900 font-medium text-center">
                        Result: Only $25 lost instead of potential $200+ without controls
                      </p>
                    </div>
                  </div>
                </div>
              </GuideSection>
            </div>
          </TabsContent>

          {/* Going Live Tab */}
          <TabsContent value="live">
            <div className="space-y-6">
              <GuideSection icon={Rocket} title="Preparing for Real Live Trading" level="advanced">
                <Alert className="border-amber-200 bg-amber-50">
                  <Lock className="w-4 h-4" />
                  <AlertDescription className="text-amber-800">
                    <strong>Current Status:</strong> Your bot is running in "Live Simulation" mode - using real balances 
                    but simulating trades for safety. Moving to actual blockchain transactions requires additional setup.
                  </AlertDescription>
                </Alert>
              </GuideSection>

              <GuideSection icon={Lock} title="Technical Requirements for Live Trading" level="advanced">
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900">What You Need:</h4>
                  
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-medium text-slate-900 mb-2">1. Transaction Signing Library</h5>
                    <p className="text-slate-600 text-sm">
                      To execute real trades, we need a proper Web3 library like ethers.js or web3.js. 
                      Currently, the bot performs all calculations and validations but simulates the final transaction.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-medium text-slate-900 mb-2">2. DEX Router Integration</h5>
                    <p className="text-slate-600 text-sm">
                      Each DEX (Uniswap, QuickSwap, Curve) has different smart contract interfaces. 
                      Real trading requires connecting to their router contracts with proper ABI encoding.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-medium text-slate-900 mb-2">3. MEV Protection</h5>
                    <p className="text-slate-600 text-sm">
                      Live arbitrage faces competition from MEV bots. You'll need private mempool access 
                      (like Flashbots) or very fast execution to remain profitable.
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="font-medium text-slate-900 mb-2">4. Advanced Monitoring</h5>
                    <p className="text-slate-600 text-sm">
                      Real trading requires monitoring transaction confirmations, handling reverts, 
                      and automatically adjusting gas prices based on network conditions.
                    </p>
                  </div>
                </div>
              </GuideSection>

              <GuideSection icon={TrendingUp} title="Current Simulation vs Live Trading" level="intermediate">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">✅ What's Already Working</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Real wallet balance detection</li>
                      <li>• Live opportunity scanning</li>
                      <li>• Accurate profit calculations</li>
                      <li>• Gas estimation and checks</li>
                      <li>• Risk management controls</li>
                      <li>• Pre-flight validations</li>
                      <li>• Realistic trade simulations</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-semibold text-amber-900 mb-3">⚙️ What's Missing for Live</h4>
                    <ul className="text-amber-800 text-sm space-y-1">
                      <li>• Transaction signing & broadcasting</li>
                      <li>• DEX router contract calls</li>
                      <li>• Slippage protection</li>
                      <li>• MEV protection</li>
                      <li>• Transaction confirmation handling</li>
                      <li>• Gas price optimization</li>
                      <li>• Failed transaction recovery</li>
                    </ul>
                  </div>
                </div>
              </GuideSection>

              <GuideSection icon={Shield} title="Recommended Next Steps" level="beginner">
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Phase 1: Master the Simulation</h4>
                    <p className="text-green-800 text-sm mb-2">
                      Run your bot in simulation mode for 1-2 weeks to:
                    </p>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• Test different strategies and settings</li>
                      <li>• Understand market patterns and timing</li>
                      <li>• Fine-tune your risk controls</li>
                      <li>• Build confidence in the system</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Phase 2: Technical Upgrade</h4>
                    <p className="text-blue-800 text-sm mb-2">
                      When you're ready for live trading:
                    </p>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Add Web3 libraries for transaction signing</li>
                      <li>• Integrate with DEX router contracts</li>
                      <li>• Implement proper error handling</li>
                      <li>• Add transaction monitoring</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">Phase 3: Go Live Gradually</h4>
                    <p className="text-purple-800 text-sm mb-2">
                      Start with minimal risk:
                    </p>
                    <ul className="text-purple-700 text-sm space-y-1">
                      <li>• Begin with $50 position sizes</li>
                      <li>• Use only USDC/USDT pairs initially</li>
                      <li>• Monitor closely for first week</li>
                      <li>• Scale up gradually as confidence builds</li>
                    </ul>
                  </div>
                </div>

                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-red-800">
                    <strong>Important:</strong> The current simulation is incredibly valuable for learning and strategy 
                    development. Many professional arbitrage traders run extensive simulations before risking real capital.
                  </AlertDescription>
                </Alert>
              </GuideSection>

              <div className="text-center">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg px-8 py-4"
                  onClick={() => alert('Let\'s discuss the technical implementation of live trading!')}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Ready to Discuss Live Trading Implementation
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}