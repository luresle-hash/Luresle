import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "data", "db.json");

// Default DB blueprint template
const defaultDB = {
  users: [
    {
      id: "admin-id",
      name: "Admin",
      email: "admin@gmail.com",
      phone: "03000000000",
      passwordHash: crypto.createHash("sha256").update("admin").digest("hex"),
      status: "active",
      referralCode: "ADMIN123",
      referredByCode: null,
      walletBalance: 0,
      todayEarnings: 0,
      pendingWithdrawal: 0,
      completedTasksCount: 0,
      joinedDate: "2026-07-07",
      role: "admin"
    }
  ],
  payments: [],
  plans: [
    { id: "starter", name: "Starter", price: 500, label: "Rs. 500" },
    { id: "silver", name: "Silver", price: 1000, label: "Rs. 1000" },
    { id: "gold", name: "Gold", price: 2000, label: "Rs. 2000" },
    { id: "premium", name: "Premium", price: 5000, label: "Rs. 5000" }
  ],
  tasks: [
    { id: "task-yt-sub", category: "YouTube Subscribe", title: "Subscribe to our YouTube Channel and upload a screenshot", reward: 50, url: "https://youtube.com", image: "Youtube", status: "active" },
    { id: "task-yt-watch", category: "YouTube Watch", title: "Watch the specified YouTube video for 2 minutes and upload a screenshot", reward: 80, url: "https://youtube.com", image: "PlayCircle", status: "active" },
    { id: "task-wa-join", category: "WhatsApp Channel Join", title: "Join our official WhatsApp channel and submit your username", reward: 40, url: "https://whatsapp.com", image: "MessageCircle", status: "active" },
    { id: "task-tg-join", category: "Telegram Join", title: "Join our official Telegram group", reward: 60, url: "https://telegram.org", image: "Send", status: "active" },
    { id: "task-fb-follow", category: "Facebook Follow", title: "Follow our Facebook page and upload a screenshot", reward: 45, url: "https://facebook.com", image: "Facebook", status: "active" },
    { id: "task-ig-follow", category: "Instagram Follow", title: "Follow our Instagram profile and upload a screenshot", reward: 50, url: "https://instagram.com", image: "Instagram", status: "active" },
    { id: "task-web-visit", category: "Website Visit", title: "Visit our sponsor's website and stay there for 30 seconds", reward: 30, url: "https://google.com", image: "Globe", status: "active" }
  ],
  taskHistory: [],
  withdrawals: [],
  dailyClaims: [],
  notifications: [],
  settings: {
    referralRewardPercent: 10,
    dailyClaimReward: 200,
    minWithdrawal: 500,
    easyPaisaAccount: "0304-1234567",
    easyPaisaName: "Muhammad Saleem",
    jazzCashAccount: "0312-9876543",
    jazzCashName: "Abdur Rehman",
    bankAccount: "PK12 UNIL 0000 1234 5678 90",
    bankName: "Meezan Bank Limited",
    bankTitle: "Pak Earning Limited"
  }
};

// Ensure data folder and DB file exist
function initDB() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), "utf8");
  } else {
    // Merge existing DB with defaults if some keys are missing
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      let updated = false;
      for (const key of Object.keys(defaultDB)) {
        if (data[key] === undefined || data[key] === null) {
          data[key] = JSON.parse(JSON.stringify((defaultDB as any)[key]));
          updated = true;
        }
      }
      if (updated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
      }
    } catch (e) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), "utf8");
    }
  }
}

initDB();

// Read/write helpers with locks (safeguards file writes)
function readDB(): any {
  let data: any;
  try {
    data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    data = {};
  }

  let updated = false;
  for (const key of Object.keys(defaultDB)) {
    if (data[key] === undefined || data[key] === null) {
      data[key] = JSON.parse(JSON.stringify((defaultDB as any)[key]));
      updated = true;
    }
  }

  if (updated) {
    try {
      writeDB(data);
    } catch (writeErr) {
      console.error("Error writing updated DB in readDB:", writeErr);
    }
  }

  return data;
}

