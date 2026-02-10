import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Route,
  Brain,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ashokaEmblem from "@/assets/ashoka-emblem.png";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/live-map", icon: Map, label: "Live Map" },
  { to: "/routes", icon: Route, label: "Route Analytics" },
  { to: "/recommendations", icon: Brain, label: "AI Insights" },
  { to: "/reports", icon: FileBarChart, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, roles } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const roleLabel = roles.length > 0
    ? roles.map(r => r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())).join(", ")
    : "User";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Sidebar header with official branding */}
        <div className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <img
              src={ashokaEmblem}
              alt="National Emblem"
              className="h-9 w-auto shrink-0 brightness-0 invert opacity-90"
            />
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="truncate text-[11px] font-bold text-white tracking-wider uppercase">
                  APSRTC
                </p>
                <p className="truncate text-[9px] text-sidebar-foreground/70 tracking-wide">
                  Andhra Pradesh State Road
                </p>
                <p className="truncate text-[9px] text-sidebar-foreground/70 tracking-wide">
                  Transport Corporation
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="px-4 pb-2">
              <div className="rounded bg-sidebar-accent/60 px-2.5 py-1.5">
                <p className="text-[9px] text-sidebar-foreground/60 uppercase tracking-widest">
                  Govt. of Andhra Pradesh
                </p>
                <p className="text-[9px] text-sidebar-foreground/60">
                  Dept. of Transport
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation label */}
        {!collapsed && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[9px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
              Navigation
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 space-y-0.5">
          {/* User info */}
          {!collapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Logged in as</p>
              <p className="text-xs text-white font-medium truncate">{profile?.full_name || "User"}</p>
              <p className="text-[10px] text-sidebar-primary font-semibold">{roleLabel}</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Government tricolor band */}
        <div className="govt-tricolor-top h-1 w-full shrink-0" />

        {/* Top bar */}
        <header className="flex h-12 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">Dynamic Route Optimization Platform</span>
            <span className="text-border">|</span>
            <span>APSRTC — Govt. of Andhra Pradesh</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>v1.0.0</span>
            <span className="h-4 w-px bg-border" />
            <span>{profile?.full_name || "User"}</span>
            <span className="h-4 w-px bg-border" />
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{roleLabel}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
