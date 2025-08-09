import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Rocket,
  CheckCircle,
  AlertTriangle,
  Settings,
  Globe,
  Shield,
  Download,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export default function Opportunities() {
  const [deploymentStep, setDeploymentStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);

  const deploymentSteps = [
    {
      id: 1,
      title: "Environment Setup",
      description: "Configure your production environment variables",
      status: "pending",
      details: [
        "Set up Polygon mainnet RPC endpoint",
        "Configure wallet private key securely",
        "Set gas price and limit parameters",
        "Enable production logging"
      ]
    },
    {
      id: 2,
      title: "Smart Contract Deployment", 
      description: "Deploy flashloan contracts to Polygon",
      status: "pending",
      details: [
        "Deploy flashloan aggregator contract",
        "Set up DEX router connections",
        "Configure lending pool addresses",
        "Test contract interactions"
      ]
    },
    {
      id: 3,
      title: "Bot Configuration",
      description: "Set production trading parameters",
      status: "pending",
      details: [
        "Set conservative profit thresholds",
        "Configure safety limits",
        "Set up monitoring alerts",
        "Enable emergency stop mechanisms"
      ]
    },
    {
      id: 4,
      title: "Go Live",
      description: "Launch your bot with real funds",
      status: "pending",
      details: [
        "Start with minimal capital",
        "Monitor first trades closely",
        "Gradually increase position sizes",
        "Scale based on performance"
      ]
    }
  ];

  const handleDeploy = () => {
    setIsDeploying(true);
    // Simulate deployment process
    setTimeout(() => {
      setIsDeploying(false);
      alert("Deployment simulation completed! In production, this would deploy your contracts and start the live bot.");
    }, 3000);
  };

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
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Deploy to Production
            </h1>
          </div>
          <p className="text-xl text-slate-600 font-medium">
            Launch your arbitrage bot on Polygon mainnet with real funds
          </p>
        </motion.div>

        {/* Current Status Alert */}
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-amber-800">
            <strong>Demo Mode:</strong> This deployment wizard is for educational purposes. 
            Real production deployment requires additional security measures and testing.
          </AlertDescription>
        </Alert>

        {/* Deployment Steps */}
        <div className="space-y-6 mb-8">
          {deploymentSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg ${
                deploymentStep === step.id ? 'ring-2 ring-orange-200' : ''
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-emerald-100' :
                        deploymentStep === step.id ? 'bg-orange-100' : 'bg-slate-100'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <span className="font-bold text-sm">{step.id}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                        <p className="text-sm text-slate-600">{step.description}</p>
                      </div>
                    </div>
                    <Badge variant={
                      step.status === 'completed' ? 'default' :
                      deploymentStep === step.id ? 'secondary' : 'outline'
                    }>
                      {step.status === 'completed' ? 'Complete' :
                       deploymentStep === step.id ? 'Active' : 'Pending'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  {deploymentStep === step.id && (
                    <div className="mt-4 flex gap-3">
                      <Button 
                        size="sm"
                        onClick={() => setDeploymentStep(step.id + 1)}
                        disabled={step.id === 4}
                      >
                        {step.id === 4 ? 'Ready to Deploy' : 'Next Step'}
                      </Button>
                      {step.id === 4 && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={handleDeploy}
                          disabled={isDeploying}
                        >
                          {isDeploying ? 'Deploying...' : '🚀 Deploy Live Bot'}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Resources */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Deployment Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Config
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Mainnet Guide
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security Checklist
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}