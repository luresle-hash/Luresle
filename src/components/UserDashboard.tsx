import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Award,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  Copy,
  Share2,
  Calendar,
  Youtube,
  Send,
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  ShieldAlert,
  UploadCloud,
  FileText,
  DollarSign,
  ChevronRight,
  Bell
} from 'lucide-react';
import { User as UserType, Task, Settings, DashboardStats, Payment, Withdrawal, DailyClaim, AppNotification } from '../types';

interface UserDashboardProps {
  user: UserType;
  settings: Settings;
  onLogout: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function UserDashboard({ user, settings, onLogout, showToast }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'referrals' | 'withdraw' | 'deposit' | 'profile'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskVerification, setTaskVerification] = useState('');
  const [taskScreenshot, setTaskScreenshot] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);

  // Withdraw state
  const [withdrawMethod, setWithdrawMethod] = useState<'easypaisa' | 'jazzcash'>('easypaisa');
  const [withdrawTitle, setWithdrawTitle] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [myWithdrawals, setMyWithdrawals] = useState<Withdrawal[]>([]);

  // Deposit state
  const [depositMethod, setDepositMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [depositTxId, setDepositTxId] = useState('');
  const [depositSender, setDepositSender] = useState('');
  const [depositReceiver, setDepositReceiver] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositScreenshot, setDepositScreenshot] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [myDeposits, setMyDeposits] = useState<Payment[]>([]);

  // Claim countdown
  const [claimTimer, setClaimTimer] = useState<number>(0); // seconds remaining

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Load stats and histories
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/user/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        if (data.claimCooldown) {
          setClaimTimer(data.claimCooldown);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTaskHistory = async () => {
    try {
      const res = await fetch('/api/tasks/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.history) {
        setTaskHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/withdrawals/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.withdrawals) {
        setMyWithdrawals(data.withdrawals);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDeposits = async () => {
    try {
      const res = await fetch('/api/payments/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.payments) {
        // Only get deposit type
        const deposits = data.payments.filter((p: any) => p.type === 'deposit');
        setMyDeposits(deposits);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchTasks();
    fetchTaskHistory();
    fetchWithdrawals();
    fetchDeposits();
    fetchNotifications();

    // Poll stats & notifications
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Timer Countdown for Daily claim
  useEffect(() => {
    if (claimTimer <= 0) return;
    const interval = setInterval(() => {
      setClaimTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [claimTimer]);

  const handleCopy = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${title} copied successfully!`, 'success');
  };

  const handleShare = async (title: string, text: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        showToast("Link shared successfully!", "success");
      } catch (err) {
        console.error(err);
      }
    } else {
      handleCopy(url, "Referral Link");
    }
  };

  // Claim Daily Bonus
  const handleDailyClaim = async () => {
    try {
      const res = await fetch('/api/daily-claims/claim', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Daily attendance bonus of Rs. ${data.reward} claimed successfully!`, 'success');
        fetchDashboardStats();
      } else {
        showToast(data.error || "Failed to claim daily bonus.", 'error');
      }
    } catch (e) {
      showToast("Unable to connect to the server.", 'error');
    }
  };

  // Submit Task Verification
  const handleTaskScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTaskScreenshot(reader.result as string);
        showToast("Task screenshot uploaded successfully.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !taskVerification) {
      showToast("Please provide the verification details.", "error");
      return;
    }

    setSubmittingTask(true);
    try {
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          verification: taskVerification,
          screenshot: taskScreenshot
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Task proof submitted successfully! The admin will verify it soon.", "success");
        setSelectedTask(null);
        setTaskVerification('');
        setTaskScreenshot('');
        fetchTasks();
        fetchTaskHistory();
        fetchDashboardStats();
      } else {
        showToast(data.error || "Failed to submit task proof.", "error");
      }
    } catch (err) {
      showToast("Connection to the server failed.", "error");
    } finally {
      setSubmittingTask(false);
    }
  };

  // Submit Withdrawal
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawTitle || !withdrawPhone || !withdrawAmount) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    if (parseFloat(withdrawAmount) > (stats?.user.walletBalance || 0)) {
      showToast("Insufficient balance.", "error");
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          method: withdrawMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash',
          accountTitle: withdrawTitle,
          phoneNumber: withdrawPhone,
          amount: withdrawAmount
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Withdrawal request submitted successfully!", "success");
        setWithdrawTitle('');
        setWithdrawPhone('');
        setWithdrawAmount('');
        fetchWithdrawals();
        fetchDashboardStats();
      } else {
        showToast(data.error || "Failed to submit withdrawal request.", "error");
      }
    } catch (err) {
      showToast("Server error occurred.", "error");
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Submit Deposit
  const handleDepositScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDepositScreenshot(reader.result as string);
        showToast("Deposit receipt screenshot uploaded successfully.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositTxId || !depositSender || !depositReceiver || !depositAmount || !depositScreenshot) {
      showToast("All fields and a payment screenshot are required.", "error");
      return;
    }

    setSubmittingDeposit(true);
    try {
      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'deposit',
          amount: depositAmount,
          transactionId: depositTxId,
          senderNumber: depositSender,
          receiverNumber: depositReceiver,
          screenshot: depositScreenshot
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Deposit details submitted! Your balance will be updated after admin approval.", "success");
        setDepositTxId('');
        setDepositSender('');
        setDepositReceiver('');
        setDepositAmount('');
        setDepositScreenshot('');
        fetchDeposits();
        fetchDashboardStats();
      } else {
        showToast(data.error || "Failed to submit deposit proof.", "error");
      }
    } catch (err) {
      showToast("Server connection failed.", "error");
    } finally {
      setSubmittingDeposit(false);
    }
  };

  // Format countdown string
  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const referralLink = `${window.location.origin}/?ref=${stats?.user.referralCode || user.referralCode}`;

  const getCategoryIcon = (imageName: string) => {
    switch (imageName) {
      case 'Youtube':
      case 'PlayCircle':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'MessageCircle':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'Send':
        return <Send className="w-5 h-5 text-sky-400" />;
      case 'Facebook':
        return <Facebook className="w-5 h-5 text-blue-600" />;
      case 'Instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-zinc-400" />;
      default:
        return <Calendar className="w-5 h-5 text-yellow-500" />;
    }
  };

  const currentDepositMethodDetails = () => {
    switch (depositMethod) {
      case 'easypaisa':
        return {
          name: "EasyPaisa",
          account: settings.easyPaisaAccount,
          title: settings.easyPaisaName,
          desc: "Transfer the amount from your EasyPaisa account to the number below and upload the proof below."
        };
      case 'jazzcash':
        return {
          name: "JazzCash",
          account: settings.jazzCashAccount,
          title: settings.jazzCashName,
          desc: "Transfer the amount from your JazzCash account to the number below and upload the proof below."
        };
      case 'bank':
        return {
          name: "Bank Transfer",
          account: settings.bankAccount,
          title: settings.bankTitle,
          bankName: settings.bankName,
          desc: "Transfer the amount from your banking app to the account below and upload the receipt image below."
        };
    }
  };

  const depositDetails = currentDepositMethodDetails();

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#121214] flex flex-col font-sans text-left" style={{ direction: 'ltr' }}>
      
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 glass-card border-b border-white/5 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center font-bold text-zinc-950 shadow-md">
            {stats?.user.name.substring(0, 2) || user.name.substring(0, 2)}
          </div>
          <div>
            <h1 className="text-white font-bold leading-none">{stats?.user.name || user.name}</h1>
            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 mt-1 justify-start">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Account
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifPanel(!showNotifPanel);
                if (!showNotifPanel) markNotificationsRead();
              }}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-zinc-300 relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#121214]">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifPanel && (
              <div className="absolute right-0 mt-2 w-80 glass-card border border-white/10 rounded-2xl shadow-2xl p-4 overflow-y-auto max-h-96 z-50 animate-fade-in text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                  <h3 className="text-sm font-bold text-white">Notifications</h3>
                  <button
                    onClick={() => setShowNotifPanel(false)}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-zinc-500 text-xs text-center py-6">No new notifications</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          n.type === 'success' ? 'bg-green-500/5 border-green-500/20 text-green-200' :
                          n.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-200' :
                          n.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-200' :
                          'bg-zinc-800/40 border-zinc-700/30 text-zinc-300'
                        }`}
                      >
                        <p className="font-bold">{n.title}</p>
                        <p className="text-zinc-400">{n.message}</p>
                        <span className="text-[10px] text-zinc-500 block text-right mt-1">{n.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Grid: Sidebar + Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 glass-card border-r border-white/5 p-6 flex flex-col justify-between">
          <nav className="space-y-2.5">
            <button
              onClick={() => { setActiveTab('dashboard'); setShowNotifPanel(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-md font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-yellow-500 text-zinc-950 font-bold shadow-lg shadow-yellow-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab('tasks'); setShowNotifPanel(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-md font-semibold transition-all cursor-pointer ${
                activeTab === 'tasks' ? 'bg-yellow-500 text-zinc-950 font-bold shadow-lg shadow-yellow-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-5 h-5" />
              <span>Tasks</span>
            </button>

            <button
              onClick={() => { setActiveTab('referrals'); setShowNotifPanel(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-md font-semibold transition-all cursor-pointer ${
                activeTab === 'referrals' ? 'bg-yellow-500 text-zinc-950 font-bold shadow-lg shadow-yellow-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Referral System</span>
            </button>

            <button
              onClick={() => { setActiveTab('withdraw'); setShowNotifPanel(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-md font-semibold transition-all cursor-pointer ${
                activeTab === 'withdraw' ? 'bg-yellow-500 text-zinc-950 font-bold shadow-lg shadow-yellow-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ArrowDownLeft className="w-5 h-5" />
              <span>Withdraw Funds</span>
            </button>

            <button
              onClick={() => { setActiveTab('deposit'); setShowNotifPanel(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-md font-semibold transition-all cursor-pointer ${
                activeTab === 'deposit' ? 'bg-yellow-500 text-zinc-950 font-bold shadow-lg shadow-yellow-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>Deposit Cash</span>
            </button>

            <button
              onClick={() => { setActiveTab('profile'); setShowNotifPanel(false); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-md font-semibold transition-all cursor-pointer ${
                activeTab === 'profile' ? 'bg-yellow-500 text-zinc-950 font-bold shadow-lg shadow-yellow-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-5 h-5" />
              <span>My Profile</span>
            </button>
          </nav>

          <div className="mt-8 p-4 bg-zinc-900/60 rounded-2xl border border-white/5 space-y-2 text-left hidden lg:block">
            <span className="text-[10px] text-zinc-500 block">Referral Code</span>
            <div className="flex items-center justify-between bg-black/30 px-3 py-2 rounded-xl border border-white/5">
              <span className="text-yellow-400 font-extrabold tracking-wider font-mono">{stats?.user.referralCode || user.referralCode}</span>
              <button
                onClick={() => handleCopy(stats?.user.referralCode || user.referralCode, "Referral Code")}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Dynamic Main Workspace Content */}
        <main className="lg:col-span-9 p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-80px)] space-y-8">
          
          {loadingStats && !stats ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-400 text-sm">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD VIEW */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6 animate-fade-in text-left">
                  
                  {/* Welcome banner */}
                  <div className="p-6 md:p-8 bg-gradient-to-r from-zinc-900 via-[#1a1a1f] to-zinc-900 border border-white/5 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden glow-white">
                    <div className="space-y-2 z-10">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                        Welcome back, <span className="text-yellow-400">{stats.user.name}!</span>
                      </h2>
                      <p className="text-zinc-400 text-sm md:text-md">
                        Your account is fully active. Start completing tasks and refer your friends to earn money!
                      </p>
                    </div>
 
                    {/* Daily Claim Box inside Dashboard banner */}
                    <div className="z-10 bg-zinc-950/80 p-4 border border-white/10 rounded-2xl w-full md:w-auto text-center space-y-2.5 min-w-56">
                      <div className="flex items-center justify-center gap-1.5">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <span className="text-white font-bold text-xs">Daily Attendance Bonus (Rs. 200)</span>
                      </div>
 
                      {/* Check if user has 7 Active Referrals */}
                      {stats.activeReferralsCount >= stats.requiredActiveReferralsForClaim ? (
                        claimTimer > 0 ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 block">Next claim available in:</span>
                            <span className="text-lg font-mono font-extrabold text-yellow-500 tracking-widest">{formatCountdown(claimTimer)}</span>
                          </div>
                        ) : (
                          <button
                            onClick={handleDailyClaim}
                            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-zinc-950 text-xs font-extrabold py-2 px-4 rounded-xl cursor-pointer shadow-md transition-all active:scale-98"
                          >
                            Claim Bonus
                          </button>
                        )
                      ) : (
                        <div className="space-y-1 text-center">
                          <span className="text-[10px] text-red-400 block font-semibold">Bonus is Locked 🔒</span>
                          <span className="text-[10px] text-zinc-400 block">Requires 7 active referrals to unlock.</span>
                          <span className="text-[11px] text-yellow-400 font-bold block mt-1">Active referrals: {stats.activeReferralsCount} / 7</span>
                        </div>
                      )}
                    </div>
                  </div>
 
                  {/* Core Metrics Cards Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl glass-card border-white/10 glow-white flex flex-col justify-between h-36">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-semibold">Wallet Balance</span>
                        <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
                          <Wallet className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-extrabold text-white">Rs. {stats.user.walletBalance.toLocaleString()}</span>
                        <p className="text-[10px] text-zinc-500 mt-1">Available for instant withdrawal</p>
                      </div>
                    </div>
 
                    <div className="p-5 rounded-2xl glass-card border-white/10 glow-white flex flex-col justify-between h-36">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-semibold">Today's Earnings</span>
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                          <DollarSign className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-extrabold text-white">Rs. {stats.user.todayEarnings.toLocaleString()}</span>
                        <p className="text-[10px] text-zinc-500 mt-1">From tasks, referrals & bonus</p>
                      </div>
                    </div>
 
                    <div className="p-5 rounded-2xl glass-card border-white/10 glow-white flex flex-col justify-between h-36">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-semibold">Total Referrals</span>
                        <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-extrabold text-white">{stats.totalReferralsCount}</span>
                        <p className="text-[10px] text-zinc-500 mt-1">Active members: <span className="text-emerald-400 font-bold">{stats.activeReferralsCount}</span></p>
                      </div>
                    </div>
 
                    <div className="p-5 rounded-2xl glass-card border-white/10 glow-white flex flex-col justify-between h-36">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-xs font-semibold">Approved Tasks</span>
                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <span className="text-2xl font-extrabold text-white">{stats.completedTasksCount}</span>
                        <p className="text-[10px] text-zinc-500 mt-1">Verified social media tasks</p>
                      </div>
                    </div>
                  </div>
 
                  {/* Warning Box for Withdraw Lock condition */}
                  {!stats.canWithdraw && (
                    <div className="p-5 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-3.5 glow-red">
                      <ShieldAlert className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 text-left">
                        <h4 className="text-sm font-bold text-red-300">Withdrawal Restricted</h4>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                          You cannot withdraw funds until you have at least <span className="text-yellow-400 font-bold">1 active direct referral</span> who has registered with your code and completed their activation deposit of Rs. 500. Please share your referral code below with friends to unlock instant withdrawals.
                        </p>
                      </div>
                    </div>
                  )}
 
                  {/* Dashboard Layout: Left Activities vs Right Statistics */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                    
                    {/* Left Column: Recent Activities */}
                    <div className="lg:col-span-8 space-y-4">
                      <h3 className="text-lg font-bold text-white border-l-4 border-yellow-500 pl-2">
                        Recent Activity
                      </h3>
 
                      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                        {stats.activities.length === 0 ? (
                          <div className="p-8 text-center text-zinc-500 text-xs">No recent activity recorded.</div>
                        ) : (
                          stats.activities.map((act) => (
                            <div key={act.id} className="p-4 flex items-center justify-between text-xs md:text-sm hover:bg-white/20 transition-all text-left">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl flex items-center justify-center ${
                                  act.entity === 'payment' ? 'bg-amber-500/10 text-amber-400' :
                                  act.entity === 'withdrawal' ? 'bg-red-500/10 text-red-400' :
                                  act.entity === 'claim' ? 'bg-yellow-500/10 text-yellow-400' :
                                  'bg-green-500/10 text-green-400'
                                }`}>
                                  {act.entity === 'payment' ? <ArrowUpRight className="w-4 h-4" /> :
                                   act.entity === 'withdrawal' ? <ArrowDownLeft className="w-4 h-4" /> :
                                   act.entity === 'claim' ? <Award className="w-4 h-4" /> :
                                   <CheckCircle2 className="w-4 h-4" />}
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-white text-sm">{act.type}</p>
                                  <span className="text-[10px] text-zinc-500 block">{act.date}</span>
                                </div>
                              </div>
 
                              <div className="text-right space-y-1">
                                <span className={`font-extrabold text-sm ${act.entity === 'withdrawal' ? 'text-red-400' : 'text-green-400'}`}>
                                  {act.entity === 'withdrawal' ? '-' : '+'} Rs. {act.amount}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full block text-center ${
                                  act.status === 'approved' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                                  act.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                  'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                }`}>
                                  {act.status === 'approved' ? 'Approved' : act.status === 'rejected' ? 'Rejected' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
 
                    {/* Right Column: Statistics / QR details */}
                    <div className="lg:col-span-4 space-y-4">
                      <h3 className="text-lg font-bold text-white border-l-4 border-yellow-500 pl-2">
                        Referral Link Info
                      </h3>
 
                      <div className="glass-card border border-white/5 p-5 rounded-2xl space-y-4 text-center">
                        <Users className="w-8 h-8 text-yellow-500 mx-auto" />
                        <h4 className="text-sm font-bold text-white">Invite Your Friends</h4>
                        <p className="text-[11px] text-zinc-400">Earn an instant 10% commission on the activation fee of any friends who register with your link.</p>
                        
                        <div className="bg-black/30 p-2 rounded-xl text-center border border-white/5 text-[11px] font-mono break-all text-yellow-400">
                          {referralLink}
                        </div>
 
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(referralLink, "Referral Link")}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white text-xs py-2.5 px-3 rounded-xl border border-white/10 transition-all font-semibold cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy Link
                          </button>
                          <button
                            onClick={() => handleShare("Pak Earning Portal", "Join Pak Earning Portal and earn money daily by completing simple social media tasks!", referralLink)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs py-2.5 px-3 rounded-xl transition-all font-bold cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Share Link
                          </button>
                        </div>
                      </div>
                    </div>
 
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS VIEW */}
              {activeTab === 'tasks' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Social Media Earning Tasks</h2>
                      <p className="text-zinc-400 text-xs md:text-sm mt-1">Complete the tasks below, submit your proof/username, and earn instant rewards.</p>
                    </div>
                  </div>

                  {/* Tasks List Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tasks.map((task) => (
                      <div key={task.id} className="glass-card border border-white/10 rounded-2xl p-5 hover:border-yellow-500/20 transition-all flex flex-col justify-between h-56 glow-white">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] bg-white/5 border border-white/10 text-zinc-400 py-1 px-2 rounded-lg font-mono">
                              {task.category}
                            </span>
                            <div className="p-2 bg-white/5 rounded-xl">
                              {getCategoryIcon(task.image)}
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-white leading-relaxed line-clamp-2">{task.title}</h4>
                        </div>

                        <div className="border-t border-white/5 pt-3.5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Reward</span>
                            <span className="text-md font-extrabold text-emerald-400">Rs. {task.reward}</span>
                          </div>

                          {task.completionStatus === 'approved' ? (
                            <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Completed
                            </span>
                          ) : task.completionStatus === 'pending' ? (
                            <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1">
                              <Clock className="w-4 h-4" /> Pending Approval
                            </span>
                          ) : task.completionStatus === 'rejected' ? (
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                            >
                              Rejected (Retry)
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                if (task.url) {
                                  window.open(task.url, '_blank');
                                }
                              }}
                              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                              Start Task
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submit Task Verification Form Popup Modal */}
                  {selectedTask && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 text-left">
                      <div className="max-w-md w-full glass-card p-6 rounded-3xl border border-white/10 glow-yellow space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h3 className="text-md font-bold text-white">Task Verification Proof</h3>
                          <button
                            onClick={() => { setSelectedTask(null); setTaskVerification(''); setTaskScreenshot(''); }}
                            className="text-zinc-400 hover:text-white transition-colors"
                          >
                            <XCircle className="w-6 h-6" />
                          </button>
                        </div>

                        <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                          <p className="font-bold text-white text-sm">{selectedTask.title}</p>
                          <p className="text-emerald-400 font-bold mt-1 text-xs">Task Reward: Rs. {selectedTask.reward}</p>
                          {selectedTask.url && (
                            <a
                              href={selectedTask.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-yellow-400 font-bold hover:underline block mt-1"
                            >
                              Click here to open link 🔗
                            </a>
                          )}
                        </div>

                        <form onSubmit={handleTaskSubmit} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-zinc-400 text-xs block">Verification details (Username / Channel name / Link) *</label>
                            <input
                              type="text"
                              required
                              placeholder="Enter your social media handle or name"
                              value={taskVerification}
                              onChange={(e) => setTaskVerification(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-yellow-500/50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-zinc-400 text-xs block">Task Completion Screenshot *</label>
                            <div className="relative border border-dashed border-white/10 rounded-xl p-4 bg-zinc-950/40 text-center cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleTaskScreenshotChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              {taskScreenshot ? (
                                <div className="space-y-2">
                                  <img src={taskScreenshot} alt="Verification" className="max-h-24 mx-auto rounded border border-white/5" />
                                  <span className="text-[10px] text-green-400">Screenshot selected</span>
                                </div>
                              ) : (
                                <div className="space-y-1 text-zinc-400 flex flex-col items-center">
                                  <UploadCloud className="w-8 h-8 text-zinc-500" />
                                  <span className="text-xs font-semibold">Upload screenshot</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={submittingTask}
                            className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 py-3 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {submittingTask ? (
                              <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>Submit Verification Proof</span>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Task Submissions History */}
                  <div className="space-y-3 pt-4">
                    <h3 className="text-lg font-bold text-white border-l-4 border-yellow-500 pl-2">Task Submission History</h3>
                    <div className="glass-card border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                      {taskHistory.length === 0 ? (
                        <p className="p-6 text-center text-zinc-500 text-xs">No tasks submitted yet.</p>
                      ) : (
                        taskHistory.map((h) => (
                          <div key={h.id} className="p-4 flex items-center justify-between text-xs md:text-sm">
                            <div className="space-y-1">
                              <p className="font-bold text-white">{h.taskTitle}</p>
                              <p className="text-zinc-500 text-[10px] font-mono">TID: {h.id} | Date: {h.date}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="text-emerald-400 font-extrabold block">Rs. {h.taskReward}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] inline-block ${
                                h.status === 'approved' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                                h.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                              }`}>
                                {h.status === 'approved' ? 'Approved' : h.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: REFERRAL VIEW */}
              {activeTab === 'referrals' && stats && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-bold text-white">Referral Program</h2>
                    <p className="text-zinc-400 text-xs md:text-sm mt-1">Invite your friends and earn an instant 10% commission on their activation fee when they join.</p>
                  </div>

                  {/* Referral Link & Codes Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 glow-white">
                      <h3 className="text-md font-bold text-white">Your Unique Referral Code</h3>
                      <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                        <span className="text-yellow-400 font-extrabold tracking-widest text-xl font-mono">{stats.user.referralCode}</span>
                        <button
                          onClick={() => handleCopy(stats.user.referralCode, "Referral Code")}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-colors cursor-pointer"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        Have your friends enter this code in the registration form. Once they complete their account activation, your commission will be credited automatically.
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 glow-white">
                      <h3 className="text-md font-bold text-white">Your Referral Link</h3>
                      <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                        <span className="text-yellow-400 text-xs font-mono truncate select-all">{referralLink}</span>
                        <button
                          onClick={() => handleCopy(referralLink, "Referral Link")}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-colors cursor-pointer"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleShare("Pak Earning Portal", "Join Pak Earning Portal today and earn money from simple tasks!", referralLink)}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Link with Friends
                      </button>
                    </div>
                  </div>

                  {/* Referrals Stats cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl text-center">
                      <span className="text-zinc-500 text-xs block">Total Referrals</span>
                      <span className="text-2xl font-bold text-white">{stats.totalReferralsCount}</span>
                    </div>
                    <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl text-center">
                      <span className="text-zinc-500 text-xs block">Active Referrals (Paid)</span>
                      <span className="text-2xl font-bold text-green-400">{stats.activeReferralsCount}</span>
                    </div>
                    <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-xl text-center">
                      <span className="text-zinc-500 text-xs block">Daily Bonus Unlock Target</span>
                      <span className={`text-sm font-bold block ${stats.activeReferralsCount >= 7 ? 'text-green-400' : 'text-yellow-500'}`}>
                        {stats.activeReferralsCount >= 7 ? 'Daily Bonus Unlocked ✅' : `${7 - stats.activeReferralsCount} more active referral(s) required 🔒`}
                      </span>
                    </div>
                  </div>

                  {/* Referral List history */}
                  <div className="space-y-3 font-sans">
                    <h3 className="text-lg font-bold text-white border-l-4 border-yellow-500 pl-2">Referrals History</h3>
                    <div className="glass-card border border-white/5 rounded-2xl overflow-hidden">
                      {stats.totalReferralsCount === 0 ? (
                        <p className="p-6 text-center text-zinc-500 text-xs">No one has joined using your link yet.</p>
                      ) : (
                        <div className="p-4 text-xs text-zinc-400 leading-relaxed text-center">
                          Referral accounts are successfully linked. You can monitor activation stats and track your downline details in the Admin Panel or request a details inquiry.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WITHDRAW VIEW */}
              {activeTab === 'withdraw' && stats && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-bold text-white">Withdraw Funds</h2>
                    <p className="text-zinc-400 text-xs md:text-sm mt-1">Withdraw your earned profits instantly via EasyPaisa or JazzCash.</p>
                  </div>

                  {/* Check Restriction warning */}
                  {!stats.canWithdraw ? (
                    <div className="p-6 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-4 glow-red">
                      <ShieldAlert className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-red-300">Withdrawal is Locked 🔒</h3>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          To request a withdrawal, you must satisfy the requirement of having at least <span className="text-yellow-400 font-bold">1 active direct referral</span> who has registered with your code and completed their activation deposit of Rs. 500.
                        </p>
                        <p className="text-xs text-zinc-400">
                          As soon as a member joins using your referral link and completes activation, the withdrawal feature will unlock automatically.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 bg-green-950/40 border border-green-500/30 rounded-2xl flex items-start gap-3.5 glow-green">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-green-300">Eligible for Withdrawal!</h4>
                        <p className="text-xs text-zinc-300">You have active direct referrals and meet the balance withdrawal unlock conditions.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Withdraw Form Column */}
                    <div className="lg:col-span-7">
                      <form onSubmit={handleWithdrawSubmit} className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 glow-white">
                        <div className="space-y-1">
                          <label className="text-zinc-300 text-xs block">Withdrawal Method *</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setWithdrawMethod('easypaisa')}
                              className={`py-3 px-4 rounded-xl border font-bold transition-all ${
                                withdrawMethod === 'easypaisa' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-white/5 bg-zinc-950/60 text-zinc-400'
                              }`}
                            >
                              EasyPaisa
                            </button>
                            <button
                              type="button"
                              onClick={() => setWithdrawMethod('jazzcash')}
                              className={`py-3 px-4 rounded-xl border font-bold transition-all ${
                                withdrawMethod === 'jazzcash' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'border-white/5 bg-zinc-950/60 text-zinc-400'
                              }`}
                            >
                              JazzCash
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-300 text-xs block">Account Title / Holder Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter the exact account holder name"
                            value={withdrawTitle}
                            onChange={(e) => setWithdrawTitle(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-300 text-xs block">Mobile Account Number *</label>
                          <input
                            type="text"
                            required
                            placeholder="Example: 03001234567"
                            value={withdrawPhone}
                            onChange={(e) => setWithdrawPhone(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 text-[10px]">Available Balance: Rs. {stats.user.walletBalance}</span>
                            <label className="text-zinc-300 text-xs">Amount to Withdraw (PKR) *</label>
                          </div>
                          <input
                            type="number"
                            required
                            min={settings.minWithdrawal}
                            placeholder={`Minimum Rs. ${settings.minWithdrawal}`}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none font-bold"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={!stats.canWithdraw || submittingWithdraw}
                          className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {submittingWithdraw ? (
                            <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>Submit Withdrawal Request</span>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Withdrawal Guidelines and Info */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-3 text-left">
                        <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">Withdrawal Guidelines</h4>
                        <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4 font-sans">
                          <li>Minimum withdrawal limit is <span className="text-yellow-400 font-bold">Rs. {settings.minWithdrawal}</span>.</li>
                          <li>Once submitted, funds are processed and sent to your mobile account within 12 to 24 hours.</li>
                          <li>The company is not responsible for losses incurred due to incorrect account details.</li>
                          <li>Account title and holder name must be exactly correct.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* My withdrawals list */}
                  <div className="space-y-3 pt-4">
                    <h3 className="text-lg font-bold text-white border-l-4 border-yellow-500 pl-2">Withdrawal History</h3>
                    <div className="glass-card border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                      {myWithdrawals.length === 0 ? (
                        <p className="p-6 text-center text-zinc-500 text-xs">No withdrawal history found.</p>
                      ) : (
                        myWithdrawals.map((w) => (
                          <div key={w.id} className="p-4 flex items-center justify-between text-xs md:text-sm">
                            <div className="space-y-1">
                              <p className="font-bold text-white">Withdrawn via: {w.method}</p>
                              <p className="text-zinc-500 text-[10px] font-mono">Number: {w.phoneNumber} | Name: {w.accountTitle} | Date: {w.date}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="text-red-400 font-extrabold block">- Rs. {w.amount}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] inline-block ${
                                w.status === 'approved' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                                w.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                              }`}>
                                {w.status === 'approved' ? 'Approved' : w.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DEPOSIT VIEW */}
              {activeTab === 'deposit' && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-bold text-white">Deposit Cash</h2>
                    <p className="text-zinc-400 text-xs md:text-sm mt-1">Submit deposit proof to activate packages, request task boosts, or handle account activation.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Deposit Account Column */}
                    <div className="lg:col-span-5 space-y-4">
                      <h3 className="text-md font-bold text-white">Select Deposit Method</h3>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDepositMethod('easypaisa')}
                          className={`flex-1 py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            depositMethod === 'easypaisa' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-white/5 bg-zinc-900/60 text-zinc-400'
                          }`}
                        >
                          EasyPaisa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositMethod('jazzcash')}
                          className={`flex-1 py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            depositMethod === 'jazzcash' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'border-white/5 bg-zinc-900/60 text-zinc-400'
                          }`}
                        >
                          JazzCash
                        </button>
                        <button
                          type="button"
                          onClick={() => setDepositMethod('bank')}
                          className={`flex-1 py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            depositMethod === 'bank' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'border-white/5 bg-zinc-900/60 text-zinc-400'
                          }`}
                        >
                          Bank Account
                        </button>
                      </div>

                      {/* Display account details */}
                      <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-4 glow-white text-sm">
                        <p className="text-zinc-400 text-xs">{depositDetails.desc}</p>
                        {depositMethod === 'bank' && (
                          <div>
                            <span className="text-zinc-400 text-xs block">Bank Name</span>
                            <span className="text-white font-bold">{settings.bankName}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-zinc-400 text-xs block">Account Title</span>
                          <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5">
                            <span className="text-white font-bold">{depositDetails.title}</span>
                            <button onClick={() => handleCopy(depositDetails.title, "Account Title")} className="text-zinc-400 hover:text-white">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-xs block">Account Number / IBAN</span>
                          <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5 font-mono select-all">
                            <span className="text-yellow-400 font-bold text-md tracking-wider">{depositDetails.account}</span>
                            <button onClick={() => handleCopy(depositDetails.account, "Account Number")} className="text-zinc-400 hover:text-white">
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deposit Form Column */}
                    <div className="lg:col-span-7">
                      <form onSubmit={handleDepositSubmit} className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 glow-white">
                        <h3 className="text-md font-bold text-white">Submit Deposit Proof</h3>

                        <div className="space-y-1">
                          <label className="text-zinc-300 text-xs block">Amount (PKR) *</label>
                          <input
                            type="number"
                            required
                            min="500"
                            placeholder="Minimum Rs. 500"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-bold focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-300 text-xs block">Transaction ID (TID) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter the transaction ID exactly"
                            value={depositTxId}
                            onChange={(e) => setDepositTxId(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-mono tracking-widest focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-zinc-300 text-xs block">Sender's Mobile Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="Mobile number used to send"
                              value={depositSender}
                              onChange={(e) => setDepositSender(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-mono focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-zinc-300 text-xs block">Receiver's Mobile Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="Our number you sent funds to"
                              value={depositReceiver}
                              onChange={(e) => setDepositReceiver(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-mono focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-zinc-300 text-xs block">Payment Receipt Screenshot *</label>
                          <div className="relative border border-dashed border-white/10 rounded-xl p-4 bg-zinc-950/40 text-center cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              required
                              onChange={handleDepositScreenshotChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {depositScreenshot ? (
                              <div className="space-y-2">
                                <img src={depositScreenshot} alt="Deposit proof" className="max-h-24 mx-auto rounded border" />
                                <span className="text-[10px] text-green-400">Receipt screenshot attached</span>
                              </div>
                            ) : (
                              <div className="space-y-1 text-zinc-400 flex flex-col items-center">
                                <UploadCloud className="w-8 h-8 text-zinc-500" />
                                <span className="text-xs font-semibold">Attach payment receipt</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={submittingDeposit}
                          className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {submittingDeposit ? (
                            <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>Submit Deposit Details</span>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* My deposits list */}
                  <div className="space-y-3 pt-4">
                    <h3 className="text-lg font-bold text-white border-l-4 border-yellow-500 pl-2">Deposit History</h3>
                    <div className="glass-card border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                      {myDeposits.length === 0 ? (
                        <p className="p-6 text-center text-zinc-500 text-xs">No recent deposits found.</p>
                      ) : (
                        myDeposits.map((d) => (
                          <div key={d.id} className="p-4 flex items-center justify-between text-xs md:text-sm">
                            <div className="space-y-1">
                              <p className="font-bold text-white">Deposit Transaction: {d.transactionId}</p>
                              <p className="text-zinc-500 text-[10px] font-mono">Sender: {d.senderNumber} | Receiver: {d.receiverNumber} | Date: {d.date}</p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="text-green-400 font-extrabold block">Rs. {d.amount}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] inline-block ${
                                d.status === 'approved' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                                d.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                              }`}>
                                {d.status === 'approved' ? 'Approved' : d.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: PROFILE VIEW */}
              {activeTab === 'profile' && stats && (
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-bold text-white">My Profile</h2>
                    <p className="text-zinc-400 text-xs md:text-sm mt-1">Manage your account details and view wallet performance statistics.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Profile detail card */}
                    <div className="lg:col-span-8 glass-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 glow-white">
                      <div className="flex flex-col md:flex-row items-center gap-6 border-b border-white/5 pb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-3xl font-bold text-zinc-950 shadow-md">
                          {stats.user.name.substring(0, 2)}
                        </div>
                        <div className="space-y-1 text-center md:text-left">
                          <h3 className="text-2xl font-extrabold text-white">{stats.user.name}</h3>
                          <p className="text-zinc-400 text-sm font-mono">{stats.user.email}</p>
                          <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full inline-block mt-2">
                            Active Member
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-1">
                          <span className="text-zinc-500 text-xs block">Mobile Phone Number</span>
                          <span className="text-white font-bold font-mono text-lg">{stats.user.phone}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-zinc-500 text-xs block">Joined Date</span>
                          <span className="text-white font-bold font-mono text-lg">{stats.user.joinedDate}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-zinc-500 text-xs block">Unique Referral Code</span>
                          <span className="text-yellow-400 font-extrabold tracking-wider font-mono text-lg">{stats.user.referralCode}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-zinc-500 text-xs block">Referred By</span>
                          <span className="text-white font-bold font-mono text-lg">{stats.user.referredByCode || 'None'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Wallet card summary */}
                    <div className="lg:col-span-4 glass-card border border-white/5 rounded-3xl p-6 space-y-4 text-center flex flex-col justify-between">
                      <div className="space-y-4">
                        <Wallet className="w-12 h-12 text-yellow-500 mx-auto" />
                        <div>
                          <span className="text-zinc-400 text-xs">Wallet Balance</span>
                          <h3 className="text-3xl font-extrabold text-white mt-1">Rs. {stats.user.walletBalance.toLocaleString()}</h3>
                        </div>
                        <div className="border-t border-white/5 pt-4 grid grid-cols-2 gap-2 text-left">
                          <div>
                            <span className="text-zinc-500 text-[10px] block">Pending Withdrawals</span>
                            <span className="text-sm font-bold text-yellow-400 font-mono">Rs. {stats.user.pendingWithdrawal}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] block">Today's Earnings</span>
                            <span className="text-sm font-bold text-green-400 font-mono">Rs. {stats.user.todayEarnings}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('withdraw')}
                        className="w-full mt-6 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
                      >
                        Go to Withdraw Funds
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}

        </main>
      </div>

    </div>
  );
}