function writeDB(data: any) {
  const tempFile = DB_FILE + ".tmp";
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempFile, DB_FILE);
}

// Support large file uploads (Base64 screenshots)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Password hashing
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Generate unique referral code
function generateReferralCode(): string {
  return "PAK" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

// Generate session token
function generateSessionToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// Session store in-memory (persistent to runtime)
const SESSIONS: { [token: string]: string } = {}; // token -> userId

// Middleware for auth
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication is required" });
  }
  const token = authHeader.split(" ")[1];
  const userId = SESSIONS[token];
  if (!userId) {
    return res.status(401).json({ error: "Session expired, please sign in again" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Middleware for Admin only
function adminOnly(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Only admin can access this resource" });
  }
  next();
}

// ==========================================
// AUTH ENDPOINTS
// ==========================================

// Register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, referralCode } = req.body;
  const phone = req.body.phone || "";

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All required fields must be filled" });
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "This email is already registered" });
  }

  let referredByCode = null;
  if (referralCode) {
    const referrer = db.users.find((u: any) => u.referralCode === referralCode.trim().toUpperCase());
    if (referrer) {
      referredByCode = referrer.referralCode;
    } else {
      return res.status(400).json({ error: "Invalid referral code entered" });
    }
  }

  const newUser = {
    id: "user-" + Date.now(),
    name,
    phone,
    email,
    passwordHash: hashPassword(password),
    status: "new", // 'new', 'pending', 'active', 'rejected'
    referralCode: generateReferralCode(),
    referredByCode,
    walletBalance: 0,
    todayEarnings: 0,
    pendingWithdrawal: 0,
    completedTasksCount: 0,
    joinedDate: new Date().toISOString().split("T")[0],
    role: "user"
  };

  db.users.push(newUser);

  // Add system welcome notification
  db.notifications.push({
    id: "notif-" + Date.now(),
    userId: newUser.id,
    title: "Welcome!",
    message: "Welcome to Pak Earning Portal. To activate your account and start earning, please select a plan and complete your subscription payment.",
    type: "info",
    date: new Date().toISOString().split("T")[0],
    read: false
  });

  writeDB(db);

  const token = generateSessionToken();
  SESSIONS[token] = newUser.id;

  res.json({ token, user: newUser });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please enter your email and password" });
  }

  const db = readDB();
  const user = db.users.find((u: any) => u.email === email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const token = generateSessionToken();
  SESSIONS[token] = user.id;

  res.json({ token, user });
});

// Logout
app.post("/api/auth/logout", authenticate, (req, res) => {
  const token = (req as any).token;
  delete SESSIONS[token];
  res.json({ success: true });
});

// Get Me
app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({ user: (req as any).user });
});

// ==========================================
// USER ENDPOINTS
// ==========================================

// Get App configuration/plans
app.get("/api/config", (req, res) => {
  const db = readDB();
  res.json({
    plans: db.plans,
    settings: db.settings
  });
});

// Submit activation or deposit payment
app.post("/api/payments/submit", authenticate, (req, res) => {
  const user = (req as any).user;
  const { planId, type, amount, transactionId, senderNumber, receiverNumber, screenshot } = req.body;

  if (!transactionId || !senderNumber || !receiverNumber || !amount) {
    return res.status(400).json({ error: "Please fill in all required payment details" });
  }

  const db = readDB();

  // If this is an activation payment, check if user is already active
  if (type === "activation" && user.status === "active") {
    return res.status(400).json({ error: "Your account is already active" });
  }

  // Create payment record
  const newPayment = {
    id: "pay-" + Date.now(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    planId: planId || null,
    type, // 'activation' or 'deposit'
    amount: parseFloat(amount),
    transactionId,
    senderNumber,
    receiverNumber,
    screenshot, // Base64 image
    status: "pending",
    date: new Date().toISOString().split("T")[0]
  };

  db.payments.push(newPayment);

  // Update user status to 'pending' if it was new/rejected and this is activation
  if (type === "activation") {
    const dbUser = db.users.find((u: any) => u.id === user.id);
    if (dbUser) {
      dbUser.status = "pending";
    }
  }

  db.notifications.push({
    id: "notif-" + Date.now(),
    userId: user.id,
    title: "Payment Submitted",
    message: `Your request for ${type === "activation" ? "account activation" : "deposit balance"} has been submitted successfully. Admin will verify it shortly.`,
    type: "warning",
    date: new Date().toISOString().split("T")[0],
    read: false
  });

  writeDB(db);
  res.json({ success: true, payment: newPayment });
});

// Get my payments
app.get("/api/payments/my", authenticate, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  const myPayments = db.payments.filter((p: any) => p.userId === user.id);
  res.json({ payments: myPayments });
});

