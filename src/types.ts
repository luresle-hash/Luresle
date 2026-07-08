export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'pending' | 'active' | 'rejected';
  referralCode: string;
  referredByCode: string | null;
  walletBalance: number;
  todayEarnings: number;
  pendingWithdrawal: number;
  completedTasksCount: number;
  joinedDate: string;
  role: 'user' | 'admin';
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  label: string;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  planId: string | null;
  type: 'activation' | 'deposit';
  amount: number;
  transactionId: string;
  senderNumber: string;
  receiverNumber: string;
  screenshot: string; // Base64
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface Task {
  id: string;
  category: string;
  title: string;
  reward: number;
  url: string;
  image: string;
  status: 'active' | 'inactive';
  completionStatus?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  completionDate?: string | null;
}

export interface TaskHistory {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  taskId: string;
  taskTitle: string;
  taskReward: number;
  verification: string;
  screenshot: string; // Base64
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  method: string;
  accountTitle: string;
  phoneNumber: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface DailyClaim {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  dateStr: string;
  date: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  date: string;
  read: boolean;
}

export interface Settings {
  referralRewardPercent: number;
  dailyClaimReward: number;
  minWithdrawal: number;
  easyPaisaAccount: string;
  easyPaisaName: string;
  jazzCashAccount: string;
  jazzCashName: string;
  bankAccount: string;
  bankName: string;
  bankTitle: string;
}

export interface DashboardStats {
  user: User;
  activeReferralsCount: number;
  totalReferralsCount: number;
  completedTasksCount: number;
  activities: {
    id: string;
    type: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
    entity: 'payment' | 'withdrawal' | 'claim' | 'task';
  }[];
  canWithdraw: boolean;
  claimCooldown: number;
  requiredActiveReferralsForClaim: number;
}
