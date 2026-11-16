
import {
  Search,
  Bell,
  ChevronDown,
  ShieldCheck,
  Menu,
} from "lucide-react";

import { useLocation } from "react-router-dom";

const pageTitles = {
  "/": "Dashboard",
  "/map": "GIS Monitoring",
  "/analysis": "Image Analysis",
  "/cases": "Encroachment Cases",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function Topbar() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "Dashboard";

  return (
    <header className="h-20 bg-[#111c2e] border-b border-white/10 flex items-center justify-between px-8">

      {/* Left Section */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span>TerraWatch</span>
          <span>/</span>
          <span className="text-emerald-400">{pageTitle}</span>
        </div>

        <h2 className="text-xl font-semibold text-white">
          {pageTitle}
        </h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-5">

        {/* Search */}
        <div className="hidden md:flex items-center bg-[#1b293d] border border-white/10 rounded-xl px-4 py-2.5 w-64">
          <Search size={17} className="text-gray-500" />

          <input
            type="text"
            placeholder="Search anything..."
            className="bg-transparent outline-none text-sm text-white placeholder-gray-500 ml-3 w-full"
          />

          <span className="text-xs text-gray-500">⌘ K</span>
        </div>

        {/* Monitoring Status */}
        <div className="hidden lg:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">
            Monitoring Active
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
          <Bell size={20} />

          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Divider */}
        <div className="h-9 w-px bg-white/10" />

        {/* Profile */}
        <button className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center">
            <span className="text-white font-bold">AD</span>
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-white">
              Administrator
            </p>
            <p className="text-xs text-gray-500">
              System Admin
            </p>
          </div>

          <ChevronDown size={16} className="text-gray-500" />
        </button>

      </div>
    </header>
  );
}
