import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Users, Key, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import ToastContainer, { ToastItem } from './components/Toast';
import ActivationPage from './components/ActivationPage';
import UserDashboard from './components/UserDashboard';
import AdminPanel from './components/AdminPanel';
import { User as UserType, Plan, Settings } from './types';

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Toast notifications list
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch initial portal configuration (plans & payment info)
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.plans) setPlans(data.plans);
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      console.error("Config load error", e);
    }
  };

  // Validate session on load
  const validateSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    validateSession();

    // Parse referral code from URL search parameters (?ref=XYZ)
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setAuthMode('register');
      showToast(`Referral code ${ref} detected successfully!`, 'info');
    }
  }, []);

  // Handle Log out
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('token');
    setUser(null);
    showToast("You have been logged out successfully", "success");
  };

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter your email and password", "error");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        showToast(`Welcome, ${data.user.name}! Sign in successful.`, 'success');
        
        // Clear fields
        setEmail('');
        setPassword('');
      } else {
        showToast(data.error || "Login failed", 'error');
      }
    } catch (err) {
      showToast("Could not connect to the server", 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          referralCode: referralCode || undefined
        })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        showToast("Your account has been registered successfully!", 'success');
        
        // Clear fields
        setName('');
        setEmail('');
        setPassword('');
        setReferralCode('');
      } else {
        showToast(data.error || "Registration failed", 'error');
      }
    } catch (err) {
      showToast("Could not connect to the server", 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Refresh User state (e.g. after payment sub)
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center font-sans text-left" style={{ direction: 'ltr' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Loading session from server...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW ROUTING
  // ==========================================
  if (user) {
    // 1. Admin Module
    if (user.role === 'admin') {
      return (
        <>
          <AdminPanel onLogout={handleLogout} showToast={showToast} />
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </>
      );
    }

    // 2. Activation Page (Locks users who are not 'active')
    if (user.status !== 'active') {
      return (
        <>
          {settings && (
            <ActivationPage
              user={user}
              plans={plans}
              settings={settings}
              onPaymentSubmitted={refreshUser}
              onLogout={handleLogout}
              showToast={showToast}
            />
          )}
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </>
      );
    }

    // 3. Fully Active User Dashboard
    return (
      <>
        {settings && (
          <UserDashboard
            user={user}
            settings={settings}
            onLogout={handleLogout}
            showToast={showToast}
          />
        )}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  // ==========================================
  // LOGIN / SIGNUP SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-[#121214] flex items-center justify-center p-4 font-sans text-left" style={{ direction: 'ltr' }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="max-w-md w-full space-y-6">
        
        {/* Portal Title / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full glow-yellow mb-2">
            <Key className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-wide leading-none">Pak Earning Portal</h1>
          <p className="text-zinc-500 text-xs md:text-sm">Earn daily rewards through social media tasks & referrals</p>
        </div>

        {/* Form Container */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 glow-white space-y-6">
          
          {/* Tab buttons to toggle Auth Modes */}
          <div className="grid grid-cols-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => { setAuthMode('login'); setShowPassword(false); }}
              className={`py-3.5 px-4 rounded-xl text-md font-bold transition-all cursor-pointer ${
                authMode === 'login' ? 'bg-yellow-500 text-zinc-950 shadow-md shadow-yellow-500/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setShowPassword(false); }}
              className={`py-3.5 px-4 rounded-xl text-md font-bold transition-all cursor-pointer ${
                authMode === 'register' ? 'bg-yellow-500 text-zinc-950 shadow-md shadow-yellow-500/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Form */}
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-zinc-300 text-xs font-semibold block">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 p-3 pl-10 rounded-xl text-white font-mono focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                  />
                  <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300 text-xs font-semibold block">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 p-3 pl-10 pr-10 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                  />
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 text-zinc-950 py-3.5 rounded-2xl font-bold text-md shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </div>

              <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 text-center text-xs text-zinc-500 leading-relaxed">
                For Admin access: Use <span className="text-white font-bold font-mono select-all">admin@gmail.com</span> / Password: <span className="text-white font-bold font-mono select-all">admin</span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-zinc-300 text-xs font-semibold block">Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 p-3 pl-10 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                  />
                  <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300 text-xs font-semibold block">Email Address *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="username@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 p-3 pl-10 rounded-xl text-white font-mono focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                  />
                  <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300 text-xs font-semibold block">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 p-3 pl-10 pr-10 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                  />
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300 text-xs font-semibold block">Referral Code (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter referral code if any"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 p-3 pl-10 rounded-xl text-yellow-400 font-extrabold tracking-widest font-mono focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all uppercase"
                  />
                  <Users className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 text-zinc-950 py-3.5 rounded-2xl font-bold text-md shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Lock Screen Security Notice */}
        <div className="flex items-start gap-2.5 px-4 text-xs text-zinc-500 leading-relaxed justify-center">
          <ShieldAlert className="w-4.5 h-4.5 text-zinc-600 flex-shrink-0 mt-0.5" />
          <p>Security Note: After registration, your account must be activated before accessing tasks & dashboard.</p>
        </div>

      </div>
    </div>
  );
}
