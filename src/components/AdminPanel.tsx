import React, { useState, useEffect } from 'react';
import {
  Shield,
  CreditCard,
  ArrowDownLeft,
  Award,
  Users,
  Settings as SettingsIcon,
  Search,
  Check,
  X,
  PlusCircle,
  Trash2,
  Edit2,
  DollarSign,
  UserCheck,
  Eye,
  RefreshCw,
  LogOut,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { Settings, User, Payment, Withdrawal, Task, TaskHistory } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function AdminPanel({ onLogout, showToast }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'payments' | 'withdrawals' | 'tasks' | 'users' | 'settings' | 'manage-tasks'>('payments');
  
  // Dashboard stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Entities state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sysSettings, setSysSettings] = useState<Settings | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [withFilter, setWithFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [taskSubFilter, setTaskSubFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Modal / Action state
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserBalance, setNewUserBalance] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  // New task form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'YouTube Subscribe',
    reward: '',
    url: '',
    image: 'Youtube'
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    referralRewardPercent: '10',
    dailyClaimReward: '200',
    minWithdrawal: '500',
    easyPaisaAccount: '',
    easyPaisaName: '',
    jazzCashAccount: '',
    jazzCashName: '',
    bankAccount: '',
    bankName: '',
    bankTitle: ''
  });

  const loadAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch (e) {
      console.error(e);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.withdrawals) setWithdrawals(data.withdrawals);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSubmissions = async () => {
    try {
      const res = await fetch('/api/admin/tasks/submissions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.submissions) setSubmissions(data.submissions);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.settings) {
        setSysSettings(data.settings);
        setSettingsForm({
          referralRewardPercent: String(data.settings.referralRewardPercent),
          dailyClaimReward: String(data.settings.dailyClaimReward),
          minWithdrawal: String(data.settings.minWithdrawal),
          easyPaisaAccount: data.settings.easyPaisaAccount,
          easyPaisaName: data.settings.easyPaisaName,
          jazzCashAccount: data.settings.jazzCashAccount,
          jazzCashName: data.settings.jazzCashName,
          bankAccount: data.settings.bankAccount,
          bankName: data.settings.bankName,
          bankTitle: data.settings.bankTitle
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/admin/tasks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = () => {
    loadAdminStats();
    loadPayments();
    loadWithdrawals();
    loadSubmissions();
    loadUsers();
    loadSettings();
    loadTasks();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Handle Payment approval status Change
  const handlePaymentStatus = async (id: string, status: 'approved' | 'rejected') => {
    triggerConfirmation(
      status === 'approved' ? 'Approve Payment' : 'Reject Payment',
      `Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} this payment activation?`,
      async () => {
        setSubmittingAction(true);
        try {
          const res = await fetch(`/api/admin/payments/${id}/status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
          });
          if (res.ok) {
            showToast("Payment status updated successfully", "success");
            refreshAll();
          } else {
            const d = await res.json();
            showToast(d.error || "Error updating payment status", "error");
          }
        } catch (e) {
          showToast("Connection failed", "error");
        } finally {
          setSubmittingAction(false);
        }
      }
    );
  };

  // Handle Withdrawal approval status Change
  const handleWithdrawalStatus = async (id: string, status: 'approved' | 'rejected') => {
    triggerConfirmation(
      status === 'approved' ? 'Approve Withdrawal' : 'Reject Withdrawal',
      `Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} this withdrawal request?`,
      async () => {
        setSubmittingAction(true);
        try {
          const res = await fetch(`/api/admin/withdrawals/${id}/status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
          });
          if (res.ok) {
            showToast("Withdrawal request updated successfully", "success");
            refreshAll();
          } else {
            const d = await res.json();
            showToast(d.error || "Failed to update withdrawal status", "error");
          }
        } catch (e) {
          showToast("Server connection failed", "error");
        } finally {
          setSubmittingAction(false);
        }
      }
    );
  };

  // Handle Task submission approval status Change
  const handleTaskSubStatus = async (id: string, status: 'approved' | 'rejected') => {
    triggerConfirmation(
      status === 'approved' ? 'Approve Task Submission' : 'Reject Task Submission',
      `Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} this task submission?`,
      async () => {
        setSubmittingAction(true);
        try {
          const res = await fetch(`/api/admin/tasks/submissions/${id}/status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
          });
          if (res.ok) {
            showToast("Task submission status updated successfully", "success");
            refreshAll();
          } else {
            const d = await res.json();
            showToast(d.error || "Failed to update task submission status", "error");
          }
        } catch (e) {
          showToast("Server error", "error");
        } finally {
          setSubmittingAction(false);
        }
      }
    );
  };

  // Change user Balance
  const handleUserBalanceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newUserBalance) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/change-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount: newUserBalance })
      });
      if (res.ok) {
        showToast("User balance updated successfully", "success");
        setSelectedUser(null);
        setNewUserBalance('');
        refreshAll();
      }
    } catch (e) {
      showToast("An error occurred", "error");
    }
  };

  // Change user Status manually
  const handleUserStatusChange = async (userId: string, newStatus: string) => {
    triggerConfirmation(
      'Change User Status',
      `Are you sure you want to change user status to "${newStatus}"?`,
      async () => {
        try {
          const res = await fetch(`/api/admin/users/${userId}/change-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) {
            showToast("User status updated successfully", "success");
            refreshAll();
          }
        } catch (e) {
          showToast("Server issue occurred", "error");
        }
      }
    );
  };

  // Settings Save
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        showToast("Portal settings updated successfully", "success");
        loadSettings();
      }
    } catch (e) {
      showToast("Failed to save settings", "error");
    }
  };

  // Tasks Create/Edit
  const handleTaskFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTask ? '/api/admin/tasks/edit' : '/api/admin/tasks';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingTask ? { id: editingTask.id, ...taskForm } : taskForm)
      });
      if (res.ok) {
        showToast(editingTask ? "Task updated successfully" : "New task added successfully", "success");
        setTaskForm({ title: '', category: 'YouTube Subscribe', reward: '', url: '', image: 'Youtube' });
        setEditingTask(null);
        setShowTaskModal(false);
        refreshAll();
      }
    } catch (e) {
      showToast("Failed to save task details", "error");
    }
  };

  const handleTaskDelete = async (id: string) => {
    triggerConfirmation(
      'Delete Task',
      'Are you sure you want to delete this task from the portal?',
      async () => {
        try {
          const res = await fetch(`/api/admin/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) {
            showToast("Task deleted successfully", "success");
            refreshAll();
          }
        } catch (e) {
          showToast("Error deleting task", "error");
        }
      }
    );
  };

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      category: task.category,
      reward: String(task.reward),
      url: task.url,
      image: task.image
    });
    setShowTaskModal(true);
  };

  // Filter computations
  const filteredPayments = payments.filter((p) => {
    const matchesSearch = searchQuery === '' || 
      p.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.senderNumber.includes(searchQuery);

    const matchesStatus = paymentFilter === 'all' || p.status === paymentFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesSearch = searchQuery === '' || 
      w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.phoneNumber.includes(searchQuery);

    const matchesStatus = withFilter === 'all' || w.status === withFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = searchQuery === '' || 
      s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.taskTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = taskSubFilter === 'all' || s.status === taskSubFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter((u) => {
    return searchQuery === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#0e0e10] flex flex-col font-sans text-left" style={{ direction: 'ltr' }}>
      
      {/* Admin header */}
      <header className="sticky top-0 z-30 glass-card border-b border-white/5 py-4 px-6 flex items-center justify-between glow-red">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-white font-bold leading-none">Pak Earning - Admin Panel</h1>
            <span className="text-red-400 text-xs font-semibold block mt-1.5 font-mono">Super Admin Account</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-zinc-300 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={onLogout}
            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/15 rounded-xl transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Admin Navigation Sidebar */}
        <aside className="lg:col-span-3 glass-card border-r border-white/5 p-6 space-y-3">
          <h2 className="text-zinc-500 text-xs font-extrabold px-3 mb-4 tracking-wider uppercase">Management</h2>
          <nav className="space-y-2">
            <button
              onClick={() => { setActiveTab('payments'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'payments' ? 'bg-red-500 text-white font-bold shadow-lg shadow-red-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment Approvals</span>
              {stats?.pendingPayments > 0 && (
                <span className="ml-auto bg-white/10 text-white text-[10px] py-0.5 px-2 rounded-full font-mono">
                  {stats.pendingPayments}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('withdrawals'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'withdrawals' ? 'bg-red-500 text-white font-bold shadow-lg shadow-red-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Withdrawal Requests</span>
              {stats?.pendingWithdrawals > 0 && (
                <span className="ml-auto bg-white/10 text-white text-[10px] py-0.5 px-2 rounded-full font-mono">
                  {stats.pendingWithdrawals}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('tasks'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'tasks' ? 'bg-red-500 text-white font-bold shadow-lg shadow-red-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Task Submissions</span>
              {stats?.pendingTasks > 0 && (
                <span className="ml-auto bg-white/10 text-white text-[10px] py-0.5 px-2 rounded-full font-mono">
                  {stats.pendingTasks}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'users' ? 'bg-red-500 text-white font-bold shadow-lg shadow-red-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Users Directory</span>
            </button>

            <button
              onClick={() => { setActiveTab('manage-tasks'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'manage-tasks' ? 'bg-red-500 text-white font-bold shadow-lg shadow-red-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Manage Tasks</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-red-500 text-white font-bold shadow-lg shadow-red-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>System Settings</span>
            </button>
          </nav>
        </aside>

        {/* Content Workspace */}
        <main className="lg:col-span-9 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          
          {loadingStats && !stats ? (
            <div className="flex items-center justify-center h-96">
              <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Dashboard quick metric summary */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center">
                  <span className="text-zinc-500 text-xs block font-bold">Total Registered Users</span>
                  <span className="text-2xl font-bold text-white mt-1 block">{stats.totalUsers}</span>
                </div>
                <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center">
                  <span className="text-zinc-500 text-xs block font-bold">Active Approved Members</span>
                  <span className="text-2xl font-bold text-green-400 mt-1 block">{stats.activeUsers}</span>
                </div>
                <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center">
                  <span className="text-zinc-500 text-xs block font-bold">Pending Payments</span>
                  <span className="text-2xl font-bold text-amber-400 mt-1 block">{stats.pendingPayments}</span>
                </div>
                <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center">
                  <span className="text-zinc-500 text-xs block font-bold">Pending Withdrawals</span>
                  <span className="text-2xl font-bold text-sky-400 mt-1 block">{stats.pendingWithdrawals}</span>
                </div>
                <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-2xl text-center">
                  <span className="text-zinc-500 text-xs block font-bold">Pending Task Audits</span>
                  <span className="text-2xl font-bold text-purple-400 mt-1 block">{stats.pendingTasks}</span>
                </div>
              </div>

              {/* TAB 1: PAYMENTS APPROVAL LIST */}
              {activeTab === 'payments' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Payment Approvals</h2>
                      <p className="text-zinc-400 text-xs mt-1">Audit and verify account activation fees and manual cash deposits.</p>
                    </div>

                    {/* Filter tab for payments */}
                    <div className="flex gap-1.5">
                      {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setPaymentFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            paymentFilter === st ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {st === 'pending' ? 'Pending' : st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected' : 'All Records'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by user name, email, transaction ID, or phone number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 p-3 pl-10 rounded-xl text-white text-xs focus:outline-none"
                    />
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  </div>

                  {/* Payments Table */}
                  <div className="glass-card border border-white/5 rounded-2xl overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/50 text-zinc-400 border-b border-white/5">
                          <th className="p-4">User Details</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Amount / Plan</th>
                          <th className="p-4">Transaction & Accounts</th>
                          <th className="p-4">Screenshot</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-zinc-500">No payment records found.</td>
                          </tr>
                        ) : (
                          filteredPayments.map((p) => (
                            <tr key={p.id} className="hover:bg-white/5 transition-all">
                              <td className="p-4">
                                <p className="font-bold text-white text-sm">{p.userName}</p>
                                <p className="text-zinc-500 font-mono text-[10px] mt-0.5">{p.userEmail}</p>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-lg font-bold font-sans ${
                                  p.type === 'activation' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'
                                }`}>
                                  {p.type === 'activation' ? 'Activation' : 'Deposit'}
                                </span>
                              </td>
                              <td className="p-4">
                                <p className="font-extrabold text-white text-sm">Rs. {p.amount}</p>
                                {p.planId && <p className="text-zinc-500 text-[10px] mt-0.5 font-sans">{p.planId.toUpperCase()}</p>}
                              </td>
                              <td className="p-4 font-mono">
                                <p className="text-yellow-400 font-bold font-mono tracking-wider">TID: {p.transactionId}</p>
                                <p className="text-zinc-400 text-[10px] mt-1">Sender: {p.senderNumber} | Recv: {p.receiverNumber}</p>
                              </td>
                              <td className="p-4">
                                {p.screenshot ? (
                                  <button
                                    onClick={() => setActiveScreenshot(p.screenshot)}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-zinc-300 flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>
                                ) : (
                                  <span className="text-zinc-500 text-[10px]">No image</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  p.status === 'approved' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                                  p.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                  'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                }`}>
                                  {p.status === 'approved' ? 'Approved' : p.status === 'rejected' ? 'Rejected' : 'Pending'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {p.status === 'pending' && (
                                  <div className="flex justify-start gap-1.5">
                                    <button
                                      disabled={submittingAction}
                                      onClick={() => handlePaymentStatus(p.id, 'approved')}
                                      className="p-1.5 bg-green-500 hover:bg-green-400 text-zinc-950 font-bold rounded-lg transition-all cursor-pointer"
                                      title="Approve"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      disabled={submittingAction}
                                      onClick={() => handlePaymentStatus(p.id, 'rejected')}
                                      className="p-1.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg transition-all cursor-pointer"
                                      title="Reject"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: WITHDRAWAL REQUESTS */}
              {activeTab === 'withdrawals' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Withdrawal Requests</h2>
                      <p className="text-zinc-400 text-xs mt-1">Approve or reject funds payouts requested by active members.</p>
                    </div>

                    <div className="flex gap-1.5">
                      {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setWithFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            withFilter === st ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {st === 'pending' ? 'Pending' : st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected' : 'All Records'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table for withdrawals */}
                  <div className="glass-card border border-white/5 rounded-2xl overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/50 text-zinc-400 border-b border-white/5">
                          <th className="p-4">User Details</th>
                          <th className="p-4">Method</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Mobile Account & Title</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredWithdrawals.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-zinc-500">No payout records found.</td>
                          </tr>
                        ) : (
                          filteredWithdrawals.map((w) => (
                            <tr key={w.id} className="hover:bg-white/5 transition-all">
                              <td className="p-4">
                                <p className="font-bold text-white text-sm">{w.userName}</p>
                                <p className="text-zinc-500 font-mono text-[10px]">{w.userEmail}</p>
                              </td>
                              <td className="p-4">
                                <span className="bg-white/5 text-zinc-300 px-2 py-0.5 rounded font-bold">{w.method}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-red-400 font-extrabold text-sm">Rs. {w.amount}</span>
                              </td>
                              <td className="p-4">
                                <p className="text-white font-bold">{w.accountTitle}</p>
                                <p className="text-zinc-400 font-mono text-[10px] mt-0.5">{w.phoneNumber}</p>
                              </td>
                              <td className="p-4 text-zinc-500 font-mono">{w.date}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  w.status === 'approved' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                                  w.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                  'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                }`}>
                                  {w.status === 'approved' ? 'Approved' : w.status === 'rejected' ? 'Rejected' : 'Pending'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {w.status === 'pending' && (
                                  <div className="flex justify-start gap-1.5">
                                    <button
                                      disabled={submittingAction}
                                      onClick={() => handleWithdrawalStatus(w.id, 'approved')}
                                      className="p-1.5 bg-green-500 hover:bg-green-400 text-zinc-950 font-bold rounded-lg transition-all cursor-pointer"
                                      title="Approve Request"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      disabled={submittingAction}
                                      onClick={() => handleWithdrawalStatus(w.id, 'rejected')}
                                      className="p-1.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg transition-all cursor-pointer"
                                      title="Reject Request"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: TASK SUBMISSIONS VERIFICATION */}
              {activeTab === 'tasks' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Task Verification</h2>
                      <p className="text-zinc-400 text-xs mt-1">Review and approve social media tasks completed by members.</p>
                    </div>

                    <div className="flex gap-1.5">
                      {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setTaskSubFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            taskSubFilter === st ? 'bg-red-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {st === 'pending' ? 'Pending' : st === 'approved' ? 'Approved' : st === 'rejected' ? 'Rejected' : 'All Records'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submissions table */}
                  <div className="glass-card border border-white/5 rounded-2xl overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/50 text-zinc-400 border-b border-white/5">
                          <th className="p-4">User Details</th>
                          <th className="p-4">Task Title</th>
                          <th className="p-4">Reward</th>
                          <th className="p-4">Verification Input</th>
                          <th className="p-4">Proof Image</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-zinc-500">No pending task submissions found.</td>
                          </tr>
                        ) : (
                          filteredSubmissions.map((s) => (
                            <tr key={s.id} className="hover:bg-white/5 transition-all">
                              <td className="p-4">
                                <p className="font-bold text-white text-sm">{s.userName}</p>
                                <p className="text-zinc-500 font-mono text-[10px]">{s.userEmail}</p>
                              </td>
                              <td className="p-4">
                                <p className="font-bold text-white max-w-xs truncate">{s.taskTitle}</p>
                              </td>
                              <td className="p-4">
                                <span className="text-emerald-400 font-extrabold font-sans">Rs. {s.taskReward}</span>
                              </td>
                              <td className="p-4 text-yellow-400 font-bold">{s.verification}</td>
                              <td className="p-4">
                                {s.screenshot ? (
                                  <button
                                    onClick={() => setActiveScreenshot(s.screenshot)}
                                    className="p-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Screenshot</span>
                                  </button>
                                ) : (
                                  <span className="text-zinc-500 text-[10px]">No Proof</span>
                                )}
                              </td>
                              <td className="p-4 font-mono text-zinc-500">{s.date}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  s.status === 'approved' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                                  s.status === 'rejected' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                  'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                }`}>
                                  {s.status === 'approved' ? 'Approved' : s.status === 'rejected' ? 'Rejected' : 'Pending'}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {s.status === 'pending' && (
                                  <div className="flex justify-start gap-1.5">
                                    <button
                                      disabled={submittingAction}
                                      onClick={() => handleTaskSubStatus(s.id, 'approved')}
                                      className="p-1.5 bg-green-500 hover:bg-green-400 text-zinc-950 font-bold rounded-lg transition-all cursor-pointer"
                                      title="Approve Completion"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      disabled={submittingAction}
                                      onClick={() => handleTaskSubStatus(s.id, 'rejected')}
                                      className="p-1.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg transition-all cursor-pointer"
                                      title="Reject Completion"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: USERS MANAGEMENT */}
              {activeTab === 'users' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-xl font-bold text-white">Users Directory</h2>
                    <p className="text-zinc-400 text-xs mt-1">Manage user portfolios, modify account balances, toggle system flags, and monitor statistics.</p>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search user by name, email, phone number, or referral code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 p-3 pl-10 rounded-xl text-white text-xs focus:outline-none"
                    />
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  </div>

                  {/* Users table */}
                  <div className="glass-card border border-white/5 rounded-2xl overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/50 text-zinc-400 border-b border-white/5">
                          <th className="p-4">User Details</th>
                          <th className="p-4">Registration Date</th>
                          <th className="p-4">Referral Code / Sponsor</th>
                          <th className="p-4">Wallet Balance</th>
                          <th className="p-4">Referrals (Total/Active)</th>
                          <th className="p-4">Tasks Completed</th>
                          <th className="p-4">Account Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-zinc-500">No users found.</td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-all">
                              <td className="p-4">
                                <p className="font-bold text-white text-sm">{u.name}</p>
                                <p className="text-zinc-500 font-mono text-[10px] mt-0.5">{u.email}</p>
                                <p className="text-zinc-400 font-mono text-[10px] mt-0.5">{u.phone}</p>
                              </td>
                              <td className="p-4 font-mono text-zinc-400">{u.joinedDate}</td>
                              <td className="p-4 font-mono">
                                <p className="text-yellow-400 font-bold">Code: {u.referralCode}</p>
                                {u.referredByCode && <p className="text-zinc-500 text-[10px] mt-0.5">By: {u.referredByCode}</p>}
                              </td>
                              <td className="p-4">
                                <p className="font-extrabold text-white text-sm">Rs. {u.walletBalance.toLocaleString()}</p>
                                <p className="text-zinc-500 text-[10px] mt-0.5">Pending Withdrawals: Rs. {u.pendingWithdrawal}</p>
                              </td>
                              <td className="p-4 font-mono">
                                <p className="text-white font-bold">{u.totalReferralsCount || 0}</p>
                                <p className="text-green-400 text-[10px] font-bold mt-0.5">Active: {u.activeReferralsCount || 0}</p>
                              </td>
                              <td className="p-4 font-mono text-white font-bold">{u.completedTasksCount || 0}</td>
                              <td className="p-4">
                                <select
                                  value={u.status}
                                  onChange={(e) => handleUserStatusChange(u.id, e.target.value)}
                                  className={`p-1.5 rounded-lg text-[10px] font-bold focus:outline-none bg-zinc-950 text-white border ${
                                    u.status === 'active' ? 'border-green-500/30 text-green-400' :
                                    u.status === 'pending' ? 'border-yellow-500/30 text-yellow-400' :
                                    u.status === 'rejected' ? 'border-red-500/30 text-red-400' :
                                    'border-zinc-700 text-zinc-400'
                                  }`}
                                >
                                  <option value="new">New User</option>
                                  <option value="pending">Locked / Pending verification</option>
                                  <option value="active">Active Member</option>
                                  <option value="rejected">Rejected / Blocked</option>
                                </select>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => { setSelectedUser(u); setNewUserBalance(String(u.walletBalance)); }}
                                  className="p-1.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-lg transition-all cursor-pointer"
                                  title="Adjust User Wallet Balance"
                                >
                                  <Sliders className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Modify Balance Dialog Modal */}
                  {selectedUser && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 text-left">
                      <form onSubmit={handleUserBalanceChange} className="max-w-sm w-full glass-card p-6 rounded-3xl border border-white/10 glow-yellow space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h3 className="text-md font-bold text-white">Adjust User Wallet Balance</h3>
                          <button
                            type="button"
                            onClick={() => { setSelectedUser(null); setNewUserBalance(''); }}
                            className="text-zinc-400 hover:text-white"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-zinc-400 text-xs font-semibold">User details: <span className="text-white font-bold">{selectedUser.name}</span></p>
                        
                        <div className="space-y-1">
                          <label className="text-zinc-300 text-xs">Enter New Wallet Balance (PKR) *</label>
                          <input
                            type="number"
                            required
                            placeholder="Rs. 1000"
                            value={newUserBalance}
                            onChange={(e) => setNewUserBalance(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-bold focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          Update Wallet Balance
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: MANAGE EARNING TASKS */}
              {activeTab === 'manage-tasks' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-white">Manage Earning Tasks</h2>
                      <p className="text-zinc-400 text-xs mt-1">Create, edit, or disable social media tasks available for active members.</p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingTask(null);
                        setTaskForm({ title: '', category: 'YouTube Subscribe', reward: '', url: '', image: 'Youtube' });
                        setShowTaskModal(true);
                      }}
                      className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-500/10"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create New Task</span>
                    </button>
                  </div>

                  {/* Tasks List Grid for Admin */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.map((t) => (
                      <div key={t.id} className="glass-card border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-48 hover:border-white/10 transition-all text-left">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] bg-white/5 border border-white/10 text-zinc-400 py-1 px-2 rounded-lg font-mono">
                              {t.category}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              t.status === 'active' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                              {t.status === 'active' ? 'Active' : 'Closed'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white leading-relaxed line-clamp-2">{t.title}</h4>
                        </div>

                        <div className="border-t border-white/5 pt-3.5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Reward</span>
                            <span className="text-md font-extrabold text-emerald-400">Rs. {t.reward}</span>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEditTaskClick(t)}
                              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="Edit Task"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleTaskDelete(t.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 rounded-lg text-red-400 hover:text-red-300 transition-all cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Task Form Modal */}
                  {showTaskModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 text-left">
                      <form onSubmit={handleTaskFormSubmit} className="max-w-md w-full glass-card p-6 rounded-3xl border border-white/10 glow-yellow space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <h3 className="text-md font-bold text-white">
                            {editingTask ? 'Edit Task' : 'Create New Task'}
                          </h3>
                          <button
                            type="button"
                            onClick={() => { setShowTaskModal(false); setEditingTask(null); }}
                            className="text-zinc-400 hover:text-white"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="space-y-1">
                            <label className="text-zinc-300 block">Task Title / Description *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Subscribe to channel and submit proof screenshot"
                              value={taskForm.title}
                              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                              className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-bold focus:outline-none focus:border-red-500/50"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-zinc-300 block">Category *</label>
                              <select
                                value={taskForm.category}
                                onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none"
                              >
                                <option value="YouTube Subscribe">YouTube Subscribe</option>
                                <option value="YouTube Watch">YouTube Watch</option>
                                <option value="WhatsApp Channel Join">WhatsApp Channel Join</option>
                                <option value="Telegram Join">Telegram Join</option>
                                <option value="Facebook Follow">Facebook Follow</option>
                                <option value="Instagram Follow">Instagram Follow</option>
                                <option value="Website Visit">Website Visit</option>
                                <option value="Daily Check In">Daily Check In</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-zinc-300 block">Icon Type *</label>
                              <select
                                value={taskForm.image}
                                onChange={(e) => setTaskForm({ ...taskForm, image: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none font-sans"
                              >
                                <option value="Youtube">Youtube Logo</option>
                                <option value="MessageCircle">WhatsApp Message</option>
                                <option value="Send">Telegram Send</option>
                                <option value="Facebook">Facebook Logo</option>
                                <option value="Instagram">Instagram Logo</option>
                                <option value="Globe">Globe Link</option>
                                <option value="Calendar">Calendar Entry</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-zinc-300 block">Reward Amount (Rs.) *</label>
                              <input
                                type="number"
                                required
                                placeholder="Rs. 50"
                                value={taskForm.reward}
                                onChange={(e) => setTaskForm({ ...taskForm, reward: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-bold focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-zinc-300 block">Task Link URL</label>
                              <input
                                type="url"
                                placeholder="https://..."
                                value={taskForm.url}
                                onChange={(e) => setTaskForm({ ...taskForm, url: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-mono focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full mt-4 bg-red-500 hover:bg-red-400 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          {editingTask ? 'Update Task' : 'Create Task'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: WEBSITE SETTINGS */}
              {activeTab === 'settings' && sysSettings && (
                <form onSubmit={handleSettingsSubmit} className="space-y-6 animate-fade-in text-left">
                  <div className="border-b border-white/5 pb-4">
                    <h2 className="text-xl font-bold text-white">System Configuration</h2>
                    <p className="text-zinc-400 text-xs mt-1">Configure wallet parameters, reward payout values, referral percentages, and daily sign-in claims.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Panel: Rewards setting */}
                    <div className="lg:col-span-6 space-y-4">
                      <h3 className="text-md font-bold text-white border-l-4 border-yellow-500 pl-2">Rewards & Limits Settings</h3>
                      
                      <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-4 glow-white text-xs">
                        <div className="space-y-1">
                          <label className="text-zinc-300 block">Referral Reward Commission (%) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            max="100"
                            value={settingsForm.referralRewardPercent}
                            onChange={(e) => setSettingsForm({ ...settingsForm, referralRewardPercent: e.target.value })}
                            className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-bold focus:outline-none"
                          />
                          <p className="text-[10px] text-zinc-500 mt-1">Percentage of account activation fee granted instantly to sponsor.</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-300 block">Daily Attendance Check-In Claim (Rs.) *</label>
                          <input
                            type="number"
                            required
                            value={settingsForm.dailyClaimReward}
                            onChange={(e) => setSettingsForm({ ...settingsForm, dailyClaimReward: e.target.value })}
                            className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-bold focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-300 block">Minimum Payout Withdrawal Amount (Rs.) *</label>
                          <input
                            type="number"
                            required
                            value={settingsForm.minWithdrawal}
                            onChange={(e) => setSettingsForm({ ...settingsForm, minWithdrawal: e.target.value })}
                            className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Account Settings */}
                    <div className="lg:col-span-6 space-y-4">
                      <h3 className="text-md font-bold text-white border-l-4 border-yellow-500 pl-2">Receiving Deposit Wallets</h3>
                      
                      <div className="p-6 rounded-2xl glass-card border border-white/5 space-y-4 glow-white text-xs">
                        
                        {/* EasyPaisa Accounts */}
                        <div className="border-b border-white/5 pb-3.5 space-y-3">
                          <h4 className="text-emerald-400 font-bold text-sm">EasyPaisa Account</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-zinc-400 block">Mobile Number</label>
                              <input
                                type="text"
                                required
                                value={settingsForm.easyPaisaAccount}
                                onChange={(e) => setSettingsForm({ ...settingsForm, easyPaisaAccount: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-mono focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-zinc-400 block">Account Holder Name</label>
                              <input
                                type="text"
                                required
                                value={settingsForm.easyPaisaName}
                                onChange={(e) => setSettingsForm({ ...settingsForm, easyPaisaName: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* JazzCash Accounts */}
                        <div className="border-b border-white/5 pb-3.5 space-y-3">
                          <h4 className="text-amber-500 font-bold text-sm">JazzCash Account</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-zinc-400 block">Mobile Number</label>
                              <input
                                type="text"
                                required
                                value={settingsForm.jazzCashAccount}
                                onChange={(e) => setSettingsForm({ ...settingsForm, jazzCashAccount: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-mono focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-zinc-400 block">Account Holder Name</label>
                              <input
                                type="text"
                                required
                                value={settingsForm.jazzCashName}
                                onChange={(e) => setSettingsForm({ ...settingsForm, jazzCashName: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Bank Account */}
                        <div className="space-y-3">
                          <h4 className="text-sky-400 font-bold text-sm">Direct Bank Transfer</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-zinc-400 block">Bank Name</label>
                              <input
                                type="text"
                                required
                                value={settingsForm.bankName}
                                onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1 col-span-2">
                              <label className="text-zinc-400 block">Account Number / IBAN</label>
                              <input
                                type="text"
                                required
                                value={settingsForm.bankAccount}
                                onChange={(e) => setSettingsForm({ ...settingsForm, bankAccount: e.target.value })}
                                className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white font-mono focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-zinc-400 block">Account Holder Title</label>
                            <input
                              type="text"
                              required
                              value={settingsForm.bankTitle}
                              onChange={(e) => setSettingsForm({ ...settingsForm, bankTitle: e.target.value })}
                              className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:outline-none"
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="bg-red-500 hover:bg-red-400 text-white font-bold py-3 px-10 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/10"
                    >
                      Save Configuration Settings
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

        </main>
      </div>

      {/* Large Screenshot Preview Modal */}
      {activeScreenshot && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 text-left">
          <div className="max-w-xl w-full glass-card p-6 rounded-3xl border border-white/10 glow-yellow flex flex-col items-center gap-4">
            <div className="w-full flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-md font-bold text-white">Attached Receipt Proof</h3>
              <button
                onClick={() => setActiveScreenshot(null)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto w-full p-2 border border-white/5 rounded-xl bg-black">
              <img src={activeScreenshot} alt="Screenshot proof" className="w-full h-auto mx-auto object-contain rounded animate-fade-in" />
            </div>

            <button
              onClick={() => setActiveScreenshot(null)}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-xl transition-all text-xs cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 text-left animate-fade-in">
          <div className="max-w-sm w-full glass-card p-6 rounded-3xl border border-white/10 glow-yellow space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-yellow-500 animate-pulse" />
                <span>{confirmModal.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-zinc-300 text-xs leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
