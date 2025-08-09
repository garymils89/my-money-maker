import React, { useState, useEffect } from "react";
import { botEngine } from "@/components/bot/BotEngine";
import { botStateManager } from "@/components/bot/botState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, Activity, Settings, DollarSign } from "lucide-react";
import LiveActivityFeed from "@/components/bot/LiveActivityFeed";
import StrategyConfig from "@/components/bot/StrategyConfig";
import { AnimatePresence, motion } from "framer-motion";

const StatusIndicator = ({ isLive }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full animate-pulse ${isLive ? 'bg-green-500' : 'bg-red-500'}`} />
    <span className="font-semibold text-lg">{isLive ? 'Bot is Live' : 'Bot is Offline'}</span>
  </div>
);

export default function Bot() {
  const [isLive, setIsLive] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [strategyStatus, setStrategyStatus] = useState({
    flashloan: false,
    arbitrage: false
  });
  const [configs, setConfigs] = useState({
    flashloan: {},
    arbitrage: {}
  });
  const [selectedStrategy, setSelectedStrategy] = useState('flashloan');

  useEffect(() => {
    // Set initial state from the singletons
    const initialState = botStateManager.getState();
    setIsLive(initialState.isLive);
    setStrategyStatus(initialState.activeStrategies);
    setExecutions(initialState.executions);
    setConfigs({
      flashloan: botEngine.strategies.flashloan.config,
      arbitrage: botEngine.strategies.arbitrage.config,
    });

    const unsubscribe = botStateManager.subscribe((state) => {
      setIsLive(state.isLive);
      setStrategyStatus(state.activeStrategies);
      setExecutions(state.executions);
    });

    return unsubscribe;
  }, []);

  const handleToggleStrategy = async (strategy) => {
    const isEnabled = strategyStatus[strategy];
    if (isEnabled) {
      botEngine.stop(strategy);
    } else {
      await botEngine.start(strategy);
    }
  };

  const handleConfigChange = (strategy, newConfig) => {
    botEngine.updateConfig(strategy, newConfig);
    setConfigs(prev => ({...prev, [strategy]: newConfig}));
  };

  const renderStrategyToggle = (strategy, name, icon) => {
    const Icon = icon;
    const isEnabled = strategyStatus[strategy];

    return (
      <Card key={strategy} className="bg-white/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-6 h-6" />
            <span>{name}</span>
          </CardTitle>
          <CardDescription>
            {strategy === 'flashloan' 
              ? "Execute high-speed trades using borrowed funds." 
              : "Exploit price differences across different exchanges."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Badge variant={isEnabled ? 'default' : 'destructive'}>
            {isEnabled ? 'Active' : 'Inactive'}
          </Badge>
          <div className="flex items-center space-x-2">
            <Label htmlFor={`${strategy}-switch`}>{isEnabled ? 'Disable' : 'Enable'}</Label>
            <Switch
              id={`${strategy}-switch`}
              checked={isEnabled}
              onCheckedChange={() => handleToggleStrategy(strategy)}
              aria-label={`Toggle ${name} strategy`}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Controls */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Bot Control Panel</span>
                  <StatusIndicator isLive={isLive} />
                </CardTitle>
                <CardDescription>
                  Enable or disable specific trading strategies. The main engine starts automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderStrategyToggle('flashloan', 'Flashloan Trading', Zap)}
                {renderStrategyToggle('arbitrage', 'DEX Arbitrage', DollarSign)}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-6 h-6" />
                  Strategy Configuration
                </CardTitle>
                 <CardDescription>
                  Fine-tune the parameters for your active strategies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex border-b mb-4">
                  <Button 
                    variant={selectedStrategy === 'flashloan' ? 'secondary' : 'ghost'} 
                    onClick={() => setSelectedStrategy('flashloan')}
                    className="flex-1 rounded-none"
                  >
                    Flashloan
                  </Button>
                  <Button 
                    variant={selectedStrategy === 'arbitrage' ? 'secondary' : 'ghost'} 
                    onClick={() => setSelectedStrategy('arbitrage')}
                    className="flex-1 rounded-none"
                  >
                    Arbitrage
                  </Button>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedStrategy}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <StrategyConfig 
                      strategy={selectedStrategy}
                      config={configs[selectedStrategy]}
                      onConfigChange={handleConfigChange}
                      isRunning={strategyStatus[selectedStrategy]}
                    />
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="lg:col-span-2">
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
            <Card className="shadow-lg h-full max-h-[calc(100vh-4rem)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  Live Activity Feed
                </CardTitle>
                <CardDescription>
                  Real-time stream of bot actions, trades, and system scans.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full">
                <LiveActivityFeed executions={executions} isRunning={isLive} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}