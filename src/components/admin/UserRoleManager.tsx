import { useState, useEffect, useCallback } from "react";
import { Users, Shield, Plus, X, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface UserWithRoles {
  id: string;
  full_name: string | null;
  employee_id: string | null;
  created_at: string;
  roles: string[];
}

const ALL_ROLES = ["admin", "route_planner", "control_room", "depot_official"] as const;

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  route_planner: "Route Planner",
  control_room: "Control Room",
  depot_official: "Depot Official",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  route_planner: "bg-primary/10 text-primary border-primary/20",
  control_room: "bg-status-warn/10 text-status-warn border-status-warn/20",
  depot_official: "bg-status-ok/10 text-status-ok border-status-ok/20",
};

export default function UserRoleManager() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await supabase.functions.invoke("admin-users", {
      method: "GET",
    });

    if (res.error) {
      setError(res.error.message || "Failed to load users");
    } else {
      setUsers(res.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const assignRole = async (userId: string, role: string) => {
    setActionLoading(`${userId}-${role}-add`);
    const res = await supabase.functions.invoke("admin-users", {
      method: "POST",
      body: { user_id: userId, role },
    });
    if (res.error) {
      setError(res.error.message || "Failed to assign role");
    } else {
      await fetchUsers();
    }
    setActionLoading(null);
  };

  const removeRole = async (userId: string, role: string) => {
    setActionLoading(`${userId}-${role}-remove`);
    const res = await supabase.functions.invoke("admin-users", {
      method: "DELETE",
      body: { user_id: userId, role },
    });
    if (res.error) {
      setError(res.error.message || "Failed to remove role");
    } else {
      await fetchUsers();
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No users found.</p>
      ) : (
        <div className="divide-y divide-border">
          {users.map((user) => {
            const availableRoles = ALL_ROLES.filter((r) => !user.roles.includes(r));
            return (
              <div key={user.id} className="py-3 px-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.full_name || "Unnamed User"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      {user.employee_id || user.id.slice(0, 8)}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {/* Current roles */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {user.roles.length === 0 && (
                    <span className="text-[10px] text-muted-foreground italic">No roles assigned</span>
                  )}
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className={cn(
                        "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium",
                        ROLE_COLORS[role] || "bg-secondary text-secondary-foreground border-border"
                      )}
                    >
                      {ROLE_LABELS[role] || role}
                      <button
                        onClick={() => removeRole(user.id, role)}
                        disabled={actionLoading === `${user.id}-${role}-remove`}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors disabled:opacity-50"
                        title={`Remove ${ROLE_LABELS[role]} role`}
                      >
                        {actionLoading === `${user.id}-${role}-remove` ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <X className="h-2.5 w-2.5" />
                        )}
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add role buttons */}
                {availableRoles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {availableRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => assignRole(user.id, role)}
                        disabled={actionLoading === `${user.id}-${role}-add`}
                        className="inline-flex items-center gap-1 rounded border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `${user.id}-${role}-add` ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Plus className="h-2.5 w-2.5" />
                        )}
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