// Get tasks list with completion status
app.get("/api/tasks", authenticate, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  
  // Filter active tasks
  const activeTasks = db.tasks.filter((t: any) => t.status === "active");

  // Map tasks with completions
  const tasksWithStatus = activeTasks.map((task: any) => {
    const history = db.taskHistory.filter((h: any) => h.userId === user.id && h.taskId === task.id);
    const lastSubmission = history[history.length - 1];
    return {
      ...task,
      completionStatus: lastSubmission ? lastSubmission.status : "not_submitted",
      completionDate: lastSubmission ? lastSubmission.date : null
    };
  });

  res.json({ tasks: tasksWithStatus });
});

// Submit task verification
app.post("/api/tasks/submit", authenticate, (req, res) => {
  const user = (req as any).user;
  const { taskId, verification, screenshot } = req.body;

  if (!taskId || !verification) {
    return res.status(400).json({ error: "Please provide validation/proof details" });
  }

  const db = readDB();
  const task = db.tasks.find((t: any) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  // Check if already approved or pending today
  const today = new Date().toISOString().split("T")[0];
  const existingToday = db.taskHistory.find(
    (h: any) => h.userId === user.id && h.taskId === taskId && h.date === today && h.status !== "rejected"
  );

  if (existingToday) {
    return res.status(400).json({ error: "You have already submitted this task today" });
  }

  const newHistory = {
    id: "history-" + Date.now(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    taskId: task.id,
    taskTitle: task.title,
    taskReward: task.reward,
    verification,
    screenshot, // Base64 image
    status: "pending",
    date: today
  };

  db.taskHistory.push(newHistory);

  db.notifications.push({
    id: "notif-" + Date.now(),
    userId: user.id,
    title: "Task Submitted",
    message: `Your proof for the task "${task.title}" has been submitted for validation.`,
    type: "info",
    date: today,
    read: false
  });

  writeDB(db);
  res.json({ success: true, history: newHistory });
});

// Get task history
app.get("/api/tasks/history", authenticate, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  const history = db.taskHistory.filter((h: any) => h.userId === user.id);
  res.json({ history });
});

// Submit Withdrawal request
app.post("/api/withdrawals/request", authenticate, (req, res) => {
  const user = (req as any).user;
  const { method, accountTitle, phoneNumber, amount } = req.body;

  if (!method || !accountTitle || !phoneNumber || !amount) {
    return res.status(400).json({ error: "Please fill in all withdrawal details" });
  }

  const parsedAmount = parseFloat(amount);
  const db = readDB();

  // Validate min withdrawal
  if (parsedAmount < db.settings.minWithdrawal) {
    return res.status(400).json({ error: `Minimum withdrawal amount is Rs. ${db.settings.minWithdrawal}` });
  }

  // Validate user balance
  const dbUser = db.users.find((u: any) => u.id === user.id);
  if (!dbUser || dbUser.walletBalance < parsedAmount) {
    return res.status(400).json({ error: "Insufficient balance in your wallet" });
  }

  // Condition 1: At least ONE direct referral has completed a minimum deposit of Rs.500
  const directReferredUsers = db.users.filter((u: any) => u.referredByCode === dbUser.referralCode);
  const hasActiveReferredDeposit = directReferredUsers.some((u: any) => {
    // Check if this referred user is active (which requires activation plan of Rs.500+)
    // Or has any deposit payment approved of Rs.500+
    const isUserActive = u.status === "active";
    const approvedPayments = db.payments.filter(
      (p: any) => p.userId === u.id && p.status === "approved" && p.amount >= 500
    );
    return isUserActive || approvedPayments.length > 0;
  });

  if (!hasActiveReferredDeposit) {
    return res.status(400).json({
      error: "First withdrawal requires at least one active direct referral who has completed a deposit of Rs. 500."
    });
  }

  // Deduct from balance and add to pending withdrawal
  dbUser.walletBalance -= parsedAmount;
  dbUser.pendingWithdrawal += parsedAmount;

  const newWithdrawal = {
    id: "with-" + Date.now(),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone,
    method,
    accountTitle,
    phoneNumber,
    amount: parsedAmount,
    status: "pending",
    date: new Date().toISOString().split("T")[0]
  };

  db.withdrawals.push(newWithdrawal);

  db.notifications.push({
    id: "notif-" + Date.now(),
    userId: user.id,
    title: "Withdrawal Request Received",
    message: `Your withdrawal request of Rs. ${parsedAmount} has been registered. The funds will be transferred upon verification.`,
    type: "warning",
    date: new Date().toISOString().split("T")[0],
    read: false
  });

  writeDB(db);
  res.json({ success: true, withdrawal: newWithdrawal, walletBalance: dbUser.walletBalance, pendingWithdrawal: dbUser.pendingWithdrawal });
});

// Get my withdrawals
app.get("/api/withdrawals/my", authenticate, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  const myWiths = db.withdrawals.filter((w: any) => w.userId === user.id);
  res.json({ withdrawals: myWiths });
});

