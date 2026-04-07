"use client";

import { useEffect, useState } from "react";
import { Plus, Package, Hash, Box, X, Search, Filter, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: "", code: "", type: "Plastic", unit: "kg", minStock: 0 });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMaterials = (materials || []).filter((m: any) => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [mRes, eRes] = await Promise.all([
      fetch("/api/materials"),
      fetch("/api/entries")
    ]);
    setMaterials(await mRes.json());
    setEntries(await eRes.json());
  }

  async function handleAddMaterial(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/materials", {
      method: "POST",
      body: JSON.stringify(newMaterial),
    });
    setNewMaterial({ name: "", code: "", type: "Plastic", unit: "kg", minStock: 0 });
    setShowAddForm(false);
    fetchData();
  }

  const getStock = (materialId: string) => {
    return entries
      .filter((e: any) => (e.itemId === materialId && e.itemType === 'material'))
      .reduce((acc: number, e: any) => acc + Number(e.quantity), 0);
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Navigation Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 mb-8">
          <div className="flex gap-8 pb-3">
              <span className="text-sm font-bold text-black border-b-2 border-blue-500 px-1 translate-y-[1px]">Material Registry</span>
              <span className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors px-1 cursor-pointer">Quality Specs</span>
          </div>
          <div className="flex gap-3 pb-3 items-center">
              <div className="relative w-64 mr-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input
                      className="w-full search-input pl-14 pr-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200 outline-none font-medium text-[11px] text-black placeholder:text-slate-300 focus:border-blue-500 transition-all focus:bg-white"
                      placeholder="Filter materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <button 
                onClick={() => setShowAddForm(true)}
                className="btn-primary py-1.5 px-4 text-[11px] h-auto shadow-none"
              >
                  <Plus size={14} className="mr-2" /> ADD MATERIAL
              </button>
          </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="pane p-8 bg-white border-blue-200 shadow-2xl w-full max-w-4xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 relative">
                <button 
                    onClick={() => setShowAddForm(false)}
                    className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-black transition-all"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-50">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <Package size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-black uppercase tracking-tight">Onboard New Material</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Synchronized Master Database</p>
                    </div>
                </div>

                <form onSubmit={handleAddMaterial} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <Field>
                            <Label>Material Identity</Label>
                            <Input required placeholder="e.g. Polypropylene pellets" value={newMaterial.name} onChange={(e: any) => setNewMaterial({ ...newMaterial, name: e.target.value })} />
                        </Field>
                        <Field>
                            <Label>Master Code</Label>
                            <Input required placeholder="PP01" className="uppercase font-bold tracking-widest text-blue-600" value={newMaterial.code} onChange={(e: any) => setNewMaterial({ ...newMaterial, code: e.target.value })} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <Field>
                            <Label>Category</Label>
                            <Select value={newMaterial.type} onChange={(e: any) => setNewMaterial({ ...newMaterial, type: e.target.value })}>
                                <option value="Plastic">Plastic</option>
                                <option value="Metal">Metal</option>
                                <option value="Ink">Ink</option>
                                <option value="Other">Other</option>
                            </Select>
                        </Field>
                        <Field>
                            <Label>Base Unit</Label>
                            <Select value={newMaterial.unit} onChange={(e: any) => setNewMaterial({ ...newMaterial, unit: e.target.value })}>
                                <option value="kg">Kilograms (kg)</option>
                                <option value="liters">Liters (L)</option>
                                <option value="pcs">Pieces (pcs)</option>
                            </Select>
                        </Field>
                        <Field>
                            <Label>Min. Stock Lvl</Label>
                            <Input type="number" value={newMaterial.minStock} onChange={(e: any) => setNewMaterial({ ...newMaterial, minStock: Number(e.target.value) })} />
                        </Field>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-slate-50">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Register Material</button>
                        <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 rounded-lg text-sm font-bold text-slate-400 hover:text-black transition-all">Discard</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {filteredMaterials.map((m: any) => {
          const stock = getStock(m.id);
          const isLow = stock < (m.minStock || 50);
          
          return (
            <div key={m.id} className="premium-card p-6 flex flex-col bg-white overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all",
                  isLow ? "bg-red-50 text-red-500 shadow-red-100" : "bg-blue-50 text-blue-500 shadow-blue-100"
                )}>
                  <Box className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{m.code}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{m.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{m.type}</p>

              <div className="mt-auto space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                    <div className="flex items-baseline gap-2">
                        <span className={cn("text-3xl font-black tracking-tighter", isLow ? "text-red-600" : "text-slate-900")}>
                            {stock}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase">{m.unit}</span>
                    </div>
                  </div>
                  {isLow ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black tracking-widest animate-pulse">
                        <ArrowDownRight size={12} /> CRITICAL
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black tracking-widest">
                        <ArrowUpRight size={12} /> OPTIMAL
                    </div>
                  )}
                </div>
                
                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                        className={cn("h-full transition-all duration-1000", isLow ? "bg-red-500" : "bg-blue-500")}
                        style={{ width: `${Math.min((stock / ((m.minStock || 100) * 2)) * 100, 100)}%` }}
                    />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ children, className }: any) {
    return <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>;
}

function Label({ children, className }: any) {
    return <label className={cn("text-[10px] font-bold uppercase tracking-tight text-slate-400 ml-1.5", className)}>{children}</label>;
}

function Input({ className, ...props }: any) {
    return <input className={cn("w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 outline-none font-medium text-sm text-black focus:border-blue-500 transition-all placeholder:text-slate-300", className)} {...props} />;
}

function Select({ children, className, ...props }: any) {
    return <select className={cn("w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 outline-none font-bold text-sm text-black focus:border-blue-500 transition-all cursor-pointer", className)} {...props}>{children}</select>;
}
