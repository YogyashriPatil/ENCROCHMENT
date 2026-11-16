
import {
  LayoutDashboard,
  Map,
  ScanSearch,
  AlertTriangle,
  FileText,
  Settings,
  Satellite,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useState } from "react";

const navigation = [
  {
    title: "MAIN MENU",
    items: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard },
      { name: "GIS Monitoring", path: "/map", icon: Map },
      { name: "Image Analysis", path: "/analysis", icon: ScanSearch },
      { name: "Encroachment Cases", path: "/cases", icon: AlertTriangle },
      { name: "Reports", path: "/reports", icon: FileText },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen bg-[#101827] text-gray-300 flex flex-col border-r border-white/10 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="h-20 flex items-center px-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
          <Satellite size={23} className="text-white" />
        </div>

        {!collapsed && (
          <div className="ml-3">
            <h1 className="text-white font-bold text-sm">
              TerraWatch
            </h1>
            <p className="text-xs text-gray-500">
              Intelligence System
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 overflow-y-auto">
        {navigation.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[10px] font-semibold tracking-widest text-gray-500 px-3 mb-4">
                {section.title}
              </p>
            )}

            <div className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.name : ""}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={19} className="shrink-0" />

                    {!collapsed && (
                      <span className="text-sm font-medium">
                        {item.name}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="px-3 py-4 border-t border-white/10">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-3 rounded-xl ${
              isActive
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`
          }
        >
          <Settings size={19} />
          {!collapsed && <span className="text-sm">Settings</span>}
        </NavLink>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-3 w-full flex items-center justify-center p-3 rounded-xl hover:bg-white/5 text-gray-400"
        >
          {collapsed ? (
            <ChevronRight size={19} />
          ) : (
            <ChevronLeft size={19} />
          )}
        </button>
      </div>
    </aside>
  );
}