// Daily Claim Bonus
app.post("/api/daily-claims/claim", authenticate, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  const dbUser = db.users.find((u: any) => u.id === user.id);

  if (!dbUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Condition 2: When user has 7 Active Direct Referrals
  const directReferredUsers = db.users.filter((u: any) => u.referredByCode === dbUser.referralCode);
  const activeDirectReferralsCount = directReferredUsers.filter((u: any) => u.status === "active").length;

  if (activeDirectReferralsCount < 7) {
    return res.status(400).json({ error: "Daily claim bonus requires at least 7 active direct referrals." });
  }

  // Check 24-hour limit
  const todayStr = new Date().toISOString().split("T")[0];
  const lastClaim = db.dailyClaims
    .filter((c: any) => c.userId === user.id)
    .sort((a: any, b: any) => b.id.localeCompare(a.id))[0];

  if (lastClaim) {
    const lastClaimDate = new Date(lastClaim.dateStr);
    const now = new Date();
    const diffMs = now.getTime() - lastClaimDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      const remainingMs = (24 * 60 * 60 * 1000) - diffMs;
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return res.status(400).json({
        error: `You have already claimed your daily bonus. Please wait ${remainingHours} hours and ${remainingMins} minutes for the next claim.`
      });
    }
  }

  // Award claim reward
  const reward = db.settings.dailyClaimReward;
  dbUser.walletBalance += reward;
  dbUser.todayEarnings += reward;

  const claimRecord = {
    id: "claim-" + Date.now(),
    userId: user.id,
    userName: user.name,
    amount: reward,
    dateStr: new Date().toISOString(),
    date: todayStr
  };

  db.dailyClaims.push(claimRecord);

  db.notifications.push({
    id: "notif-" + Date.now(),
    userId: user.id,
    title: "Daily Bonus Claimed",
    message: `You have successfully claimed your daily attendance bonus of Rs. ${reward}.`,
    type: "success",
    date: todayStr,
    read: false
  });

  writeDB(db);
  res.json({ success: true, reward, walletBalance: dbUser.walletBalance, todayEarnings: dbUser.todayEarnings, claim: claimRecord });
});

