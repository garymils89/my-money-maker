
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, CheckCircle, Shield, Copy, ExternalLink, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Step = ({ number, title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: number * 0.1 }}
    className="flex items-start gap-4"
  >
    <div className="flex-shrink-0 w-10 h-10 bg-slate-900 text-white font-bold rounded-full flex items-center justify-center text-lg">{number}</div>
    <div className="flex-1">
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <div className="text-slate-600 space-y-4">{children}</div>
    </div>
  </motion.div>
);

const EnvVarInput = ({ name, description, isPublic = false }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-50 p-3 rounded-lg border">
      <div className="flex justify-between items-center">
        <Label htmlFor={name} className="font-mono text-sm text-slate-800">{name}</Label>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
      <Input id={name} placeholder={isPublic ? "Paste your public address here" : "Paste your secret value here in Vercel"} className="mt-2 bg-white" />
    </div>
  );
};


export default function DeployPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Go Live with ArbitrageX
            </h1>
          </div>
          <p className="text-xl text-slate-600 font-medium">
            Follow these steps to deploy your app to the internet.
          </p>
        </motion.div>

        <div className="space-y-10">
          <Step number="1" title="Push Your Code to GitHub">
            <p>Your app needs to be in a GitHub repository. If you haven't done this yet, you can create a new repository and follow the instructions to push your local project.</p>
            <Button asChild variant="outline">
              <a href="https://github.com/new" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Create a GitHub Repository
              </a>
            </Button>
          </Step>

          <Step number="2" title="Deploy with Vercel">
            <p>Vercel is a platform that makes it incredibly easy to deploy web apps. Sign up for a free account using your GitHub profile.</p>
            <p>Once signed in, click "Add New... &gt; Project", select your ArbitrageX GitHub repository, and click "Import".</p>
            <Button asChild className="bg-black hover:bg-gray-800 text-white">
              <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer">
                Deploy to Vercel
              </a>
            </Button>
          </Step>

          <Step number="3" title="Add Environment Variables">
            <p>This is the most important security step. On the Vercel "Configure Project" screen, expand the "Environment Variables" section. Add the following variables:</p>
            <Card>
              <CardContent className="p-4 space-y-4">
                <EnvVarInput 
                  name="VITE_WALLET_PUBLIC_ADDRESS"
                  description="Your public wallet address (e.g., 0x...). This is safe to share and is used to check balances."
                  isPublic={true}
                />
                <EnvVarInput 
                  name="VITE_WALLET_PRIVATE_KEY"
                  description="Your wallet's private key. This is stored securely and never exposed to the frontend."
                />
                <EnvVarInput 
                  name="VITE_POLYGON_RPC_URL"
                  description="A Polygon RPC URL. You can get a free one from services like Alchemy or Infura."
                />
              </CardContent>
            </Card>
            <Alert variant="destructive">
              <Shield className="w-4 h-4" />
              <AlertDescription>
                <strong>Critical:</strong> Never, ever commit your private key to your GitHub repository. Only add it as an environment variable on Vercel.
              </AlertDescription>
            </Alert>
          </Step>

          <Step number="4" title="Deploy!">
            <p>Once your project is configured and the environment variables are set, click the "Deploy" button on Vercel.</p>
            <p>Vercel will build your application and deploy it to a live URL (e.g., `arbitragex-your-name.vercel.app`). Congratulations, your application is now live!</p>
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-8 h-8"/>
              <div>
                <h4 className="font-bold">Deployment Complete!</h4>
                <p>You can now access your app from anywhere and your trading bot can run 24/7.</p>
              </div>
            </div>
          </Step>
        </div>
      </div>
    </div>
  );
}
