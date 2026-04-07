"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  Box, 
  Users, 
  ArrowLeftRight, 
  Layers,
  Menu,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: LayoutDashboard, href: "/", label: "Dashboard", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Settings, href: "/master", label: "Master", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: ArrowLeftRight, href: "/inward", label: "Inward", color: "text-indigo-500", bg: "bg-indigo-50" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar-main h-screen sticky top-0 flex flex-col items-center justify-between pb-8 z-50">
      <div className="flex flex-col items-center w-full gap-8">
        {/* Navigation Icons */}
        <nav className="flex flex-col items-center w-full gap-4">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "p-3 rounded-2xl transition-all duration-300 relative group flex items-center justify-center",
                  isActive 
                    ? cn("bg-white shadow-md shadow-black/5 scale-105", item.color) 
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
                )}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform duration-300", isActive ? "" : "group-hover:scale-110")} />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-10 px-3 py-1.5 bg-slate-900 border border-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 translate-x-[-10px] group-hover:translate-x-0">
                    {item.label}
                </div>
                
                {isActive && (
                    <div className={cn("absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full", item.color.replace('text-', 'bg-'))}>
                    </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Action */}
      <button className="p-3 text-slate-500 hover:text-white transition-colors">
          <Menu size={22} />
      </button>
    </aside>
  );
}