// Get daily claim history
app.get("/api/daily-claims/my", authenticate, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  const claims = db.dailyClaims.filter((c: any) => c.userId === user.id);
  res.json({ claims });
});

// Get stats & dashboard details dynamically
app.get("/api/user/dashboard-stats", authenticate, (req, res) => {
  const user = (req as any).user;
  const db = readDB();

  const dbUser = db.users.find((u: any) => u.id === user.id);
  if (!dbUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const directReferredUsers = db.users.filter((u: any) => u.referredByCode === dbUser.referralCode);
  const activeReferralsCount = directReferredUsers.filter((u: any) => u.status === "active").length;
  const totalReferralsCount = directReferredUsers.length;

  const myApprovedTasks = db.taskHistory.filter((h: any) => h.userId === user.id && h.status === "approved");
  const completedTasksCount = myApprovedTasks.length;

  // Recent activities
  const recentPayments = db.payments
    .filter((p: any) => p.userId === user.id)
    .map((p: any) => ({
      id: p.id,
      type: p.type === "activation" ? "Account Activation" : "Deposit Payment",
      amount: p.amount,
      status: p.status,
      date: p.date,
      entity: "payment"
    }));

  const recentWiths = db.withdrawals
    .filter((w: any) => w.userId === user.id)
    .map((w: any) => ({
      id: w.id,
      type: "Withdrawal Request",
      amount: w.amount,
      status: w.status,
      date: w.date,
      entity: "withdrawal"
    }));

  const recentClaims = db.dailyClaims
    .filter((c: any) => c.userId === user.id)
    .map((c: any) => ({
      id: c.id,
      type: "Daily Claim Bonus",
      amount: c.amount,
      status: "approved",
      date: c.date,
      entity: "claim"
    }));

  const recentTasks = myApprovedTasks.map((t: any) => ({
    id: t.id,
    type: `Task: ${t.taskTitle}`,
    amount: t.taskReward,
    status: "approved",
    date: t.date,
    entity: "task"
  }));

  const activities = [...recentPayments, ...recentWiths, ...recentClaims, ...recentTasks]
    .sort((a: any, b: any) => b.id.localeCompare(a.id))
    .slice(0, 8);

  // Check if withdraw warning card is needed
  const hasActiveReferredDeposit = directReferredUsers.some((u: any) => {
    const isUserActive = u.status === "active";
    const approvedPayments = db.payments.filter(
      (p: any) => p.userId === u.id && p.status === "approved" && p.amount >= 500
    );
    return isUserActive || approvedPayments.length > 0;
  });

  // Calculate cooldown for claim
  let claimCooldown = 0; // seconds
  const lastClaim = db.dailyClaims
    .filter((c: any) => c.userId === user.id)
    .sort((a: any, b: any) => b.id.localeCompare(a.id))[0];

  if (lastClaim) {
    const lastClaimDate = new Date(lastClaim.dateStr);
    const now = new Date();
    const diffMs = now.getTime() - lastClaimDate.getTime();
    if (diffMs < 24 * 60 * 60 * 1000) {
      claimCooldown = Math.max(0, Math.floor((24 * 60 * 60 * 1000 - diffMs) / 1000));
    }
  }

  res.json({
    user: dbUser,
    activeReferralsCount,
    totalReferralsCount,
    completedTasksCount,
    activities,
    canWithdraw: hasActiveReferredDeposit,
    claimCooldown,
    requiredActiveReferralsForClaim: 7
  });
});

// Notifications
app.get("/api/notifications", authenticate, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  const myNotifs = db.notifications.filter((n: any) => n.userId === user.id).sort((a: any, b: any) => b.id.localeCompare(a.id));
  res.json({ notifications: myNotifs });
});

