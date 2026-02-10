import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ashokaEmblem from "@/assets/ashoka-emblem.png";
import apEmblem from "@/assets/ap-emblem.png";

export default function Login() {
  const { session, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
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
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error);
      else setSignUpSuccess(true);
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Tricolor band */}
      <div className="govt-tricolor-top h-1.5 w-full shrink-0" />

      {/* Official Government Header */}
      <header className="govt-header-gradient py-3 px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-4">
          <img src={ashokaEmblem} alt="National Emblem of India" className="h-10 w-auto" />
          <div className="text-center">
            <p className="text-[13px] font-bold text-white tracking-wide uppercase">
              Government of Andhra Pradesh
            </p>
            <p className="text-[10px] text-white/80 tracking-wider">
              Department of Transport — Andhra Pradesh State Road Transport Corporation
            </p>
          </div>
          <img src={apEmblem} alt="Emblem of Andhra Pradesh" className="h-10 w-auto" />
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo section */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-lg font-bold text-foreground">APSRTC Operations Portal</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Dynamic Route Optimization Platform
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Authorized Personnel Only — Official Use
            </p>
          </div>

          {/* Login card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm govt-card">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="h-5 w-1 rounded-full bg-primary" />
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

                {isSignUp && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">Full Name *</label>
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
                    {isSignUp ? "Official Email ID *" : "Email ID"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="employee@apsrtc.ap.gov.in"
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
            APSRTC Dynamic Route Optimization Platform v1.0 — © Government of Andhra Pradesh
          </p>
        </div>
      </div>

      {/* Bottom tricolor */}
      <div className="govt-tricolor-bottom h-1.5 w-full shrink-0" />
    </div>
  );
}
