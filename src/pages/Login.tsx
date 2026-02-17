import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ashokaEmblem from "@/assets/ashoka-emblem.png";
import apsrtcLogo from "@/assets/apsrtc-logo.png";

export default function Login() {
  const { session, loading, signIn, signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setSubmitting(true);
    if (isSignUp) {
      const { error } = await signUp(username, password, fullName);
      if (error) setError(error);
      else setSignUpSuccess(true);
    } else {
      const { error } = await signIn(username, password);
      if (error) setError(error);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Tricolor band */}
      <div className="govt-tricolor-top h-1.5 w-full shrink-0" />

      {/* Official Government Header — dark navy */}
      <header className="govt-header-gradient py-4 px-6 shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ashokaEmblem} alt="National Emblem of India" className="h-12 w-auto brightness-0 invert" />
            <div>
              <p className="text-base font-bold text-white tracking-wide">
                Government of Andhra Pradesh
              </p>
              <p className="text-[11px] text-white/75 tracking-wider">
                Department of Transport
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-[11px] text-white/75 tracking-wider">
                Andhra Pradesh State Road
              </p>
              <p className="text-[11px] text-white/75 tracking-wider">
                Transport Corporation
              </p>
            </div>
            <img src={apsrtcLogo} alt="APSRTC Logo" className="h-14 w-auto" />
          </div>
        </div>
      </header>

      {/* Sub header — platform name */}
      <div className="border-b border-border bg-card px-6 py-2">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Dynamic Route Optimization Platform
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">Official Use Only</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Login card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm govt-card">
            <div className="mb-5 text-center">
              <h1 className="text-lg font-bold text-foreground">APSRTC Operations Portal</h1>
              <p className="text-xs text-muted-foreground mt-1">Authorized Personnel Only</p>
            </div>

            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="h-5 w-1 rounded-full bg-accent" />
              <h2 className="text-sm font-semibold text-foreground">
                {isSignUp ? "New User Registration" : "Official Login"}
              </h2>
            </div>

            {signUpSuccess ? (
              <div className="text-center space-y-3 py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-ok/10">
                  <Shield className="h-6 w-6 text-status-ok" />
                </div>
                <p className="text-sm font-medium text-foreground">Registration Submitted</p>
                <p className="text-xs text-muted-foreground">
                  Please check your official email to verify your account, then sign in.
                </p>
                <button
                  onClick={() => { setIsSignUp(false); setSignUpSuccess(false); }}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Default Credentials Notice */}
                {!isSignUp && (
                  <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2.5 text-xs text-primary">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <div>
                      <strong>Default Users:</strong> admin/planner/control_room/depot<br />
                      <strong>Password:</strong> &lt;username&gt;123
                    </div>
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">Full Name <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="As per official records"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Username {isSignUp && <span className="text-destructive">*</span>}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="admin"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                  disabled={submitting}
                  className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Please wait..." : isSignUp ? "Submit Registration" : "Sign In"}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  {isSignUp ? "Already registered?" : "New employee?"}{" "}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                    className="text-primary font-medium hover:underline"
                  >
                    {isSignUp ? "Sign In" : "Register"}
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Security notice */}
          <div className="mt-4 rounded-md border border-border bg-muted/50 px-4 py-3">
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              <span className="font-semibold text-foreground">Security Notice:</span> This is a Government of Andhra Pradesh
              restricted system. Unauthorized access is prohibited under the Information Technology Act, 2000.
              All activities are logged and monitored.
            </p>
          </div>

          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            © Government of Andhra Pradesh — APSRTC Dynamic Route Optimization Platform v1.0
          </p>
        </div>
      </div>

      {/* Bottom tricolor */}
      <div className="govt-tricolor-bottom h-1.5 w-full shrink-0" />
    </div>
  );
}
