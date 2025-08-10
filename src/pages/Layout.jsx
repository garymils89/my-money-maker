

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BarChart3,
  DollarSign,
  Zap,
  Database,
  Rocket,
  FileText,
  Shield
} from "lucide-react";

// SIMPLIFIED - Only 4 pages you need to make money
const navigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: BarChart3 },
  { title: "FlashLoan Bot", url: createPageUrl("Bot"), icon: Zap },
  { title: "Live Database", url: createPageUrl("Analytics"), icon: Database },
  { title: "Portfolio", url: createPageUrl("Portfolio"), icon: FileText },
  { title: "Deploy", url: createPageUrl("Opportunities"), icon: Rocket },
  { title: "Live Setup", url: createPageUrl("Setup"), icon: Shield },
  { title: "🚨 GO LIVE", url: createPageUrl("Texastea"), icon: DollarSign },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col">
        <header className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl">ArbitrageX</h2>
              <p className="text-xs text-slate-400">Money Maker</p>
            </div>
          </div>
        </header>

        <nav className="flex-1 p-3">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.title}>
                <Link
                  to={item.url}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-all duration-200 ${
                    location.pathname === item.url
                      ? 'bg-slate-800 text-orange-400'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-orange-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="p-4 border-t border-slate-700/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="font-bold text-sm">💰</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Ready to Trade</p>
                <p className="text-xs text-slate-400">Let's Make Money</p>
              </div>
            </div>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

