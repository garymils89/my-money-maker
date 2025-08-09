import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Zap, Search } from 'lucide-react';

const eventIcons = {
    trade: <CheckCircle className="text-emerald-500" />,
    flashloan_trade: <Zap className="text-purple-500" />,
    scan: <Search className="text-slate-500" />,
    alert: <AlertTriangle className="text-amber-500" />,
    error: <AlertTriangle className="text-red-500" />
};

export default function LiveActivityFeed({ executions, isRunning }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Live Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 h-96 overflow-y-auto pr-2">
                    <AnimatePresence>
                        {executions.length > 0 ? executions.map((e) => (
                            <motion.div
                                key={e.client_id}
                                layout
                                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                            >
                                <div className="mt-1">{eventIcons[e.execution_type] || <CheckCircle />}</div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium capitalize">{e.execution_type.replace('_', ' ')}</p>
                                        <Badge variant="outline">{e.status}</Badge>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        {e.details?.message || `Profit: $${e.profit_realized?.toFixed(2)}`}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(e.created_date || Date.now()).toLocaleTimeString()}
                                    </p>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="text-center py-10">
                                <p className="text-slate-500">
                                    {isRunning ? "Waiting for bot activity..." : "Start the bot to see live events."}
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
}