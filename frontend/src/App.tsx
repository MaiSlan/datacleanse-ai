import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileSpreadsheet, Upload, Sparkles, CheckCircle, AlertCircle,
  X, Download, Zap, Shield, BarChart3, ArrowRight
} from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './Auth';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [session, setSession] = useState<any>(null);

  const fetchCredits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/credits`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchCredits();
    }
  }, [session]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped);
      setUploadState('idle');
    } else {
      triggerError('Please upload a valid CSV file.');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setUploadState('idle');
    } else if (selected) {
      triggerError('Please upload a valid CSV file.');
    }
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setShowError(true);
    setTimeout(() => setShowError(false), 5000);
  };

  const handleClean = async () => {
    if (!file) return;
    setUploadState('uploading');

    const formData = new FormData();
    formData.append('file', file);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.csv', '_cleaned.csv');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setUploadState('success');
      fetchCredits();
    } catch (err) {
      setUploadState('error');
      const isNetworkError =
        err instanceof TypeError && err.message.toLowerCase().includes('fetch');
      triggerError(
        isNetworkError
          ? 'Unable to reach the server. Please ensure the backend is running at localhost:8000.'
          : `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleBuyCredits = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to connect to the payment server. Is the backend running?');
    }
  };

  const resetFile = () => {
    setFile(null);
    setUploadState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!session) {
    return <Auth />;
  }

  const features = [
    {
      icon: <Zap size={20} />,
      title: 'Instant Processing',
      desc: 'Clean thousands of rows in seconds using AI-powered formatting rules.',
    },
    {
      icon: <Shield size={20} />,
      title: 'Privacy First',
      desc: 'Files are processed locally and never stored on our servers.',
    },
    {
      icon: <BarChart3 size={20} />,
      title: 'Smart Standardization',
      desc: 'Detects dates, phone numbers, emails and formats them consistently.',
    },
  ];

  // ALL VISUALS GO INSIDE THE RETURN STATEMENT
  return (
    <div className="min-h-screen bg-[#080d1a] text-white font-sans">
      {/* Error Toast */}
      <div
        className={`fixed top-5 right-5 z-50 transition-all duration-300 ${
          showError
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-start gap-3 bg-red-950 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl shadow-2xl max-w-sm">
          <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <span className="text-sm leading-snug">{errorMessage}</span>
          <button
            onClick={() => setShowError(false)}
            className="ml-auto text-red-400 hover:text-red-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="border-b border-white/5 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-1.5 rounded-lg">
              <Sparkles size={18} className="text-cyan-400" />
            </div>
            <span className="font-semibold tracking-tight">DataCleanse AI</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            
            {/* NEW WALLET DISPLAY */}
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-slate-200 font-medium">
                {credits !== null ? `${credits} Credits` : 'Loading...'}
              </span>
            </div>

            <button
              onClick={handleBuyCredits}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors text-sm"
            >
              Buy 10 Credits ($5)
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium px-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Sparkles size={12} />
          AI-Powered CSV Cleaning
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          Turn Messy CSV Files Into{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500">
            Clean, Structured Data
          </span>
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          Upload your CSV and DataCleanse AI will instantly format, deduplicate,
          standardize columns, and fix inconsistencies — so your data is ready
          for analysis.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href="#upload"
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-[#080d1a] font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Clean My CSV <ArrowRight size={16} />
          </a>
          <a
            href="#features"
            className="flex items-center gap-2 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white px-6 py-3 rounded-xl transition-colors"
          >
            See How It Works
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
          {[
            ['10M+', 'Rows Cleaned'],
            ['99.9%', 'Uptime'],
            ['<2s', 'Avg. Process Time'],
          ].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-white">{val}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider glow */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </div>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Everything you need for clean data
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base">
            Stop wasting hours manually fixing spreadsheets. Let AI handle it in
            seconds.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-cyan-500/20 transition-colors group"
            >
              <div className="bg-cyan-500/10 text-cyan-400 w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upload */}
      <section id="upload" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Upload Your CSV
          </h2>
          <p className="text-slate-400">
            Drag and drop your file below or click to browse.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-14 text-center transition-all duration-200 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                : file
                ? 'border-cyan-500/40 bg-cyan-500/5 cursor-default'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />

            {file ? (
              <div className="space-y-4">
                <div className="bg-cyan-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                  <FileSpreadsheet size={30} className="text-cyan-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{file.name}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetFile();
                  }}
                  className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 mx-auto transition-colors"
                >
                  <X size={12} /> Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                  <Upload size={28} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-base">
                    Drop your CSV file here
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    or click to browse — CSV files only
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Area */}
          {file && (
            <div className="mt-6 space-y-4">
              {uploadState !== 'success' && (
                <button
                  onClick={handleClean}
                  disabled={uploadState === 'uploading'}
                  className="w-full flex items-center justify-center gap-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-800 disabled:text-cyan-300 disabled:cursor-not-allowed text-[#080d1a] font-semibold py-4 rounded-xl transition-colors text-base"
                >
                  {uploadState === 'uploading' ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Cleaning your data...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Clean My Data
                    </>
                  )}
                </button>
              )}

              {uploadState === 'success' && (
                <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-5 flex items-start gap-4">
                  <div className="bg-emerald-500/10 p-2 rounded-lg shrink-0">
                    <CheckCircle size={22} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-emerald-300 font-semibold">
                      Data cleaned successfully!
                    </p>
                    <p className="text-emerald-400/70 text-sm mt-0.5">
                      Your cleaned CSV has been downloaded automatically.
                    </p>
                  </div>
                  <button
                    onClick={resetFile}
                    className="text-xs text-emerald-400/60 hover:text-emerald-300 flex items-center gap-1 transition-colors mt-0.5 shrink-0"
                  >
                    <Download size={12} /> Clean another
                  </button>
                </div>
              )}

              {uploadState === 'error' && (
                <button
                  onClick={handleClean}
                  className="w-full flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-400/50 text-red-400 hover:text-red-300 hover:bg-red-500/5 py-3 rounded-xl transition-colors text-sm"
                >
                  Retry Upload
                </button>
              )}
            </div>
          )}

          <p className="text-center text-slate-600 text-xs mt-6">
            Files are processed securely and never stored. Max file size: 50 MB.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Sparkles size={14} className="text-cyan-500/60" />
            <span>DataCleanse AI</span>
          </div>
          <p className="text-slate-600 text-xs">
            Built for data teams who move fast.
          </p>
        </div>
      </footer>
    </div>
  );
}