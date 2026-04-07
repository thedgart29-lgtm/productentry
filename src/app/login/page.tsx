"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [idCode, setIdCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/master?type=employees", { cache: 'no-store' });
      const employees = await res.json();
      
      console.log("Login attempt for:", idCode);
      console.log("Available employees:", employees);

      const user = Array.isArray(employees) && employees.find((e: any) => 
        e.idCode?.trim().toUpperCase() === idCode.trim().toUpperCase() && 
        e.password === password.trim()
      );

      if (user) {
        console.log("Login successful for:", user.name);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userName", user.name);
        localStorage.setItem("userRole", user.designation);
        window.location.href = "/"; // Force a full reload to clear auth state
      } else {
        console.warn("Invalid credentials");
        setError("Invalid Login ID or Password. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white overflow-hidden">
      {/* Left Pane - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F8FAFF] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 w-full max-w-[500px] flex items-center justify-center">
          <img 
            src="/login_person.png" 
            alt="Person at Laptop" 
            className="w-full h-auto drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-[500px] space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Login</h1>
            <p className="text-slate-500 text-sm font-medium">Please enter your credentials to access the system.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
                <div className="relative group">
                    <input 
                        type="text" 
                        value={idCode}
                        onChange={(e) => setIdCode(e.target.value)}
                        placeholder="Login ID"
                        className="w-full !bg-transparent !border-t-0 !border-x-0 !border-b !border-slate-200 py-3 text-sm focus:outline-none !focus:ring-0 focus:border-blue-500 transition-colors placeholder:text-slate-400 font-medium !rounded-none !px-0"
                        required
                    />
                </div>
                <div className="relative group">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full !bg-transparent !border-t-0 !border-x-0 !border-b !border-slate-200 py-3 text-sm focus:outline-none !focus:ring-0 focus:border-blue-500 transition-colors placeholder:text-slate-400 font-medium !rounded-none !px-0 pr-10"
                        required
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-2"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-70 active:scale-[0.98] mt-2"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>
                        Login
                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest pt-4">
            New personnel? <span className="text-blue-500">Contact Administrator to generate ID</span>
          </p>

        </div>
      </div>
      
      {/* Industrial Footer Tag */}
      <div className="absolute bottom-6 right-6 lg:right-16 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] pointer-events-none">
        Industrial Hub Management v1.0
      </div>
    </div>
  );
}
