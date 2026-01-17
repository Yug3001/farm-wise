
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
  Download
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

// --- Custom Components ---

const GlassCard = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string; onClick?: () => void }>(
  ({ children, className = "", onClick }, ref) => (
  <div 
    ref={ref}
    onClick={onClick}
    className={`glass rounded-[32px] p-6 transition-all duration-300 hover:shadow-2xl hover:translate-y-[-4px] active:scale-[0.98] dark:shadow-black/40 ${className}`}
  >
    {children}
  </div>
));

const HealthGauge = ({ score, label, isDarkMode }: { score: number, label: string, isDarkMode: boolean }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-[#2D6A4F] dark:text-[#74C69D] progress-ring__circle"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-800 dark:text-white">{score}%</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
};

const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = 'primary', 
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  className?: string;
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

// --- Main Application ---

const App = () => {
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
  
  // Chat States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  // --- Analysis Handlers ---

  const handleSharePDF = (data: AnalysisResult, type: 'Soil' | 'Crop') => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(27, 67, 50); // #1B4332
    doc.text(APP_NAME + " Intelligence Report", margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${type} Analysis Report - Generated on ${new Date().toLocaleString()}`, margin, y);
    y += 15;

    // Main Section: Score & Quality
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

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(27, 67, 50);
    doc.text("Expert Summary", margin, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitDesc = doc.splitTextToSize(data.description, 170);
    doc.text(splitDesc, margin, y);
    y += splitDesc.length * 5 + 10;

    // Nutrients
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

    // Action Plan
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

    // Save PDF
    doc.save(`${APP_NAME}_${type}_Report_${Date.now()}.pdf`);
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Provide 3-5 crop recommendations for the ${season} season. 
      For each crop, provide: name, suitability description, typical duration (e.g. "90-120 days"), 
      the scientific reason why it's suitable, and difficulty level ('Easy', 'Moderate', or 'Challenging'). 
      Return the response as a pure JSON array.`;

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
      alert("Failed to fetch recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getGeminiResponse = async (type: 'soil' | 'crop') => {
    if (!image) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = image.split(',')[1];
      const prompt = type === 'soil' 
        ? "Analyze this soil. Provide: healthScore (0-100), quality name, nutrients (Nitrogen, Phosphorus, Potassium as percentages), 3 specific recommendations, and a detailed description. Return as pure JSON."
        : "Analyze this plant/crop. Provide: healthScore (0-100), health status quality, growth stage nutrients (Health, Vitality, Moisture as percentages), 3 care tips, and a description. Return as pure JSON.";

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
      alert("Analysis failed. Please check your image clarity.");
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY
 });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are FarmWise Advisor. Expert in modern agriculture, soil enrichment, pest management, and govt policies. Provide structured, visual, and highly helpful responses for farmers.`,
        },
      });

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
      setChatHistory(prev => [...prev, { role: 'model', text: "Service unavailable. Try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderAnalysis = () => {
    const data = activeTab === 'soil' ? soilResult : cropResult;
    if (!data) return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-scale-in">
        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xl mb-6 text-slate-200 dark:text-slate-700">
          {activeTab === 'soil' ? <Droplets size={48} /> : <Bug size={48} />}
        </div>
        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ready for Analysis</h3>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up">
        {/* Bento Cell: Gauge */}
        <GlassCard className="md:col-span-5 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40">
          <HealthGauge score={data.healthScore} label="Health Index" isDarkMode={isDarkMode} />
          <div className="mt-6 text-center">
            <h4 className="text-2xl font-black text-slate-800 dark:text-white">{data.quality}</h4>
            <p className="text-sm text-slate-500 font-medium mt-1">Overall Sample Grade</p>
          </div>
        </GlassCard>

        {/* Bento Cell: Description */}
        <GlassCard className="md:col-span-7 bg-[#1B4332] dark:bg-[#081C15]/80 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700">
            <Sprout size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#74C69D]">Expert Summary</h3>
              <button 
                onClick={() => handleSharePDF(data, activeTab === 'soil' ? 'Soil' : 'Crop')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold"
              >
                <Download size={14} /> PDF Report
              </button>
            </div>
            <p className="text-lg leading-relaxed font-medium text-green-50 dark:text-green-100">{data.description}</p>
          </div>
        </GlassCard>

        {/* Bento Cell: Nutrients */}
        <GlassCard className="md:col-span-6 bg-white dark:bg-slate-800/40">
          <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            <TrendingUp size={20} className="text-[#2D6A4F] dark:text-[#74C69D]" />
            Nutrient Distribution
          </h3>
          <div className="space-y-6">
            {data.nutrients.map((n, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-black text-slate-500 dark:text-slate-400 uppercase">
                  <span>{n.label}</span>
                  <span>{n.value}%</span>
                </div>
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                <div 
                  className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden"
                  role="progressbar"
                  {...{ 'aria-valuenow': n.value, 'aria-valuemin': 0, 'aria-valuemax': 100 }}
                  aria-label={`${n.label} nutrient level: ${n.value}%`}
                  data-testid={`nutrient-progress-${n.label}`}
                >
                  <div 
                    className="nutrient-progress-fill"
                    data-width={n.value}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Bento Cell: Recommendations */}
        <GlassCard className="md:col-span-6 bg-white dark:bg-slate-800/40 border-l-8 border-[#74C69D]">
          <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            <ShieldCheck size={20} className="text-[#2D6A4F] dark:text-[#74C69D]" />
            Action Plan
          </h3>
          <div className="space-y-4">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl group hover:bg-[#D8F3DC] dark:hover:bg-[#1B4332]/40 transition-colors border border-transparent hover:border-[#74C69D]">
                <div className="w-6 h-6 rounded-full bg-[#1B4332] dark:bg-[#74C69D] text-white dark:text-[#081C15] flex-shrink-0 flex items-center justify-center text-[10px] font-black">
                  {i + 1}
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-snug">{rec}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  };

  return (
    <div className={`min-h-screen pb-24 md:pb-0 bg-white dark:bg-[#081C15] text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-[#F0F4F2] dark:bg-[#081C15]">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#74C69D]/10 dark:bg-[#74C69D]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1B4332]/5 dark:bg-[#1B4332]/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/50 dark:border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1B4332] dark:bg-[#74C69D] rounded-2xl flex items-center justify-center shadow-xl shadow-[#1B4332]/20 dark:shadow-black/20 animate-float">
              <Sprout className="text-white dark:text-[#081C15]" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">{APP_NAME}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-2">
              {['Soil', 'Crop', 'Planner', 'Advisor', 'History', 'Reminders'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase() as any)}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all relative ${
                    activeTab === tab.toLowerCase() ? 'bg-[#1B4332] dark:bg-[#74C69D] text-white dark:text-[#081C15] shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  {tab}
                  {tab === 'Reminders' && reminders.filter(r => !r.completed).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 text-white text-[8px] flex items-center justify-center rounded-full animate-bounce">
                      {reminders.filter(r => !r.completed).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-3 rounded-2xl bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-all text-slate-500 dark:text-[#74C69D] shadow-sm"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'advisor' ? (
          <div className="max-w-4xl mx-auto h-[700px] animate-slide-up">
            <GlassCard className="h-full flex flex-col p-0 overflow-hidden shadow-2xl border-none">
              <div className="bg-[#1B4332] dark:bg-[#081C15] p-8 text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#74C69D] rounded-2xl flex items-center justify-center text-[#1B4332] shadow-xl">
                    <Bot size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Agricultural Advisor</h3>
                    <p className="text-xs font-bold text-green-300 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Always Ready
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar dark:bg-slate-900/30">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
                      <MessageSquare size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Ask Anything</h3>
                    <p className="text-slate-400 max-w-xs mx-auto text-sm leading-relaxed">
                      "What are the best organic pest controls?"<br/>
                      "Tell me about PM-KISAN benefits."
                    </p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
                    <div className={`max-w-[80%] p-5 rounded-3xl shadow-sm text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                      ? 'bg-[#1B4332] text-white rounded-tr-none' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-white/5'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-2">
                      <div className="w-1.5 h-1.5 bg-[#74C69D] rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-[#74C69D] rounded-full animate-bounce delay-75" />
                      <div className="w-1.5 h-1.5 bg-[#74C69D] rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-8 bg-white/50 dark:bg-[#081C15]/50 border-t border-slate-100 dark:border-white/5">
                <form onSubmit={handleChat} className="relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Describe your farming challenge..."
                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/10 rounded-3xl px-8 py-5 text-sm font-bold focus:border-[#1B4332] dark:focus:border-[#74C69D] outline-none transition-all pr-20 dark:text-white dark:placeholder-slate-500"
                  />
                  <button 
                    type="submit" 
                    title="Send message"
                    className="absolute right-3 top-3 bottom-3 w-14 bg-[#1B4332] dark:bg-[#74C69D] text-white dark:text-[#081C15] rounded-2xl flex items-center justify-center hover:bg-[#081C15] dark:hover:bg-[#95D5B2] transition-all"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </GlassCard>
          </div>
        ) : activeTab === 'reminders' ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Daily Schedule</h2>
                <p className="text-sm font-medium text-slate-400">Never miss a critical task for your crops.</p>
              </div>
              <Button onClick={() => {
                const title = prompt("Reminder title?");
                if (title) addReminder(title, 'Planting');
              }} variant="outline">
                <Plus size={20} /> New Task
              </Button>
            </div>

            <div className="grid gap-4">
              {reminders.length === 0 && (
                <div className="py-20 text-center text-slate-300 dark:text-slate-700 flex flex-col items-center">
                  <Bell size={64} className="mb-4 opacity-20" />
                  <p className="font-bold">No active reminders</p>
                  <p className="text-xs">Go to Planner to set planting schedules!</p>
                </div>
              )}
              {reminders.sort((a,b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map((reminder) => (
                <GlassCard key={reminder.id} className={`flex items-center gap-6 group transition-all ${reminder.completed ? 'opacity-50 grayscale' : 'border-l-8 border-[#74C69D] dark:bg-slate-900/40'}`}>
                  <button 
                    onClick={() => toggleReminder(reminder.id)}
                    title={reminder.completed ? 'Mark incomplete' : 'Mark complete'}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${reminder.completed ? 'bg-[#74C69D] dark:bg-[#74C69D] text-white dark:text-[#081C15]' : 'bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 text-transparent hover:border-[#74C69D] hover:text-[#74C69D]'}`}
                  >
                    <Check size={20} />
                  </button>
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        reminder.category === 'Planting' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        reminder.category === 'Watering' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      }`}>
                        {reminder.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> Due: {reminder.date}
                      </span>
                    </div>
                    <h3 className={`text-lg font-black text-slate-800 dark:text-white ${reminder.completed ? 'line-through' : ''}`}>{reminder.title}</h3>
                  </div>
                  <button 
                    onClick={() => deleteReminder(reminder.id)}
                    title="Delete reminder"
                    className="p-2 text-slate-200 dark:text-slate-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </GlassCard>
              ))}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Recent Activity</h2>
              <Button variant="danger" onClick={() => setHistory([])} className="!px-4 !py-2 text-xs">
                Clear All
              </Button>
            </div>
            <div className="grid gap-6">
              {history.map((item) => (
                <GlassCard 
                  key={item.id} 
                  className="flex items-center gap-6 group hover:border-[#1B4332]/30 dark:hover:border-[#74C69D]/30 dark:bg-slate-900/40"
                  onClick={() => {
                    setActiveTab(item.type === 'planner' ? 'planner' : item.type);
                    if (item.type === 'soil') setSoilResult(item.data);
                    if (item.type === 'crop') setCropResult(item.data);
                    if (item.type === 'planner') setRecommendations(item.data);
                    setImage(item.image || null);
                  }}
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-white/5">
                    {item.image ? (
                      <img src={item.image} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700">
                        <Calendar size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black uppercase text-[#1B4332] dark:text-[#74C69D] bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-md">{item.type}</span>
                      <span className="text-[10px] font-bold text-slate-400">{item.timestamp}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-[#1B4332] dark:group-hover:text-[#74C69D] transition-colors">{item.summary}</h3>
                  </div>
                  <ChevronRight className="text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-all" />
                </GlassCard>
              ))}
              {history.length === 0 && (
                <div className="py-20 text-center text-slate-300 dark:text-slate-700 flex flex-col items-center">
                  <History size={64} className="mb-4 opacity-20" />
                  <p className="font-bold">No history available</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'planner' ? (
          <div className="space-y-10 animate-slide-up">
            <GlassCard className="bg-[#1B4332] dark:bg-[#081C15]/80 p-12 text-white overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">Optimal Planting</h2>
                  <p className="text-green-200/60 dark:text-green-100/60 font-medium">Data-driven crop strategies for your region.</p>
                </div>
                <div className="flex gap-4">
                  <select 
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    title="Select season"
                    aria-label="Select season"
                    className="bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl px-8 py-4 text-sm font-bold focus:ring-2 focus:ring-green-400 outline-none backdrop-blur-xl dark:text-white"
                  >
                    {['Spring', 'Summer', 'Autumn', 'Winter'].map(s => <option key={s} value={s} className="text-slate-800">{s} Season</option>)}
                  </select>
                  <Button variant="secondary" onClick={fetchRecommendations} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <RefreshCcw size={20} />}
                  </Button>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendations.map((crop, i) => (
                <GlassCard key={i} className="flex flex-col bg-white dark:bg-slate-900/40 border-b-8 border-[#74C69D] relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-[#1B4332] dark:text-[#74C69D]">
                      <Sprout size={32} />
                    </div>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      crop.difficulty === 'Easy' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                    }`}>
                      {crop.difficulty}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{crop.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed line-clamp-2 italic">"{crop.suitability}"</p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="pt-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                        <TrendingUp size={14} className="text-green-500" /> {crop.duration}
                      </div>
                      <Info size={18} className="text-slate-200 dark:text-slate-700" />
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full text-xs h-12"
                      onClick={() => addReminder(`Start Planting: ${crop.name}`, 'Planting')}
                    >
                      <Bell size={14} /> Schedule Planting
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Input Section */}
            <div className="lg:col-span-4 space-y-6">
              <GlassCard 
                className={`h-[450px] flex flex-col items-center justify-center cursor-pointer border-4 border-dashed relative overflow-hidden group ${
                  image ? 'border-transparent shadow-2xl' : 'border-slate-200 dark:border-slate-800 hover:border-[#74C69D] bg-white/40 dark:bg-slate-900/40'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-cover" alt="Analysis Sample" />
                    <div className="absolute inset-0 bg-[#1B4332]/60 dark:bg-[#081C15]/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                      <Button variant="secondary">Retake Sample</Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl mx-auto flex items-center justify-center text-[#1B4332] dark:text-[#74C69D] mb-6 animate-pulse">
                      <Camera size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Capture Sample</h3>
                    <p className="text-sm text-slate-400 font-medium">Place your {activeTab} sample in natural light for best results.</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  title="Upload image file"
                  aria-label="Upload sample image"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </GlassCard>

              <Button 
                className="w-full h-20 text-xl shadow-2xl shadow-[#1B4332]/20 dark:shadow-black/40" 
                disabled={!image || loading}
                onClick={() => getGeminiResponse(activeTab as 'soil' | 'crop')}
              >
                {loading ? <Loader2 className="animate-spin" size={28} /> : <Search size={28} />}
                {loading ? 'AI Processing...' : `Initiate Scan`}
              </Button>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-8">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  {[1, 2, 3, 4].map(i => <div key={i} className="bg-white/50 dark:bg-slate-900/50 h-48 rounded-[32px] border border-white dark:border-white/5" />)}
                </div>
              ) : renderAnalysis()}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-6 left-6 right-6 z-[100] md:hidden">
        <div className="glass shadow-2xl rounded-[28px] p-2 flex justify-between items-center border border-white/50 dark:border-white/5">
          {[
            { id: 'soil', icon: Droplets },
            { id: 'crop', icon: Bug },
            { id: 'planner', icon: Map },
            { id: 'advisor', icon: MessageSquare },
            { id: 'reminders', icon: Bell }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative ${
                activeTab === item.id ? 'bg-[#1B4332] dark:bg-[#74C69D] text-white dark:text-[#081C15] shadow-xl' : 'text-slate-400'
              }`}
            >
              <item.icon size={24} />
              {item.id === 'reminders' && reminders.filter(r => !r.completed).length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-orange-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer Stats */}
      <footer className="py-20 px-6 border-t border-slate-100 dark:border-white/5 bg-white/50 dark:bg-[#081C15]/50 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">{APP_NAME} Intelligence</h2>
          </div>
          <div className="flex gap-12 text-center">
            <div>
              <p className="text-3xl font-black text-[#1B4332] dark:text-[#74C69D]">{history.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reports</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#1B4332] dark:text-[#74C69D]">{reminders.filter(r => !r.completed).length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Tasks</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Initialization ---
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
