import React from 'react';
import { Home, Radio, Map, BarChart3, Database, ChevronRight, Layers } from 'lucide-react';

export type PortalTab = 'home' | 'nowcast' | 'maps' | 'analysis' | 'database';

interface PortalNavBarProps {
  activeTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
  isBackendConnected?: boolean;
}

export const PortalNavBar: React.FC<PortalNavBarProps> = ({
  activeTab,
  onTabChange,
  isBackendConnected = true
}) => {
  const tabs = [
    { id: 'home' as PortalTab, label: 'Home', icon: Home },
    { id: 'nowcast' as PortalTab, label: 'Nowcast Map (0-6h)', icon: Radio, pulse: true },
    { id: 'maps' as PortalTab, label: 'Maps (Forecast)', icon: Layers },
    { id: 'analysis' as PortalTab, label: 'Analysis', icon: BarChart3 },
    { id: 'database' as PortalTab, label: 'Database', icon: Database },
  ];

  return (
    <nav className="bg-[#DF691A] text-white shadow-md select-none sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-12">
        {/* Navigation Links */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-md text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#FAF5EE] text-[#DF691A] shadow-inner font-extrabold'
                    : 'text-amber-50 hover:bg-amber-600/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.pulse && (
                  <span className="flex h-2 w-2 relative ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Info: Live System Operational Badge */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 text-[11px] font-medium border border-white/10">
            <Radio className="w-3 h-3 text-emerald-300 animate-pulse" />
            <span>0–6h Convective Nowcast Operational</span>
          </div>

          <button
            onClick={() => onTabChange('nowcast')}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-900/60 hover:bg-amber-900 text-amber-100 hover:text-white rounded-lg text-xs font-semibold transition-all border border-amber-400/30"
          >
            <span>Live Radar & GIS</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
