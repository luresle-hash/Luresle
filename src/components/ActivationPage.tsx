import React, { useState, useEffect } from 'react';
import { Copy, UploadCloud, CheckCircle2, Clock, ShieldAlert, ArrowLeftRight, CreditCard, RefreshCw } from 'lucide-react';
import { Plan, Settings, Payment, User } from '../types';

interface ActivationPageProps {
  user: User;
  plans: Plan[];
  settings: Settings;
  onPaymentSubmitted: () => void;
  onLogout: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function ActivationPage({
  user,
  plans,
  settings,
  onPaymentSubmitted,
  onLogout,
  showToast
}: ActivationPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [selectedMethod, setSelectedMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [receiverNumber, setReceiverNumber] = useState('');
  const [screenshot, setScreenshot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [myPayments, setMyPayments] = useState<Payment[]>([]);
  const [fetchingPayments, setFetchingPayments] = useState(false);

  // Fetch payments to see if there is any pending activation
  const fetchMyPayments = async () => {
    setFetchingPayments(true);
    try {
      const res = await fetch('/api/payments/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.payments) {
        setMyPayments(data.payments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingPayments(false);
    }
  };

  useEffect(() => {
    fetchMyPayments();
    // Poll every 10 seconds to check if status changes
    const interval = setInterval(fetchMyPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${title} copied successfully!`, 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Screenshot size must be less than 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
        showToast("Screenshot uploaded successfully", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId || !senderNumber || !receiverNumber || !screenshot) {
      showToast("Please provide all the form details and upload a screenshot", "error");
      return;
    }

    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    if (!selectedPlanData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: selectedPlan,
          type: 'activation',
          amount: selectedPlanData.price,
          transactionId,
          senderNumber,
          receiverNumber,
          screenshot
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast("Payment details submitted successfully", "success");
        onPaymentSubmitted();
        fetchMyPayments();
      } else {
        showToast(data.error || "Failed to submit payment details", "error");
      }
    } catch (err) {
      showToast("Could not connect to the server", "error");
    } finally {
      setLoading(false);
    }
  };

  // Check if there is an active/pending activation payment
  const pendingPayment = myPayments.find(p => p.type === 'activation' && p.status === 'pending');
  const rejectedPayment = myPayments.find(p => p.type === 'activation' && p.status === 'rejected');

  // Account details based on payment method
  const getMethodDetails = () => {
    switch (selectedMethod) {
      case 'easypaisa':
        return {
          name: "EasyPaisa",
          account: settings.easyPaisaAccount,
          title: settings.easyPaisaName,
          color: "border-emerald-500 text-emerald-400",
          desc: "Send the fee to the EasyPaisa account number provided below."
        };
      case 'jazzcash':
        return {
          name: "JazzCash",
          account: settings.jazzCashAccount,
          title: settings.jazzCashName,
          color: "border-amber-500 text-amber-400",
          desc: "Send the fee to the JazzCash account number provided below."
        };
      case 'bank':
        return {
          name: "Bank Transfer",
          account: settings.bankAccount,
          title: settings.bankTitle,
          bankName: settings.bankName,
          color: "border-sky-500 text-sky-400",
          desc: "Transfer funds from your bank account or any mobile app to this bank account."
        };
    }
  };

  const methodDetails = getMethodDetails();

  // Render Pending status page
  if (user.status === 'pending' || pendingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121214] font-sans">
        <div className="max-w-xl w-full glass-card p-8 rounded-3xl glow-yellow text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-yellow-500/10 rounded-full animate-pulse border border-yellow-500/30">
              <Clock className="w-16 h-16 text-yellow-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-wide">
            Payment Pending Approval
          </h1>

          <div className="space-y-3 px-2 text-zinc-300 text-left">
            <p className="text-lg text-center">
              Your account activation fee submission has been received.
            </p>
            <p className="text-sm text-zinc-400 text-center">
              Our administration is currently verifying your transaction ID and screenshot. Your account will be activated as soon as verification completes.
            </p>
          </div>

          {/* Animated timeline process */}
          <div className="py-6 px-4 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Request Status</span>
              <span className="text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full font-sans font-semibold">Pending Approval</span>
            </div>

            <div className="relative flex flex-col gap-6 text-left text-sm">
              <div className="absolute left-3.5 top-2 bottom-2 w-[2px] bg-zinc-800" />

              <div className="relative flex items-center gap-4">
                <div className="z-10 w-7 h-7 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Fee Submitted</p>
                  <p className="text-xs text-zinc-400">Payment details successfully registered in the system</p>
                </div>
              </div>

              <div className="relative flex items-center gap-4">
                <div className="z-10 w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-500 flex items-center justify-center animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping absolute" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 z-20" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Admin Verification (In Progress)</p>
                  <p className="text-xs text-zinc-400">Checking transaction ledger and payment proof screenshot</p>
                </div>
              </div>

              <div className="relative flex items-center gap-4 opacity-40">
                <div className="z-10 w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-300 font-semibold">Account Activation</p>
                  <p className="text-xs text-zinc-500">Your dashboard will open immediately after approval</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={fetchMyPayments}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 px-6 rounded-2xl border border-white/10 transition-all font-semibold"
            >
              <RefreshCw className="w-5 h-5 animate-spin" />
              Refresh Status
            </button>
            <button
              onClick={onLogout}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3.5 px-6 rounded-2xl border border-red-500/20 transition-all font-semibold"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 bg-[#121214] font-sans flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-semibold glow-red">
            <ShieldAlert className="w-4 h-4" />
            <span>Account Inactive</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-wide leading-tight">
            Account Activation Fee Required
          </h1>
          <div className="max-w-2xl mx-auto space-y-2 text-zinc-300 leading-relaxed text-sm md:text-base">
            <p>Please select one of the subscription plans below and transfer the fee amount to the specified account.</p>
            <p>Your portal account will be activated once your transfer details are approved by our team.</p>
            <p>Active accounts gain full access to premium tasks, direct referrals, and instant withdrawals.</p>
            <p className="text-emerald-400 font-semibold bg-emerald-500/5 py-1 px-3 rounded-xl inline-block border border-emerald-500/10">
              This is a one-time activation fee. There are no recurring or hidden subscription charges.
            </p>
          </div>
        </div>

        {/* Display Rejected message if applicable */}
        {rejectedPayment && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl glow-red flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-bold">Your previous payment was rejected!</p>
              <p className="text-zinc-400 text-xs">Please submit the correct transaction details and a clear screenshot.</p>
            </div>
          </div>
        )}

        {/* Step 1: Plan Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white border-l-4 border-yellow-500 pl-3">
            Step 1: Choose Your Plan
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`text-left p-5 rounded-2xl glass-card transition-all flex flex-col justify-between h-40 border relative overflow-hidden ${
                    isSelected ? 'plan-selected-glow scale-102 bg-white/5 border-white/30' : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 p-1.5 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  <p className="text-zinc-400 text-xs font-semibold">PLAN NAME</p>
                  <h3 className="text-xl font-bold text-white mt-1">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-zinc-400 text-xs">PRICE</span>
                    <p className="text-2xl font-extrabold text-white">{plan.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Payment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Account Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white border-l-4 border-yellow-500 pl-3">
                Step 2: Select Payment Method
              </h2>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setSelectedMethod('easypaisa')}
                  className={`flex items-center justify-between p-4 rounded-xl border glass-card transition-all ${
                    selectedMethod === 'easypaisa' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className="text-white font-medium">EasyPaisa</span>
                  <div className="w-5 h-5 rounded-full border border-emerald-500/40 flex items-center justify-center">
                    {selectedMethod === 'easypaisa' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMethod('jazzcash')}
                  className={`flex items-center justify-between p-4 rounded-xl border glass-card transition-all ${
                    selectedMethod === 'jazzcash' ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className="text-white font-medium">JazzCash</span>
                  <div className="w-5 h-5 rounded-full border border-amber-500/40 flex items-center justify-center">
                    {selectedMethod === 'jazzcash' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMethod('bank')}
                  className={`flex items-center justify-between p-4 rounded-xl border glass-card transition-all ${
                    selectedMethod === 'bank' ? 'border-sky-500/50 bg-sky-500/5' : 'border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className="text-white font-medium">Bank Transfer</span>
                  <div className="w-5 h-5 rounded-full border border-sky-500/40 flex items-center justify-center">
                    {selectedMethod === 'bank' && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Selected Account detail box */}
            <div className={`p-6 rounded-2xl glass-card border space-y-4 glow-white`}>
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <CreditCard className="w-5 h-5 text-yellow-500" />
                <h3 className="text-md font-bold text-white">Recipient Details</h3>
              </div>

              <div className="space-y-4 text-sm text-left">
                <p className="text-zinc-300 text-xs">{methodDetails.desc}</p>
                
                {methodDetails.bankName && (
                  <div>
                    <span className="text-zinc-400 text-xs">Bank Name</span>
                    <p className="text-white font-bold">{methodDetails.bankName}</p>
                  </div>
                )}

                <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
                  <div>
                    <span className="text-zinc-400 text-xs">Account Title</span>
                    <p className="text-white font-bold text-md">{methodDetails.title}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(methodDetails.title, "Account Title")}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5 font-mono">
                  <div className="overflow-x-auto select-all">
                    <span className="text-zinc-400 text-xs font-sans">Account Number / IBAN</span>
                    <p className="text-yellow-400 font-extrabold text-lg tracking-wider">{methodDetails.account}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(methodDetails.account, "Account Number")}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {/* Simulated QR Code placeholder (beautiful CSS vector design) */}
                <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/60 rounded-xl border border-white/5 space-y-2">
                  <span className="text-zinc-400 text-xs">Scan QR Code for Direct Payment</span>
                  <div className="w-32 h-32 bg-white p-2 rounded-lg flex items-center justify-center relative shadow-inner">
                    {/* Visual QR Pattern representation */}
                    <div className="w-full h-full border-4 border-black relative flex flex-wrap p-1">
                      <div className="w-8 h-8 border-4 border-black bg-white" />
                      <div className="w-8 h-8 flex-1 bg-black/10" />
                      <div className="w-8 h-8 border-4 border-black bg-white" />
                      <div className="w-full flex-1 flex flex-wrap">
                        <div className="w-1/2 h-1/2 bg-black" />
                        <div className="w-1/2 h-1/2 bg-transparent" />
                        <div className="w-1/2 h-1/2 bg-transparent" />
                        <div className="w-1/2 h-1/2 bg-black" />
                      </div>
                      <div className="w-8 h-8 border-4 border-black bg-white" />
                    </div>
                    {/* Centered Logo representation */}
                    <div className="absolute inset-0 m-auto w-8 h-8 bg-[#121214] border border-white rounded-md flex items-center justify-center text-[10px] font-bold text-yellow-400">
                      PAK
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500">Scan via Mobile Wallet App</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Submission Form */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-bold text-white border-l-4 border-yellow-500 pl-3">
              Step 3: Submit Payment Proof
            </h2>

            <form onSubmit={handleSubmitPayment} className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 glow-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-300 text-xs block">Selected Package</label>
                  <input
                    type="text"
                    readOnly
                    value={plans.find(p => p.id === selectedPlan)?.name || ''}
                    className="w-full bg-zinc-900/60 border border-white/10 p-3 rounded-xl text-zinc-400 focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 text-xs block">Amount (PKR)</label>
                  <input
                    type="text"
                    readOnly
                    value={`Rs. ${plans.find(p => p.id === selectedPlan)?.price || 0}`}
                    className="w-full bg-zinc-900/60 border border-white/10 p-3 rounded-xl text-yellow-400 font-extrabold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-300 text-xs block">Transaction ID (TID) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 837482937"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all font-mono tracking-wider"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-300 text-xs block">Sender's Mobile Wallet Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 03001234567"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 text-xs block">Recipient Number Paid *</label>
                  <input
                    type="text"
                    required
                    placeholder="Recipient's wallet number"
                    value={receiverNumber}
                    onChange={(e) => setReceiverNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 p-3 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Screenshot Drag & Drop/Click Uploader */}
              <div className="space-y-2">
                <label className="text-zinc-300 text-xs block">Payment Receipt Screenshot *</label>
                <div className="relative border-2 border-dashed border-white/10 hover:border-white/20 transition-all rounded-xl p-6 bg-zinc-950/40 text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {screenshot ? (
                    <div className="space-y-3">
                      <img src={screenshot} alt="Screenshot preview" className="max-h-40 mx-auto rounded-lg border border-white/10" />
                      <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Screenshot selected (Click to replace)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-zinc-400 flex flex-col items-center justify-center">
                      <UploadCloud className="w-10 h-10 text-zinc-500" />
                      <p className="text-sm font-semibold text-white">Drag or upload receipt image here</p>
                      <p className="text-xs text-zinc-500">JPEG, PNG (Max 2MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 text-zinc-950 py-3.5 px-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-yellow-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Submitting details...</span>
                    </>
                  ) : (
                    <span>Submit Payment Proof</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer/Logout Action */}
        <div className="border-t border-white/5 pt-6 flex justify-between items-center text-xs text-zinc-500">
          <span>Pak Earning Portal © 2026</span>
          <button
            onClick={onLogout}
            className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 hover:underline transition-all"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
