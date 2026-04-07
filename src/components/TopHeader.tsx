import { useRouter } from "next/navigation";
import { Search, Bell, User, Calendar, Settings, HelpCircle, Grid, Clock, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export default function TopHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userData, setUserData] = useState<{name: string, role: string}>({ name: "", role: "" });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Load user data safely on client
    setUserData({
      name: localStorage.getItem("userName") || "System Admin",
      role: localStorage.getItem("userRole") || "Administrator"
    });

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  if (!mounted) return null;

  return (
    <header className="h-[38px] bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-sm">
      {/* Left: Search & Quick Navigation */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock size={14} className="text-blue-500" />
          <span className="text-[10px] font-black tracking-widest uppercase text-slate-900 border-r border-slate-200 pr-3">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-[10px] font-bold text-slate-500 pl-1 uppercase tracking-tighter">
            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-4 h-full">
        <div className="h-4 w-px bg-slate-100 mx-2"></div>
        
        <div className="flex items-center gap-3 group translate-y-[1px]">
          <div className="flex flex-col items-end leading-none">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                {userData.name}
            </span>
            <span className="text-[8px] font-bold text-blue-500 uppercase tracking-[2px] mt-0.5 opacity-70">
                {userData.role}
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-900 shadow-lg shadow-black/10 flex items-center justify-center text-[10px] font-black text-white ring-2 ring-slate-100 group-hover:scale-105 transition-transform duration-300">
            {userData.name.split(' ').map(n => n[0]).join('') || "SA"}
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="ml-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90 flex items-center gap-2 group/logout"
        >
          <LogOut size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/logout:opacity-100 transition-all">EXIT</span>
        </button>
      </div>
    </header>
  );
}
