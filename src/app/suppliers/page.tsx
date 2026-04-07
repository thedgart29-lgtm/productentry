"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Phone, Building2, MoreVertical, Filter, Download, Mail, ExternalLink, ShieldCheck, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: "", contact: "", location: "", reliability: "Premium" });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSuppliers = (suppliers || []).filter((s: any) => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch("/api/suppliers");
    setSuppliers(await res.json());
  }

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/suppliers", {
      method: "POST",
      body: JSON.stringify(newSupplier),
    });
    setNewSupplier({ name: "", contact: "", location: "", reliability: "Premium" });
    setShowAddForm(false);
    fetchData();
  }

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Main Panel: Registry Table */}
      <div className="flex-1 space-y-6">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-8 pb-3">
                <span className="text-sm font-bold text-black border-b-2 border-blue-500 px-1 translate-y-[1px]">Partner Registry</span>
                <span className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors px-1 cursor-pointer">Quality Scorecards</span>
            </div>
            <div className="flex gap-3 pb-3">
                <button 
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary py-1.5 px-4 text-[11px] h-auto shadow-none"
                >
                    <Plus size={14} className="mr-2" /> ADD NEW PARTNER
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
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-black uppercase tracking-tight">Onboard New Partner</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Synchronized Master Database</p>
                        </div>
                    </div>

                    <form onSubmit={handleAddSupplier} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <Field>
                                <Label>Legal Identity / Business Name</Label>
                                <Input required placeholder="e.g. Apex Industries Pvt Ltd" value={newSupplier.name} onChange={(e: any) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <Field>
                                <Label>Contact Reference</Label>
                                <Input placeholder="Email or GST registered phone" value={newSupplier.contact} onChange={(e: any) => setNewSupplier({ ...newSupplier, contact: e.target.value })} />
                            </Field>
                            <Field>
                                <Label>Reliability Class</Label>
                                <Select value={newSupplier.reliability} onChange={(e: any) => setNewSupplier({ ...newSupplier, reliability: e.target.value })}>
                                    <option value="Premium">Premium (Tier 1)</option>
                                    <option value="Verified">Verified (Tier 2)</option>
                                    <option value="Standard">Standard (Tier 3)</option>
                                </Select>
                            </Field>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-slate-50">
                            <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Finalize Onboarding</button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 rounded-lg text-sm font-bold text-slate-400 hover:text-black transition-all">Discard</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Registry Pane */}
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                        className="w-full pl-12 pr-6 py-2.5 rounded-xl bg-white border border-slate-200 outline-none font-medium text-sm text-black placeholder:text-slate-300 focus:border-blue-500 transition-all" 
                        placeholder="Search partners by name or credentials..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
                    <Filter size={14} className="text-slate-500" />
                    ALL PARTNERS
                </div>
            </div>

            <div className="pane bg-white min-h-[500px]">
                <div className="pane-header flex justify-between items-center bg-slate-50/50">
                    <span>Active Partner Network</span>
                    <div className="flex items-center gap-4">
                    <Download size={14} className="text-slate-400 hover:text-blue-500 cursor-pointer" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredSuppliers.length} Verified Entries</span>
                    </div>
                </div>
                
                <table className="w-full">
                    <thead>
                        <tr>
                            <th>Partner Name</th>
                            <th>Credentials</th>
                            <th>Onboard Date</th>
                            <th>Status</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSuppliers.map((s: any) => (
                            <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] uppercase">
                                            {s.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-black text-xs uppercase tracking-tight">{s.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase">
                                        <Mail size={12} className="text-slate-300" />
                                        {s.contact || "Pending Identity"}
                                    </div>
                                </td>
                                <td><span className="text-[10px] font-bold text-slate-400 uppercase">12 MAR 2026</span></td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", s.reliability === 'Premium' ? "bg-green-500" : "bg-blue-500")}></div>
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest", s.reliability === 'Premium' ? "text-green-600" : "text-blue-600")}>
                                            {s.reliability || "Verified"}
                                        </span>
                                    </div>
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end items-center gap-3">
                                        <ExternalLink size={14} className="text-slate-300 hover:text-blue-500 cursor-pointer" />
                                        <MoreVertical size={16} className="text-slate-200 cursor-pointer" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredSuppliers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-20 text-slate-400 font-medium">
                                    No active partners found in registry.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
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
