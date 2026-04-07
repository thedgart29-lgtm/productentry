"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Box, Search, Bell, User, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Treatment Dynamics", href: "/" },
  { icon: Settings, label: "Master Settings", href: "/master" },
  { icon: Box, label: "Inward Entry", href: "/inward" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto glass p-3 rounded-2xl border-white/40 shadow-sm">
        
        {/* Brand Section */}
        <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <Box size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-black tracking-tight">Stock IQ</h1>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  isActive 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-black"
                )}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Account Section */}
        <div className="flex items-center gap-3 px-2">
            <button className="p-2 text-slate-400 hover:text-black transition-colors">
                <Search size={18} />
            </button>
            <button className="p-2 text-slate-400 hover:text-black transition-colors relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 cursor-pointer overflow-hidden">
                <User size={18} className="text-slate-600" />
            </div>
        </div>

      </div>
    </header>
  );
}

