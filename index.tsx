import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { jsPDF } from "jspdf";
import { 
  Sprout, 
  Droplets, 
  Sun, 
  Moon,
  Wind, 
  Camera, 
  Search, 
  CheckCircle2, 
  LayoutDashboard,
  Bug,
  Loader2,
  RefreshCcw,
  ArrowRight,
  MessageSquare,
  Send,
  User,
  Bot,
  Zap,
  History,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronRight,
  Info,
  TrendingUp,
  Map,
  ShieldCheck,
  Bell,
  Clock,
  Plus,
  Check,
  Share2,
  Download,
  Lock,
  Mail,
  ArrowUpRight,
  Globe,
  Leaf,
  LogOut,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

// --- Types ---
const APP_NAME = "FarmWise";

type AnalysisResult = {
  healthScore: number;
  quality: string;
  nutrients: { label: string; value: number }[];
  recommendations: string[];
  description: string;
};

type CropRecommendation = {
  name: string;
  suitability: string;
  duration: string;
  reason: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
};

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

type HistoryItem = {
  id: string;
  timestamp: string;
  type: 'soil' | 'crop' | 'planner';
  data: any;
  image?: string | null;
  summary: string;
};

type Reminder = {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  category: 'Planting' | 'Watering' | 'Fertilizing' | 'Harvesting';
};

type AuthState = 'landing' | 'login' | 'signup' | 'authenticated';

// --- Custom Components ---

const GlassCard = ({ children, className = "", onClick }: { children?: React.ReactNode; className?: string; onClick?: () => void; key?: React.Key }) => (
  <div 
    onClick={onClick}
    className={`glass rounded-[32px] p-6 transition-all duration-500 hover:shadow-2xl dark:shadow-black/40 ${className}`}
  >
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = 'primary', 
  className = "" 
}: { 
  children?: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  className?: string;
  key?: React.Key;
}) => {
  const variants = {
    primary: "bg-[#1B4332] text-white hover:bg-[#081C15] shadow-lg hover:shadow-[#2D6A4F]/20 dark:bg-[#74C69D] dark:text-[#081C15] dark:hover:bg-[#95D5B2]",
    secondary: "bg-[#74C69D] text-[#1B4332] hover:bg-[#95D5B2] shadow-md dark:bg-[#1B4332] dark:text-white dark:hover:bg-[#2D6A4F]",
    outline: "border-2 border-[#1B4332]/20 text-[#1B4332] hover:bg-[#1B4332] hover:text-white dark:border-[#74C69D]/30 dark:text-[#74C69D] dark:hover:bg-[#74C69D] dark:hover:text-[#081C15]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const HealthGauge = ({ score, label, isDarkMode }: { score: number; label: string; isDarkMode: boolean }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          className="text-[#1B4332] dark:text-[#74C69D] transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-black text-slate-900 dark:text-white">{score}%</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</span>
      </div>
    </div>
  );
};

// --- Landing Page ---

const LandingPage = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F0F4F2] dark:bg-[#081C15]">
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#74C69D]/10 dark:bg-[#74C69D]/5 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#1B4332]/10 dark:bg-[#1B4332]/10 blur-[100px] rounded-full animate-pulse" />
      </div>

      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1B4332] dark:bg-[#74C69D] rounded-xl flex items-center justify-center shadow-lg">
            <Sprout className="text-white dark:text-[#081C15]" size={20} />
          </div>
          <span className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">FarmWise</span>
        </div>
        <button 
          onClick={onStart}
          className="px-6 py-2.5 rounded-full bg-white dark:bg-white/10 text-slate-800 dark:text-white font-bold text-sm shadow-sm hover:shadow-xl transition-all border border-transparent hover:border-green-200"
        >
          Sign In
        </button>
      </nav>

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-black uppercase tracking-widest mb-8">
            <Zap size={14} /> AI-Powered Agriculture
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter mb-8">
            Grow Smarter, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B4332] to-[#74C69D] dark:from-[#74C69D] dark:to-white">Not Harder.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium mb-12 max-w-xl leading-relaxed">
            The world's most advanced farming intelligence platform. Analyze soil health, monitor crop vitality, and plan your seasons with scientific precision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={onStart} className="!px-10 !h-16 text-lg">
              Get Started Now <ArrowRight size={20} />
            </Button>
            <div className="flex -space-x-3 items-center ml-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-[#081C15] bg-slate-200 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                </div>
              ))}
              <div className="pl-6 text-sm font-bold text-slate-400">
                <span className="text-slate-900 dark:text-white">10,000+</span> Farmers trust us
              </div>
            </div>
          </div>
        </div>

        <div className="relative animate-float">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#74C69D]/20 to-transparent blur-3xl rounded-full" />
          <div className="relative glass p-4 rounded-[48px] border-4 border-white/50 dark:border-white/5">
            <div className="bg-[#1B4332] dark:bg-[#081C15] rounded-[40px] aspect-[4/5] overflow-hidden relative group">
              <img 
                src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=90&w=1600" 
                className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-1000"
                alt="Farming Intelligence" 
              />
              <div className="absolute bottom-8 left-8 right-8">
                <GlassCard className="!p-6 bg-white/20 backdrop-blur-2xl border-white/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-green-300 uppercase mb-1">Live Soil Analysis</p>
                      <h4 className="text-xl font-black text-white">98% Health Index</h4>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <TrendingUp size={24} />
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-200 dark:border-white/5">
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { icon: Droplets, title: "Soil Analysis", desc: "Instant nutrient mapping and enrichment recommendations." },
            { icon: Bug, title: "Crop Defense", desc: "AI pest detection and scientific health scoring systems." },
            { icon: Calendar, title: "Season Planner", desc: "Data-driven planting strategies tailored to your climate." }
          ].map((feat, i) => (
            <div key={i} className="group cursor-default">
              <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-3xl flex items-center justify-center text-[#1B4332] dark:text-[#74C69D] shadow-sm mb-8 group-hover:scale-110 group-hover:bg-[#1B4332] group-hover:text-white transition-all">
                <feat.icon size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4">{feat.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// --- Auth Components ---

const CreativeAuthPage = ({ mode, onSwitch, onAuth }: { mode: 'login' | 'signup', onSwitch: (m: 'login' | 'signup') => void, onAuth: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusField, setFocusField] = useState<'none' | 'email' | 'password'>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Mock verification with case-insensitive email and whitespace trimming
    setTimeout(() => {
      setLoading(false);
      if (mode === 'signup') {
        onSwitch('login');
        alert("Account created! Please sign in with user@farm.com / password123");
      } else {
        const correctEmail = 'user@farm.com';
        const correctPassword = 'password123';

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPassword = password.trim();

        if (normalizedEmail === correctEmail && normalizedPassword === correctPassword) {
          console.log("Auth success, calling onAuth callback...");
          onAuth();
        } else {
          setError("Incorrect email or password. Use: user@farm.com / password123");
        }
      }
    }, 1000);
  };

  const renderLogin = () => {
    const getEyeTranslate = () => {
      if (focusField === 'email') return 'translate(8px, -4px)';
      if (focusField === 'password') return 'translate(4px, 4px)';
      return 'translate(0px, 0px)';
    };

    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-[#F2F2F2] dark:bg-[#0A0A0A] transition-colors duration-500 overflow-hidden font-sans w-full">
        <div className="w-full md:w-[45%] h-[400px] md:h-auto bg-[#E5E5E5] dark:bg-[#111111] flex items-end justify-center relative p-12 overflow-hidden">
          <div className="absolute top-10 left-10 w-8 h-8 rounded-full bg-orange-400 opacity-80 animate-bounce" />
          <div className="absolute bottom-20 right-10 w-12 h-12 bg-purple-500 opacity-60 rounded-xl rotate-45 animate-pulse" />
          <div className="absolute top-1/4 right-20 w-6 h-6 bg-yellow-400 opacity-70 rounded-full animate-float" />
          
          <div className="relative flex items-end gap-1 mb-20 md:mb-40 scale-75 md:scale-100 transition-all duration-700">
            <div className="w-48 h-24 bg-[#FF7D45] rounded-t-full relative z-10 transition-all duration-500 hover:scale-105">
               <div className="absolute top-10 left-12 flex gap-4 transition-transform duration-300" style={{ transform: getEyeTranslate() }}>
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-black rounded-full" /></div>
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-black rounded-full" /></div>
               </div>
            </div>
            <div className="w-24 h-56 bg-[#7C3AED] rounded-3xl relative z-0 -ml-12 transition-all duration-700 ease-in-out" style={{ transform: focusField === 'password' ? 'translateY(40px)' : 'translateY(0)' }}>
               <div className={`absolute top-12 left-6 flex flex-col gap-1 transition-opacity duration-300 ${focusField === 'password' ? 'opacity-20' : 'opacity-100'}`}>
                  <div className="flex gap-2" style={{ transform: getEyeTranslate() }}>
                    <div className="w-1.5 h-1.5 bg-black rounded-full" /><div className="w-1.5 h-1.5 bg-black rounded-full" />
                  </div>
               </div>
            </div>
            <div className="w-32 h-32 bg-black rounded-3xl relative z-20 -ml-10 flex items-center justify-center transition-all duration-500" style={{ transform: focusField === 'password' ? 'scale(0.85) rotate(-12deg)' : 'scale(1)' }}>
               <div className="flex gap-5 mb-4 transition-transform duration-300" style={{ transform: getEyeTranslate() }}>
                  <div className={`transition-all duration-500 bg-white ${focusField === 'password' ? 'w-5 h-0.5 rounded-none' : 'w-3 h-3 rounded-full'}`} />
                  <div className={`transition-all duration-500 bg-white ${focusField === 'password' ? 'w-5 h-0.5 rounded-none' : 'w-3 h-3 rounded-full'}`} />
               </div>
            </div>
            <div className="w-20 h-40 bg-[#FCD34D] rounded-full relative z-10 -ml-8 transition-all duration-500" style={{ height: focusField === 'email' ? '180px' : '160px' }}>
               <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-1.5 transition-transform duration-300" style={{ transform: getEyeTranslate() }}>
                  <div className="w-1.5 h-1.5 bg-black rounded-full" /><div className="w-1.5 h-1.5 bg-black rounded-full" />
               </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[55%] min-h-screen bg-white dark:bg-[#0D0D0D] flex items-center justify-center p-8 md:p-20 relative">
          <div className="w-full max-w-md animate-scale-in">
            <div className="mb-8 text-left">
              <div className="w-10 h-10 mb-6 text-[#7C3AED]">
                 <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L24.5 15.5L40 20L24.5 24.5L20 40L15.5 24.5L0 20L15.5 15.5L20 0Z" fill="currentColor" /></svg>
              </div>
              <h1 className="text-4xl font-black text-[#1A1A1A] dark:text-white mb-2 tracking-tight">Welcome back!</h1>
              <p className="text-slate-400 dark:text-slate-500 font-medium">Please enter your farming credentials</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 animate-slide-up border border-red-100 dark:border-red-900/30">
                <AlertCircle size={20} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-slate-300 ml-1">Email</label>
                <input 
                  type="email" required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField('none')}
                  placeholder="user@farm.com"
                  className={`w-full h-14 bg-transparent border-b-2 text-lg font-bold text-[#1A1A1A] dark:text-white outline-none transition-all duration-300 ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-black dark:focus:border-white'}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A1A1A] dark:text-slate-300 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusField('password')}
                    onBlur={() => setFocusField('none')}
                    placeholder="••••••••"
                    className={`w-full h-14 bg-transparent border-b-2 text-lg font-bold text-[#1A1A1A] dark:text-white outline-none transition-all duration-300 pr-12 ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-black dark:focus:border-white'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-black dark:hover:text-white">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button type="submit" disabled={loading} className="w-full h-16 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] rounded-full font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-xl shadow-black/5">
                  {loading ? <Loader2 className="animate-spin" /> : 'Log In'}
                </button>
              </div>
            </form>

            <div className="mt-12 text-center">
              <p className="text-sm font-bold text-slate-400">
                Don't have an account? <button onClick={() => onSwitch('signup')} className="text-black dark:text-white hover:underline ml-1">Sign up</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSignup = () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F0F4F2] dark:bg-[#081C15] relative overflow-hidden">
      <div className="absolute inset-0"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#74C69D]/10 blur-[150px] rounded-full animate-pulse" /></div>
      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#1B4332] dark:bg-[#74C69D] rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6"><Sprout className="text-white dark:text-[#081C15]" size={32} /></div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Start Growing</h2>
        </div>
        <GlassCard className="!p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Full Name</label><div className="relative"><User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} /><input type="text" required placeholder="John Farmer" className="w-full h-14 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-14 font-bold outline-none focus:border-[#1B4332]" /></div></div>
            <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Email Address</label><div className="relative"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} /><input type="email" required placeholder="name@farm.com" className="w-full h-14 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-14 font-bold outline-none focus:border-[#1B4332]" /></div></div>
            <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Password</label><div className="relative"><Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} /><input type="password" required placeholder="••••••••" className="w-full h-14 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/10 rounded-2xl pl-14 font-bold outline-none focus:border-[#1B4332]" /></div></div>
            <Button disabled={loading} className="w-full h-16">{loading ? <Loader2 className="animate-spin" /> : 'Create Account'}</Button>
          </form>
          <div className="mt-8 text-center"><button onClick={() => onSwitch('login')} className="text-sm font-bold text-slate-400 hover:text-[#1B4332]">Already have an account? Sign In</button></div>
        </GlassCard>
      </div>
    </div>
  );

  return mode === 'login' ? renderLogin() : renderSignup();
};

// --- Main Application ---

const App = () => {
  const [authState, setAuthState] = useState<AuthState>('landing');
  const [activeTab, setActiveTab] = useState<'soil' | 'crop' | 'planner' | 'advisor' | 'history' | 'reminders'>('soil');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [soilResult, setSoilResult] = useState<AnalysisResult | null>(null);
  const [cropResult, setCropResult] = useState<AnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [season, setSeason] = useState('Spring');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('farmwise_auth');
    if (savedAuth === 'true') {
      setAuthState('authenticated');
    }

    const savedHistory = localStorage.getItem('farmwise_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedReminders = localStorage.getItem('farmwise_reminders');
    if (savedReminders) setReminders(JSON.parse(savedReminders));

    const savedDarkMode = localStorage.getItem('farmwise_darkmode');
    if (savedDarkMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('farmwise_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('farmwise_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('farmwise_darkmode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleAuth = () => {
    console.log("Setting auth state to authenticated...");
    localStorage.setItem('farmwise_auth', 'true');
    setAuthState('authenticated');
  };

  const handleLogout = () => {
    localStorage.removeItem('farmwise_auth');
    setAuthState('landing');
  };

  const addToHistory = (type: HistoryItem['type'], data: any, img?: string | null, summary?: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString(),
      type,
      data,
      image: img,
      summary: summary || (type === 'planner' ? `${season} Season Plan` : `AI Analysis`)
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const addReminder = (title: string, category: Reminder['category'], date?: string) => {
    const newReminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      category,
      date: date || new Date().toISOString().split('T')[0],
      completed: false
    };
    setReminders(prev => [newReminder, ...prev]);
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const handleSharePDF = (data: AnalysisResult, type: 'Soil' | 'Crop') => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    doc.setFontSize(22);
    doc.setTextColor(27, 67, 50);
    doc.text(APP_NAME + " Intelligence Report", margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${type} Analysis Report - Generated on ${new Date().toLocaleString()}`, margin, y);
    y += 15;
    doc.setFontSize(16);
    doc.setTextColor(27, 67, 50);
    doc.text("Analysis Overview", margin, y);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Quality Grade: ${data.quality}`, margin, y);
    y += 6;
    doc.text(`Overall Health Index: ${data.healthScore}%`, margin, y);
    y += 15;
    doc.setFontSize(14);
    doc.setTextColor(27, 67, 50);
    doc.text("Expert Summary", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitDesc = doc.splitTextToSize(data.description, 170);
    doc.text(splitDesc, margin, y);
    y += splitDesc.length * 5 + 10;
    doc.setFontSize(14);
    doc.setTextColor(27, 67, 50);
    doc.text("Nutrient Distribution", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    data.nutrients.forEach((n) => {
      doc.text(`${n.label}: ${n.value}%`, margin + 5, y);
      y += 6;
    });
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(27, 67, 50);
    doc.text("Action Plan & Recommendations", margin, y);
    y += 8;
    doc.setFontSize(10);
    data.recommendations.forEach((rec, i) => {
      const splitRec = doc.splitTextToSize(`${i + 1}. ${rec}`, 160);
      doc.text(splitRec, margin + 5, y);
      y += splitRec.length * 5 + 2;
    });
    doc.save(`${APP_NAME}_${type}_Report_${Date.now()}.pdf`);
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Provide 3-5 crop recommendations for the ${season} season. Return as pure JSON array with name, suitability, duration, reason, and difficulty ('Easy', 'Moderate', 'Challenging').`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                suitability: { type: Type.STRING },
                duration: { type: Type.STRING },
                reason: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ['Easy', 'Moderate', 'Challenging'] }
              },
              required: ['name', 'suitability', 'duration', 'reason', 'difficulty']
            }
          }
        }
      });
      const data = JSON.parse(response.text || '[]');
      setRecommendations(data);
      addToHistory('planner', data, null, `${season} Season Planting Plan`);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const getGeminiResponse = async (type: 'soil' | 'crop') => {
    if (!image) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];
      const prompt = type === 'soil' 
        ? "Analyze this soil. Provide JSON: healthScore, quality, nutrients (array of label/value), recommendations (array of string), description."
        : "Analyze this plant. Provide JSON: healthScore, quality, nutrients (array of label/value), recommendations (array of string), description.";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64Data, mimeType: 'image/jpeg' } }, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              healthScore: { type: Type.NUMBER },
              quality: { type: Type.STRING },
              nutrients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
              description: { type: Type.STRING }
            },
            required: ['healthScore', 'quality', 'nutrients', 'recommendations', 'description']
          }
        }
      });
      const data = JSON.parse(response.text || '{}');
      if (type === 'soil') {
        setSoilResult(data);
        addToHistory('soil', data, image, `Soil Quality: ${data.quality}`);
      } else {
        setCropResult(data);
        addToHistory('crop', data, image, `Crop Health: ${data.quality}`);
      }
    } catch (error) {
      console.error(error);
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e?: React.FormEvent, prompt?: string) => {
    if (e) e.preventDefault();
    const message = prompt || userInput;
    if (!message.trim() || isTyping) return;
    setChatHistory(prev => [...prev, { role: 'user', text: message }]);
    setUserInput('');
    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction: `Expert agronomist advisor.` } });
      const result = await chat.sendMessageStream({ message });
      let fullResponse = '';
      setChatHistory(prev => [...prev, { role: 'model', text: '' }]);
      for await (const chunk of result) {
        fullResponse += chunk.text;
        setChatHistory(prev => {
          const updated = [...prev];
          updated[updated.length - 1].text = fullResponse;
          return updated;
        });
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Service unavailable." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderAnalysis = () => {
    const data = activeTab === 'soil' ? soilResult : cropResult;
    if (!data) return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xl mb-6 text-slate-200">
          {activeTab === 'soil' ? <Droplets size={48} /> : <Bug size={48} />}
        </div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ready for Analysis</h3>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up">
        <GlassCard className="md:col-span-5 flex flex-col items-center justify-center">
          <HealthGauge score={data.healthScore} label="Health Index" isDarkMode={isDarkMode} />
          <div className="mt-6 text-center"><h4 className="text-2xl font-black text-slate-800 dark:text-white">{data.quality}</h4></div>
        </GlassCard>
        <GlassCard className="md:col-span-7 bg-[#1B4332] text-white">
          <h3 className="text-xs font-black uppercase text-[#74C69D] mb-4">Expert Summary</h3>
          <p className="text-lg leading-relaxed font-medium">{data.description}</p>
          <button onClick={() => handleSharePDF(data, activeTab === 'soil' ? 'Soil' : 'Crop')} className="mt-6 px-4 py-2 bg-white/10 rounded-xl flex items-center gap-2 text-xs font-bold hover:bg-white/20">
            <Download size={14} /> PDF Report
          </button>
        </GlassCard>
        <GlassCard className="md:col-span-6 bg-white dark:bg-slate-800/40">
          <h3 className="text-lg font-black mb-6">Nutrient Profile</h3>
          <div className="space-y-6">
            {data.nutrients.map((n, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-black"><span>{n.label}</span><span>{n.value}%</span></div>
                <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full"><div className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#74C69D]" style={{ width: `${n.value}%` }} /></div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="md:col-span-6 bg-white dark:bg-slate-800/40 border-l-8 border-[#74C69D]">
          <h3 className="text-lg font-black mb-6">Action Plan</h3>
          <div className="space-y-4">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex-shrink-0 flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                <p className="text-sm font-bold">{rec}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  };

  if (authState === 'landing') return <LandingPage onStart={() => setAuthState('login')} />;
  if (authState === 'login' || authState === 'signup') return <CreativeAuthPage mode={authState} onSwitch={(m) => setAuthState(m)} onAuth={handleAuth} />;

  return (
    <div className={`min-h-screen pb-24 md:pb-0 bg-white dark:bg-[#081C15] text-slate-900 dark:text-slate-100 transition-colors`}>
      <header className="sticky top-0 z-50 glass border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1B4332] dark:bg-[#74C69D] rounded-2xl flex items-center justify-center shadow-xl"><Sprout className="text-white dark:text-[#081C15]" size={24} /></div>
            <h1 className="text-xl font-black tracking-tighter">FarmWise</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-2">
              {['Soil', 'Crop', 'Planner', 'Advisor', 'Reminders'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab.toLowerCase() as any)} className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest ${activeTab === tab.toLowerCase() ? 'bg-[#1B4332] text-white' : 'text-slate-400 hover:text-slate-800'}`}>{tab}</button>
              ))}
            </div>
            <button onClick={toggleDarkMode} className="p-3 rounded-2xl bg-white/50 dark:bg-white/10">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={handleLogout} className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t px-4 py-3 flex justify-around items-center">
        {[
          { name: 'Soil', icon: Droplets },
          { name: 'Crop', icon: Bug },
          { name: 'Planner', icon: Calendar },
          { name: 'Advisor', icon: MessageSquare },
          { name: 'Reminders', icon: Bell }
        ].map(tab => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name.toLowerCase() as any)}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all ${
              activeTab === tab.name.toLowerCase()
                ? 'bg-[#1B4332] text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon size={20} />
            <span className="text-[10px] font-black uppercase">{tab.name}</span>
          </button>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'advisor' ? (
          <div className="max-w-4xl mx-auto h-[600px]">
            <GlassCard className="h-full flex flex-col p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-[#1B4332] p-8 text-white"><h3 className="text-xl font-black">AI Agronomist</h3></div>
              <div className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar dark:bg-slate-900/30">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-[#1B4332] text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{msg.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-8 border-t"><form onSubmit={handleChat} className="relative"><input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Ask anything about your farm..." className="w-full bg-white dark:bg-slate-800 border-2 rounded-full px-8 py-5 font-bold outline-none pr-20" /><button type="submit" className="absolute right-3 top-3 bottom-3 w-14 bg-[#1B4332] text-white rounded-full flex items-center justify-center"><Send size={20} /></button></form></div>
            </GlassCard>
          </div>
        ) : activeTab === 'reminders' ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-black">Daily Tasks</h2><Button onClick={() => addReminder(prompt("What's the task?") || "Task", 'Planting')} variant="outline"><Plus size={20} /> Add Task</Button></div>
            <div className="grid gap-4">
              {reminders.map(r => (
                <GlassCard key={r.id} className={`flex items-center gap-6 ${r.completed ? 'opacity-50' : 'border-l-8 border-[#74C69D]'}`}>
                  <button onClick={() => toggleReminder(r.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.completed ? 'bg-green-500 text-white' : 'border-2'}`}><Check size={20} /></button>
                  <div className="flex-grow"><h3 className={`text-lg font-black ${r.completed ? 'line-through' : ''}`}>{r.title}</h3></div>
                  <button onClick={() => deleteReminder(r.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={20} /></button>
                </GlassCard>
              ))}
            </div>
          </div>
        ) : activeTab === 'planner' ? (
          <div className="space-y-10">
            <GlassCard className="bg-[#1B4332] p-12 text-white flex justify-between items-center">
              <div><h2 className="text-4xl font-black">Optimal Planting</h2></div>
              <div className="flex gap-4">
                <select value={season} onChange={(e) => setSeason(e.target.value)} className="bg-white/20 text-white rounded-2xl px-6 py-3 font-bold">
                  <option value="Spring" className="text-black">Spring</option>
                  <option value="Summer" className="text-black">Summer</option>
                  <option value="Autumn" className="text-black">Autumn</option>
                  <option value="Winter" className="text-black">Winter</option>
                </select>
                <Button variant="secondary" onClick={fetchRecommendations} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <RefreshCcw size={20} />}</Button>
              </div>
            </GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recommendations.map((c, i) => (
                <GlassCard key={i} className="border-b-8 border-[#74C69D]"><h3 className="text-2xl font-black mb-2">{c.name}</h3><p className="text-sm text-slate-500 mb-6">{c.suitability}</p><Button variant="outline" className="w-full" onClick={() => addReminder(`Plant ${c.name}`, 'Planting')}><Bell size={14} /> Remind</Button></GlassCard>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <GlassCard className="h-[400px] flex flex-col items-center justify-center cursor-pointer border-4 border-dashed" onClick={() => fileInputRef.current?.click()}>
                {image ? <img src={image} className="w-full h-full object-cover rounded-3xl" /> : <div className="text-center"><Camera size={48} className="mx-auto mb-4 text-slate-300" /><p className="font-bold text-slate-400">Capture sample</p></div>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImage(reader.result as string); reader.readAsDataURL(file); }}} />
              </GlassCard>
              <Button className="w-full h-20 text-xl" disabled={!image || loading} onClick={() => getGeminiResponse(activeTab as 'soil' | 'crop')}>{loading ? <Loader2 className="animate-spin" /> : <Search />} {loading ? 'Scanning...' : 'Analyze Sample'}</Button>
            </div>
            <div className="lg:col-span-8">{renderAnalysis()}</div>
          </div>
        )}
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
