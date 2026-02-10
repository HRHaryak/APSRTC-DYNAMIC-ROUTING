import { useState } from "react";
import { Bus, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      {/* Govt Header Band */}
      <div className="fixed top-0 left-0 right-0 govt-header-gradient py-2 px-6 text-center">
        <p className="text-[11px] font-medium text-white tracking-wide">
          Government of Andhra Pradesh — Department of Transport
        </p>
      </div>

      <div className="w-full max-w-sm">
        {/* Emblem area */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Bus className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">APSRTC Operations Portal</h1>
          <p className="text-xs text-muted-foreground mt-1">Andhra Pradesh State Road Transport Corporation</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Username / Employee ID</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          APSRTC Dynamic Route Optimization Platform v1.0 — © Govt. of Andhra Pradesh
        </p>
      </div>
    </div>
  );
}
