"use client";

import { useEffect, useState } from "react";
import { 
  Package, 
  Box, 
  TrendingUp, 
  History, 
  PenTool, 
  Users, 
  QrCode, 
  ArrowRight, 
  User, 
  Plus, 
  MoveUpRight, 
  MoreVertical, 
  CheckCircle2, 
  Mail, 
  Phone,
  ArrowUpRight,
  Filter,
  Calendar,
  Layers,
  Printer,
  Download,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Dashboard() {
  const [data, setData] = useState<any>({ materials: [], products: [], inwards: [], suppliers: [] });
  const [activeTab, setActiveTab] = useState("criticality");
  const [viewMode, setViewMode] = useState<"production" | "purchase">("production");
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    async function fetchData() {
      const [mRes, iRes] = await Promise.all([
        fetch("/api/master"),
        fetch("/api/inward")
      ]);
      const master = await mRes.json();
      const inwards = await iRes.json();
      setData({ ...master, inwards });
    }
    fetchData();
  }, []);

  const getMaterialStock = (m: any) => {
    if (!m || !m.inwardEntries) return "0.00";
    const inward = m.inwardEntries.reduce((acc: number, e: any) => acc + (e.quantity || 0), 0);
    const consumed = (data.inwards || []).filter((i: any) => i.materialId === m.id).reduce((acc: number, i: any) => acc + (i.materialQuantity || 0), 0);
    return (inward - consumed).toFixed(2);
  };

  const totalProductPcs = (data.inwards || []).reduce((acc: number, i: any) => acc + (i.pcs || 0), 0);
  
  // Shift Performance Calculations: Syncing with latest active data
  const allInwards = data.inwards || [];
  const latestDate = allInwards.length > 0 
    ? [...new Set(allInwards.map((i: any) => i.date))].sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())[0]
    : "2026-03-22";

  const todayInwards = allInwards.filter((i: any) => i.date === latestDate);
  const todayYield = todayInwards.reduce((acc: number, i: any) => acc + (i.pcs || 0), 0);
  const activeBatchesCount = new Set(todayInwards.map((i: any) => i.batchNumber)).size;
  const dynamicEfficiency = todayYield > 0 ? Math.min(99.2, (todayYield / 8500) * 100).toFixed(1) : "0.0";

  const isSystemHealthy = (data.materials || []).every((m: any) => {
    const stock = parseFloat(getMaterialStock(m));
    return !m.threshold || stock > m.threshold;
  });

  // Monthly Aggregation Logic: 12-Month Annual View
  const getMonthlyStats = () => {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const stats: any = {};
    
    // Generate all 12 months for 2026
    const monthsToShow = months.map((_, i) => `2026-${(i + 1).toString().padStart(2, '0')}`);
    
    monthsToShow.forEach(m => stats[m] = { production: 0, purchase: 0 });

    (data.inwards || []).forEach((i: any) => {
      const monthKey = i.date.substring(0, 7); 
      if (stats[monthKey]) stats[monthKey].production += i.pcs;
    });

    (data.materials || []).forEach((m: any) => {
      (m.inwardEntries || []).forEach((e: any) => {
        const monthKey = e.date.substring(0, 7);
        if (stats[monthKey]) stats[monthKey].purchase += e.quantity;
      });
    });

    return monthsToShow.map(m => ({
      month: months[parseInt(m.split("-")[1]) - 1],
      value: viewMode === "production" ? stats[m].production : stats[m].purchase,
      production: stats[m].production,
      purchase: stats[m].purchase
    }));
  };

  const monthlyStats = getMonthlyStats();
  const maxVal = Math.max(...monthlyStats.map(s => s.value), 1);

  return (
    <div className="flex gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Main Panel: Content & Tables */}
      <div className="flex-1 space-y-6">
        
        {/* Navigation Toolbar: Premium Shift Performance Scorecard */}
        <div className="flex items-center justify-between">
            <div className="flex gap-6 py-2 px-4 bg-slate-50/80 border border-slate-200/60 rounded-xl shadow-sm">
                <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none text-blue-500">Yield Today</span>
                    <span className="text-sm font-bold text-black font-mono leading-none mt-2">{todayYield.toLocaleString()} <span className="text-[8px] text-slate-400 font-sans">PCS</span></span>
                </div>
                <div className="w-px h-6 bg-slate-200 self-center"></div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Cycles</span>
                    <span className="text-sm font-bold text-blue-600 font-mono leading-none mt-2">{activeBatchesCount} <span className="text-[8px] text-blue-400 font-sans uppercase tracking-tighter">Batches</span></span>
                </div>
                <div className="w-px h-6 bg-slate-200 self-center"></div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Efficiency</span>
                    <span className="text-sm font-bold text-green-600 font-mono leading-none mt-2">{dynamicEfficiency}%</span>
                </div>
                <div className="w-px h-6 bg-slate-200 self-center"></div>
                <div className="flex items-center gap-2 mt-1 px-1">
                    <div className={cn("w-2 h-2 rounded-full relative", isSystemHealthy ? "bg-green-500" : "bg-red-500")}>
                        <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", isSystemHealthy ? "bg-green-400" : "bg-red-400")}></div>
                    </div>
                    <span className="text-[9px] font-black text-black uppercase tracking-widest">Health: {isSystemHealthy ? "Stable" : "Critical"}</span>
                </div>
            </div>
            <div className="flex gap-3 px-2 items-center">
                {isFilterOpen && (
                    <input 
                        type="text" 
                        placeholder="Search Batch / Product..." 
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="text-[10px] font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 animate-in slide-in-from-right-2"
                        autoFocus
                    />
                )}
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={cn("flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-lg transition-all shadow-sm border", isFilterOpen ? "bg-blue-50 border-blue-200 text-blue-600" : "text-slate-500 bg-white border-slate-200 hover:bg-slate-50")}
                >
                    <Filter size={14} className={cn("transition-colors", isFilterOpen ? "text-blue-600" : "text-slate-500")} /> FILTER
                </button>
                <div className="relative group/month">
                    <button className="flex items-center gap-2 text-[10px] font-bold text-white bg-slate-900 px-3 py-2 rounded-lg shadow-sm hover:bg-slate-800 transition-colors">
                        <Calendar size={14} /> {new Date(selectedMonth).toLocaleString('default', { month: 'long' }).toUpperCase()} 2026
                    </button>
                    <div className="absolute top-full mt-1 right-0 w-32 bg-white border border-slate-100 rounded-xl shadow-xl opacity-0 invisible group-hover/month:opacity-100 group-hover/month:visible transition-all z-50 p-1">
                        {["2026-01", "2026-02", "2026-03"].map(m => (
                            <button 
                                key={m}
                                onClick={() => setSelectedMonth(m)}
                                className={cn("w-full text-left px-3 py-2 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors uppercase", selectedMonth === m ? "text-blue-600 bg-blue-50" : "text-slate-500")}
                            >
                                {new Date(m).toLocaleString('default', { month: 'short' })} 2026
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Content Panes */}
        <div className="grid grid-cols-1 gap-6">
            
            {/* Top Metrics Row: Material-wise Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {(data.materials || []).map((m: any) => {
                    const stock = getMaterialStock(m);
                    const isLow = m.threshold && parseFloat(stock) <= m.threshold;
                    return (
                        <MetricCard 
                            key={m.id}
                            label={m.name}
                            value={stock}
                            unit={m.unit}
                            color={isLow ? "text-red-500 font-black px-1" : "text-black"}
                            icon={isLow ? <AlertCircle size={20} className="text-red-500 animate-pulse" /> : <Package size={20} />}
                        />
                    );
                })}
            </div>

            {/* Main Data Pane */}
            <div className="pane bg-white min-h-[500px]">
                <div className="pane-header flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <History size={16} className="text-blue-500" />
                        <span>Live Production Registry</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
                
                <table className="w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="border-r border-slate-100 text-left">Production Date</th>
                            <th className="border-r border-slate-100 text-left">Code</th>
                            <th className="border-r border-slate-100 text-left">Batch Reference</th>
                            <th className="border-r border-slate-100 text-left">Material ID</th>
                            <th className="border-r border-slate-100 text-left">Consumed</th>
                            <th className="border-r border-slate-100 text-left">Yield Outcome</th>
                            <th className="text-left">Coordinator</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data.inwards || [])
                            .filter((i: any) => i.date.startsWith(selectedMonth))
                            .filter((i: any) => {
                                if (!filterText) return true;
                                const product = data.products.find((p: any) => p.id === i.productId);
                                return i.batchCode.toLowerCase().includes(filterText.toLowerCase()) || 
                                       product?.code.toLowerCase().includes(filterText.toLowerCase());
                            })
                            .reverse().map((i: any) => {
                            const material = data.materials.find((m: any) => m.id === i.materialId);
                            const product = data.products.find((p: any) => p.id === i.productId);
                            const coordinator = (data.employees || []).find((e: any) => e.id === i.coordinatorId);
                            return (
                                <tr key={i.id} className="group">
                                    <td className="font-bold text-slate-900 border-r border-slate-50 text-left">{new Date(i.date).toLocaleDateString()}</td>
                                    <td className="text-blue-600 font-bold border-r border-slate-50 text-left">{product?.code || "FG-PEN"}</td>
                                    <td className="border-r border-slate-50 text-left font-mono text-[11px]">{i.batchCode}</td>
                                    <td className="border-r border-slate-50 text-left text-[11px] font-bold text-slate-500 uppercase">{material?.code || "RM-MAT"}</td>
                                    <td className="font-bold border-r border-slate-50 text-left text-red-500">-{i.materialQuantity?.toFixed(2) || "0.00"} KG</td>
                                    <td className="font-bold border-r border-slate-50 text-left text-blue-600">+{i.pcs?.toLocaleString() || "0"} PCS</td>
                                    <td className="text-left">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {coordinator?.name?.split(' ').map((n:any) => n[0]).join('') || "SA"}
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{coordinator?.name || "System Admin"}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Bottom Row: Monthly Performance Analytics */}
            <div className="grid grid-cols-1 gap-6">
                <div className="pane bg-white p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6">
                        <h3 className="text-sm font-bold text-black uppercase tracking-widest">Monthly Performance Analytics</h3>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => setViewMode("production")}
                                className={cn("px-4 py-1.5 text-[10px] font-bold rounded-md transition-all", viewMode === "production" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                            >
                                PRODUCTION YIELD
                            </button>
                            <button 
                                onClick={() => setViewMode("purchase")}
                                className={cn("px-4 py-1.5 text-[10px] font-bold rounded-md transition-all", viewMode === "purchase" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                            >
                                MATERIAL PURCHASES
                            </button>
                        </div>
                    </div>
                    <div className="h-56 w-full flex items-end gap-2 px-2 relative border-b border-slate-100 pb-10">
                        {monthlyStats.map((s, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                                <div className="w-full bg-slate-50/50 rounded-t-lg relative overflow-hidden transition-all duration-500 group-hover:bg-slate-100" style={{ height: `${s.value > 0 ? (s.value / maxVal) * 85 : 2}%` }}>
                                    <div className={cn("absolute bottom-0 w-full transition-all duration-700 delay-100", viewMode === "production" ? "bg-blue-600" : "bg-emerald-600")} style={{ height: `100%` }}></div>
                                    {s.value > 0 && (
                                        <div className="absolute top-2 w-full text-center text-[8px] font-black text-white px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {s.value >= 1000 ? (s.value/1000).toFixed(1) + 'k' : s.value}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-center mt-2">
                                    <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase">{s.month}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Monthly Peak</span>
                            <span className="text-lg font-black text-black font-mono">{maxVal.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase font-sans">{viewMode === "production" ? "PCS" : "KG"}</span></span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-sm", viewMode === "production" ? "bg-blue-500" : "bg-emerald-500")}></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Total {viewMode === "production" ? "Units Output" : "Inward Stock"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="text-[10px] font-bold text-slate-400 italic">Last Updated: {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center justify-between text-[11px] py-1">
            <span className="text-slate-400 font-medium uppercase tracking-tighter">{label}</span>
            <span className="text-black font-bold">{value}</span>
        </div>
    )
}

function MetricCard({ label, value, unit, color, icon }: any) {
    return (
        <div className="pane p-5 bg-white flex items-center justify-between group hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                    <p className={cn("text-2xl font-black font-mono tracking-tight", color)}>{value}</p>
                    {unit && <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">{unit}</span>}
                </div>
             </div>
             <div className="text-slate-100 group-hover:text-blue-500 transition-colors duration-300">
                 {icon}
             </div>
        </div>
    )
}

function Tab({ text, active, onClick }: { text: string, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "pb-2 text-sm font-bold transition-all border-b-2 decoration-2 px-1 translate-y-[1px]",
                active 
                    ? "text-black border-blue-500" 
                    : "text-slate-400 border-transparent hover:text-slate-600"
            )}
        >
            {text}
        </button>
    )
}

function ChevronRight({ size, className }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
    )
}

function MetricTrend({ value }: { value: string }) {
    return (
        <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
            <ArrowUpRight size={10} /> {value}
        </div>
    )
}