// Mark notifications read
app.post("/api/notifications/read", authenticate, (req, res) => {
  const user = (req as any).user;
  const db = readDB();
  db.notifications.forEach((n: any) => {
    if (n.userId === user.id) {
      n.read = true;
    }
  });
  writeDB(db);
  res.json({ success: true });
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// Get Admin Stats
app.get("/api/admin/stats", authenticate, adminOnly, (req, res) => {
  const db = readDB();

  const totalUsers = db.users.filter((u: any) => u.role !== "admin").length;
  const activeUsers = db.users.filter((u: any) => u.status === "active" && u.role !== "admin").length;
  const pendingPayments = db.payments.filter((p: any) => p.status === "pending").length;
  const pendingWithdrawals = db.withdrawals.filter((w: any) => w.status === "pending").length;
  const pendingTasks = db.taskHistory.filter((h: any) => h.status === "pending").length;

  res.json({
    totalUsers,
    activeUsers,
    pendingPayments,
    pendingWithdrawals,
    pendingTasks
  });
});

// Manage Settings
app.get("/api/admin/settings", authenticate, adminOnly, (req, res) => {
  const db = readDB();
  res.json({ settings: db.settings });
});

app.post("/api/admin/settings", authenticate, adminOnly, (req, res) => {
  const { referralRewardPercent, dailyClaimReward, minWithdrawal, easyPaisaAccount, easyPaisaName, jazzCashAccount, jazzCashName, bankAccount, bankName, bankTitle } = req.body;

  const db = readDB();
  db.settings = {
    referralRewardPercent: parseInt(referralRewardPercent) || 10,
    dailyClaimReward: parseInt(dailyClaimReward) || 200,
    minWithdrawal: parseInt(minWithdrawal) || 500,
    easyPaisaAccount,
    easyPaisaName,
    jazzCashAccount,
    jazzCashName,
    bankAccount,
    bankName,
    bankTitle
  };

  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// Manage Tasks
app.get("/api/admin/tasks", authenticate, adminOnly, (req, res) => {
  const db = readDB();
  res.json({ tasks: db.tasks });
});

app.post("/api/admin/tasks", authenticate, adminOnly, (req, res) => {
  const { title, category, reward, url, image } = req.body;
  if (!title || !category || !reward) {
    return res.status(400).json({ error: "Task information is incomplete" });
  }

  const db = readDB();
  const newTask = {
    id: "task-" + Date.now(),
    title,
    category,
    reward: parseInt(reward),
    url: url || "",
    image: image || "Youtube",
    status: "active"
  };

  db.tasks.push(newTask);
  writeDB(db);
  res.json({ success: true, task: newTask });
});

app.post("/api/admin/tasks/edit", authenticate, adminOnly, (req, res) => {
  const { id, title, category, reward, url, image, status } = req.body;
  if (!id || !title || !reward) {
    return res.status(400).json({ error: "Required task details are incomplete" });
  }

  const db = readDB();
  const taskIdx = db.tasks.findIndex((t: any) => t.id === id);
  if (taskIdx === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  db.tasks[taskIdx] = {
    ...db.tasks[taskIdx],
    title,
    category,
    reward: parseInt(reward),
    url: url || "",
    image: image || "Youtube",
    status: status || "active"
  };

  writeDB(db);
  res.json({ success: true, task: db.tasks[taskIdx] });
});

app.delete("/api/admin/tasks/:id", authenticate, adminOnly, (req, res) => {
  const db = readDB();
  db.tasks = db.tasks.filter((t: any) => t.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Manage Payments (Approvals)
app.get("/api/admin/payments", authenticate, adminOnly, (req, res) => {
  const db = readDB();
  res.json({ payments: db.payments.sort((a: any, b: any) => b.id.localeCompare(a.id)) });
});

app.post("/api/admin/payments/:id/status", authenticate, adminOnly, (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const db = readDB();
  const payment = db.payments.find((p: any) => p.id === req.params.id);
  if (!payment) {
    return res.status(404).json({ error: "Payment record not found" });
  }

  if (payment.status !== "pending") {
    return res.status(400).json({ error: "This payment status has already been updated" });
  }

  payment.status = status;

  const dbUser = db.users.find((u: any) => u.id === payment.userId);
  if (dbUser) {
    if (payment.type === "activation") {
      if (status === "approved") {
        dbUser.status = "active";

        db.notifications.push({
          id: "notif-" + Date.now(),
          userId: dbUser.id,
          title: "Account Activated!",
          message: "Congratulations! Your account has been successfully activated. You can now access all portal features and start earning daily rewards.",
          type: "success",
          date: new Date().toISOString().split("T")[0],
          read: false
        });

        // Award referral reward if user was referred by someone
        if (dbUser.referredByCode) {
          const referrer = db.users.find((u: any) => u.referralCode === dbUser.referredByCode);
          if (referrer) {
            const rewardPercent = db.settings.referralRewardPercent || 10;
            const rewardAmount = Math.floor(payment.amount * (rewardPercent / 100));
            referrer.walletBalance += rewardAmount;
            referrer.todayEarnings += rewardAmount;

            db.notifications.push({
              id: "notif-" + Date.now() + "-ref",
              userId: referrer.id,
              title: "Referral Commission Earned",
              message: `Your referral "${dbUser.name}" has activated their account. You have been rewarded a commission of Rs. ${rewardAmount}.`,
              type: "success",
              date: new Date().toISOString().split("T")[0],
              read: false
            });
          }
        }
      } else {
        dbUser.status = "rejected";
        db.notifications.push({
          id: "notif-" + Date.now(),
          userId: dbUser.id,
          title: "Payment Rejected",
          message: "Your account activation payment has been rejected. Please review your transaction details or contact support.",
          type: "error",
          date: new Date().toISOString().split("T")[0],
          read: false
        });
      }
    } else if (payment.type === "deposit") {
      if (status === "approved") {
        dbUser.walletBalance += payment.amount;
        db.notifications.push({
          id: "notif-" + Date.now(),
          userId: dbUser.id,
          title: "Deposit Approved",
          message: `Your deposit request of Rs. ${payment.amount} has been approved and credited to your wallet.`,
          type: "success",
          date: new Date().toISOString().split("T")[0],
          read: false
        });
      } else {
        db.notifications.push({
          id: "notif-" + Date.now(),
          userId: dbUser.id,
          title: "Deposit Rejected",
          message: `Your deposit request of Rs. ${payment.amount} has been rejected.`,
          type: "error",
          date: new Date().toISOString().split("T")[0],
          read: false
        });
      }
    }
  }

  writeDB(db);
  res.json({ success: true, payment });
});

// Manage Withdrawals
app.get("/api/admin/withdrawals", authenticate, adminOnly, (req, res) => {
  const db = readDB();
  res.json({ withdrawals: db.withdrawals.sort((a: any, b: any) => b.id.localeCompare(a.id)) });
});

app.post("/api/admin/withdrawals/:id/status", authenticate, adminOnly, (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const db = readDB();
  const withdrawal = db.withdrawals.find((w: any) => w.id === req.params.id);
  if (!withdrawal) {
    return res.status(404).json({ error: "Withdrawal request not found" });
  }

  if (withdrawal.status !== "pending") {
    return res.status(400).json({ error: "This request has already been processed" });
  }

  withdrawal.status = status;

  const dbUser = db.users.find((u: any) => u.id === withdrawal.userId);
  if (dbUser) {
    if (status === "approved") {
      dbUser.pendingWithdrawal -= withdrawal.amount;
      db.notifications.push({
        id: "notif-" + Date.now(),
        userId: dbUser.id,
        title: "Withdrawal Approved",
        message: `Your withdrawal request of Rs. ${withdrawal.amount} has been approved and the amount has been successfully dispatched to your account.`,
        type: "success",
        date: new Date().toISOString().split("T")[0],
        read: false
      });
    } else {
      // Return balance
      dbUser.pendingWithdrawal -= withdrawal.amount;
      dbUser.walletBalance += withdrawal.amount;
      db.notifications.push({
        id: "notif-" + Date.now(),
        userId: dbUser.id,
        title: "Withdrawal Rejected",
        message: `Your withdrawal request of Rs. ${withdrawal.amount} was rejected. The funds have been refunded to your wallet.`,
        type: "error",
        date: new Date().toISOString().split("T")[0],
        read: false
      });
    }
  }

  writeDB(db);
  res.json({ success: true, withdrawal });
});

// Manage Task History (Verify submissions)
app.get("/api/admin/tasks/submissions", authenticate, adminOnly, (req, res) => {
  const db = readDB();
  res.json({ submissions: db.taskHistory.sort((a: any, b: any) => b.id.localeCompare(a.id)) });
});

app.post("/api/admin/tasks/submissions/:id/status", authenticate, adminOnly, (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const db = readDB();
  const submission = db.taskHistory.find((h: any) => h.id === req.params.id);
  if (!submission) {
    return res.status(404).json({ error: "Task submission not found" });
  }

  if (submission.status !== "pending") {
    return res.status(400).json({ error: "This task submission has already been processed" });
  }

  submission.status = status;

  const dbUser = db.users.find((u: any) => u.id === submission.userId);
  if (dbUser) {
    if (status === "approved") {
      dbUser.walletBalance += submission.taskReward;
      dbUser.todayEarnings += submission.taskReward;
      dbUser.completedTasksCount += 1;

      db.notifications.push({
        id: "notif-" + Date.now(),
        userId: dbUser.id,
        title: "Task Approved",
        message: `Your proof for task "${submission.taskTitle}" has been verified. Rs. ${submission.taskReward} has been added to your wallet.`,
        type: "success",
        date: new Date().toISOString().split("T")[0],
        read: false
      });
    } else {
      db.notifications.push({
        id: "notif-" + Date.now(),
        userId: dbUser.id,
        title: "Task Rejected",
        message: `Your proof for task "${submission.taskTitle}" was rejected upon verification.`,
        type: "error",
        date: new Date().toISOString().split("T")[0],
        read: false
      });
    }
  }

  writeDB(db);
  res.json({ success: true, submission });
});

// View and Manage Users
app.get("/api/admin/users", authenticate, adminOnly, (req, res) => {
  const db = readDB();
  // Don't show admin in list
  const usersList = db.users.filter((u: any) => u.role !== "admin").map((u: any) => {
    // calculate actual stats
    const directReferredUsers = db.users.filter((x: any) => x.referredByCode === u.referralCode);
    const activeRefs = directReferredUsers.filter((x: any) => x.status === "active").length;
    const completedTasksCount = db.taskHistory.filter((h: any) => h.userId === u.id && h.status === "approved").length;

    return {
      ...u,
      activeReferralsCount: activeRefs,
      totalReferralsCount: directReferredUsers.length,
      completedTasksCount
    };
  });
  res.json({ users: usersList });
});

app.post("/api/admin/users/:id/change-balance", authenticate, adminOnly, (req, res) => {
  const { amount } = req.body;
  const db = readDB();
  const dbUser = db.users.find((u: any) => u.id === req.params.id);
  if (!dbUser) {
    return res.status(404).json({ error: "User not found" });
  }

  dbUser.walletBalance = parseFloat(amount) || 0;
  writeDB(db);
  res.json({ success: true, user: dbUser });
});

app.post("/api/admin/users/:id/change-status", authenticate, adminOnly, (req, res) => {
  const { status } = req.body;
  const db = readDB();
  const dbUser = db.users.find((u: any) => u.id === req.params.id);
  if (!dbUser) {
    return res.status(404).json({ error: "User not found" });
  }

  dbUser.status = status;
  writeDB(db);
  res.json({ success: true, user: dbUser });
});

// ==========================================
// VITE OR STATIC SERVING MIDDLEWARE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
