"use client";

import { useEffect, useState } from "react";
import { Search, QrCode, Calendar, Package, Layers, Info, History, ShieldCheck, Download, MoreVertical, ExternalLink, ChevronRight, Activity } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

export default function BatchesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [eRes, mRes, pRes] = await Promise.all([
      fetch("/api/entries"),
      fetch("/api/materials"),
      fetch("/api/parts")
    ]);
    setEntries(await eRes.json());
    setMaterials(await mRes.json());
    setParts(await pRes.json());
  }

  const batchList = Array.from(new Set(entries.filter(e => e.batchCode).map(e => e.batchCode)));
  
  const filteredBatches = searchTerm 
    ? batchList.filter(b => b.toLowerCase().includes(searchTerm.toLowerCase()))
    : batchList;

  const getBatchDetails = (code: string) => {
    const components = entries.filter(e => e.batchCode === code);
    const first = components[0];
    return {
      date: first?.date,
      components: components.map(c => ({
        ...c,
        name: c.itemType === 'material' 
          ? materials.find(m => m.id === c.itemId)?.name 
          : parts.find(p => p.id === c.itemId)?.name
      }))
    };
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Main Panel: Traceability Hub */}
      <div className="flex-1 space-y-6">
        
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-8 pb-3">
                <span className="text-sm font-bold text-black border-b-2 border-blue-500 px-1 translate-y-[1px]">Batch Genealogy</span>
                <span className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors px-1 cursor-pointer">Compliance Logs</span>
            </div>
            <div className="flex gap-3 pb-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg cursor-pointer">
                    <Download size={12} /> EXPORT ANALYTICS
                </div>
            </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input 
                type="text" 
                placeholder="Search by Batch Identity or Component Code..."
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:border-blue-500 font-bold text-lg text-black placeholder:text-slate-300 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Batch List */}
        <div className="grid grid-cols-1 gap-6">
            {filteredBatches.map(code => {
                const details = getBatchDetails(code);
                return (
                    <div key={code} className="pane bg-white p-0 overflow-hidden border-slate-100 hover:border-blue-200 transition-all group">
                        <div className="bg-slate-50/50 p-6 flex justify-between items-center border-b border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                    <QrCode size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-black tracking-widest uppercase">{code}</h3>
                                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                        <Calendar size={12} />
                                        {formatDate(details.date)}
                                        <span className="text-slate-200 mx-1">•</span>
                                        <ShieldCheck size={12} className="text-green-500" />
                                        Verified
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Components</p>
                                    <p className="text-sm font-black text-black">{details.components.length} Items</p>
                                </div>
                                <div className="w-px h-8 bg-slate-200"></div>
                                <button className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm">
                                    <ExternalLink size={16} className="text-slate-300 hover:text-blue-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="col-span-1 lg:col-span-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Layers size={14} className="text-blue-500" /> Bill of Materials Flow
                                </h4>
                                <div className="space-y-2">
                                    {details.components.map((c, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                <div>
                                                    <p className="text-xs font-bold text-black uppercase">{c.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{c.itemType}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-red-600">-{Math.abs(Number(c.quantity))}</p>
                                                <p className="text-[8px] text-slate-300 font-bold uppercase">UNITS</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-1 lg:col-span-2 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info size={14} className="text-blue-500" /> Compliance Metadata
                                </h4>
                                <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-dashed border-slate-200">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">Sync Status</span>
                                        <span className="text-green-600 font-black uppercase">Active</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-tight">Net Consumption</span>
                                        <span className="text-black font-black uppercase">{Math.abs(details.components.reduce((acc, c) => acc + Number(c.quantity), 0))} Units</span>
                                    </div>
                                    <div className="h-px bg-slate-200"></div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold italic">
                                        End-of-line verification completed by automated protocol. No discrepancies detected in genealogy map.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {filteredBatches.length === 0 && (
                <div className="py-24 text-center pane bg-slate-50 border-dashed border-slate-200">
                    <Search className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                    <p className="text-lg font-bold text-slate-400">No batch records match your criteria.</p>
                    <p className="text-slate-300 mt-1 text-sm font-medium">Verify your search identity or check the Master Registry.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

