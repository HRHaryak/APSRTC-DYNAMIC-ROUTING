import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js"; // Keeping User type or we can define our own, but to minimize breakage we can mock it or use a simple interface

// Simple User Interface matching backend response
interface SimpleUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

// Map SimpleUser to a structure compatible with the app's existing usage (Supabase User-like)
// The app uses `User` from supabase which has `id`, `email`, etc.
// We can cast our SimpleUser to any to allow it to pass as User for now, or define a compatible type.

interface AuthContextType {
  session: { access_token: string, user: SimpleUser } | null;
  user: SimpleUser | null;
  roles: string[];
  profile: { full_name: string | null; employee_id: string | null } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ access_token: string, user: SimpleUser } | null>(null);
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null; employee_id: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user_data");

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setSession({ access_token: token, user: parsedUser });
        setUser(parsedUser);
        setRoles([parsedUser.role]);
        setProfile({ full_name: parsedUser.full_name, employee_id: null });
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Point to FastApi backend
      // Assuming Vite proxy is set up or using direct URL. 
      // Based on previous context, backend runs on 8000.
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.detail || "Login failed" };
      }

      const data = await response.json();
      // data = { access_token, token_type, user }

      const sessionData = { access_token: data.access_token, user: data.user };

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));

      setSession(sessionData);
      setUser(data.user);
      setRoles([data.user.role]);
      setProfile({ full_name: data.user.full_name, employee_id: null });

      return { error: null };
    } catch (err) {
      return { error: "Network error or server unavailable" };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // For now, sign up is disabled or just mock it to fail/succeed
    return { error: "Registration is disabled in this mode. Please use the admin credentials." };
  };

  const signOut = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    setSession(null);
    setUser(null);
    setRoles([]);
    setProfile(null);
  };

  const hasRole = (role: string) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ session, user, roles, profile, loading, signIn, signUp, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

