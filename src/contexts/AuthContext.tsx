import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Simple User Interface matching backend response
interface SimpleUser {
  username: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  session: { access_token: string, user: SimpleUser } | null;
  user: SimpleUser | null;
  roles: string[];
  profile: { full_name: string | null; employee_id: string | null } | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
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

  const signIn = async (username: string, password: string) => {
    try {
      // Use OAuth2 password flow - FormData format required
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        body: formData,
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
      console.error("Sign in error:", err);
      return { error: "Network error or server unavailable" };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Registration requires admin privileges
    return { error: "Registration requires admin privileges. Please contact your administrator." };
  };

  const signOut = async () => {
    // Call logout endpoint
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        await fetch("http://localhost:8000/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error("Logout error:", err);
      }
    }

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

