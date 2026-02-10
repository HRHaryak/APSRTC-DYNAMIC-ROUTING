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
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ashokaEmblem from "@/assets/ashoka-emblem.png";
import apEmblem from "@/assets/ap-emblem.png";

type AppRole = "admin" | "route_planner" | "control_room" | "depot_official";

const navItems: { to: string; icon: typeof LayoutDashboard; label: string; roles?: AppRole[] }[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/live-map", icon: Map, label: "Live Map", roles: ["admin", "control_room"] },
  { to: "/routes", icon: Route, label: "Route Analytics", roles: ["admin", "route_planner", "depot_official"] },
  { to: "/recommendations", icon: Brain, label: "AI Insights", roles: ["admin", "route_planner"] },
  { to: "/reports", icon: FileBarChart, label: "Reports", roles: ["admin", "control_room", "depot_official"] },
  { to: "/settings", icon: Settings, label: "Settings", roles: ["admin"] },
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

  const filteredNav = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => roles.includes(r as any))
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Government tricolor band */}
      <div className="govt-tricolor-top h-1 w-full shrink-0" />

      {/* Top Government Header — dark navy */}
      <header className="govt-header-gradient px-6 py-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ashokaEmblem} alt="National Emblem" className="h-9 w-auto brightness-0 invert" />
            <div>
              <p className="text-sm font-bold text-white tracking-wide">
                Andhra Pradesh State Road Transport Corporation
              </p>
              <p className="text-[10px] text-white/70 tracking-wider">
                Government of Andhra Pradesh — Department of Transport
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img src={apEmblem} alt="AP Emblem" className="h-9 w-auto brightness-0 invert opacity-80" />
            <div className="hidden md:block text-right">
              <p className="text-xs text-white/90 font-medium">{profile?.full_name || "User"}</p>
              <p className="text-[10px] text-white/60">{roleLabel}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary bar — platform name */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-muted transition-colors">
            <Menu className="h-4 w-4 text-muted-foreground" />
          </button>
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Dynamic Route Optimization Platform</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">| APSRTC Operations</span>
        </div>
        <span className="text-[10px] text-muted-foreground">v1.0.0</span>
      </div>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Light Sidebar */}
        <aside
          className={cn(
            "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 shrink-0",
            collapsed ? "w-14" : "w-56"
          )}
        >
          {/* Section label */}
          {!collapsed && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                Navigation
              </p>
            </div>
          )}

          {/* Nav items */}
          <nav className="flex-1 space-y-0.5 px-2 py-1 overflow-y-auto scrollbar-thin">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-sidebar-border p-2 space-y-0.5">
            {!collapsed && (
              <div className="px-3 py-2 mb-1 rounded-md bg-muted/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Logged in as</p>
                <p className="text-xs text-foreground font-medium truncate">{profile?.full_name || "User"}</p>
                <p className="text-[10px] text-primary font-semibold">{roleLabel}</p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {!collapsed && <span>Collapse</span>}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
