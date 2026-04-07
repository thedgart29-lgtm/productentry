"use client";

import { useEffect, useState } from "react";
import { History, Plus, Calendar, Hash, NotebookPen, Users, Box, Package, QrCode, PenTool, Filter, Download, MoreVertical, TrendingDown, TrendingUp, Search, Info, X, Maximize2, Minimize2 } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

export default function EntriesPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState({
      date: "",
      batchCode: "",
      itemName: "",
      type: "",
      magnitude: "",
      source: ""
  });
  const [isAutoLayout, setIsAutoLayout] = useState(false);
  const [columnOverrides, setColumnOverrides] = useState<Set<string>>(new Set());

  // Load/Save layout settings
  useEffect(() => {
    const savedLayout = localStorage.getItem("tableLayout_entries");
    if (savedLayout) {
        const { isAuto, overrides } = JSON.parse(savedLayout);
        setIsAutoLayout(isAuto);
        setColumnOverrides(new Set(overrides));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tableLayout_entries", JSON.stringify({
        isAuto: isAutoLayout,
        overrides: Array.from(columnOverrides)
    }));
  }, [isAutoLayout, columnOverrides]);

  const toggleColumnOverride = (key: string) => {
    setColumnOverrides(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
    });
  };

  const getWidthClass = (key: string, defaultClass: string) => {
    if (isAutoLayout || columnOverrides.has(key)) return "";
    return defaultClass;
  };
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    itemType: "material", // material | part
    type: "arrival", // arrival | production
    itemId: "",
    supplierId: "",
    productId: "",
    variationId: "",
    baseMaterialId: "", // For batch code generation
    quantity: "",
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [mRes, eRes, pRes, sRes, prRes] = await Promise.all([
      fetch("/api/materials"),
      fetch("/api/entries"),
      fetch("/api/parts"),
      fetch("/api/suppliers"),
      fetch("/api/products")
    ]);
    
    const mData = await mRes.json();
    const eData = await eRes.json();
    const paData = await pRes.json();
    const sData = await sRes.json();
    const prData = await prRes.json();
    
    setMaterials(mData);
    setEntries(eData.reverse());
    setParts(paData);
    setSuppliers(sData);
    setProducts(prData);
    
    if (mData.length > 0 && !newEntry.itemId) {
      setNewEntry(prev => ({ ...prev, itemId: mData[0].id }));
    }
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    
    if (newEntry.type === "arrival") {
      await fetch("/api/entries", {
        method: "POST",
        body: JSON.stringify({
          itemId: newEntry.itemId,
          itemType: newEntry.itemType,
          supplierId: newEntry.supplierId,
          quantity: newEntry.quantity,
          date: newEntry.date,
          type: "arrival",
          notes: newEntry.notes
        }),
      });
    } else if (newEntry.type === "production") {
      const product = products.find(p => p.id === newEntry.productId);
      const variation = product?.variations.find((v:any) => v.id === newEntry.variationId);
      const baseMaterial = materials.find(m => m.id === newEntry.baseMaterialId);
      
      if (!product || !variation || !baseMaterial) return alert("Missing production details");

      const batchCode = `${baseMaterial.code}-${product.code}-${variation.code}-${new Date().getTime().toString().slice(-4)}`.toUpperCase();

      for (const m of product.materials) {
        await fetch("/api/entries", {
          method: "POST",
          body: JSON.stringify({
            itemId: m.materialId,
            itemType: 'material',
            quantity: -Number(m.quantity) * Number(newEntry.quantity),
            date: newEntry.date,
            type: "production",
            batchCode,
            notes: `Used for ${newEntry.quantity}x ${product.name} (${variation.name})`
          }),
        });
      }

      if (product.parts) {
        for (const pt of product.parts) {
            await fetch("/api/entries", {
              method: "POST",
              body: JSON.stringify({
                itemId: pt.partId,
                itemType: 'part',
                quantity: -Number(pt.quantity) * Number(newEntry.quantity),
                date: newEntry.date,
                type: "production",
                batchCode,
                notes: `Used for ${newEntry.quantity}x ${product.name} (${variation.name})`
              }),
            });
          }
      }
    }
    setShowAddForm(false);
    fetchData();
  }

  const getItemName = (id: string, type: 'material' | 'part') => {
    if (type === 'material') return materials.find(m => m.id === id)?.name || "Unknown";
    return parts.find(p => p.id === id)?.name || "Unknown";
  };

  const filteredEntries = entries.filter((entry: any) => {
    const itemName = getItemName(entry.itemId, entry.itemType);
    const supplierName = entry.supplierId ? suppliers.find(s => s.id === entry.supplierId)?.name || "" : "Internal Transfer";
    
    const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (entry.batchCode || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                         entry.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = formatDate(entry.date).toLowerCase().includes(columnFilters.date.toLowerCase());
    const matchesBatch = (entry.batchCode || "").toLowerCase().includes(columnFilters.batchCode.toLowerCase());
    const matchesItem = itemName.toLowerCase().includes(columnFilters.itemName.toLowerCase());
    const matchesType = entry.type?.toLowerCase().includes(columnFilters.type.toLowerCase());
    const matchesMagnitude = entry.quantity.toString().includes(columnFilters.magnitude);
    const matchesSource = supplierName.toLowerCase().includes(columnFilters.source.toLowerCase());

    return matchesSearch && matchesDate && matchesBatch && matchesItem && matchesType && matchesMagnitude && matchesSource;
  });

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Main Panel: Stock Ledger */}
      <div className="flex-1 space-y-6">
        
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex gap-8 pb-3">
                <span className="text-sm font-bold text-black border-b-2 border-blue-500 px-1 translate-y-[1px]">Stock Journal</span>
                <span className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors px-1 cursor-pointer">Discrepancy Log</span>
            </div>
            <div className="flex gap-3 pb-3">
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="btn-primary py-1.5 px-4 text-[11px] h-auto shadow-none"
                >
                    <Plus size={14} className="mr-2" /> CREATE ENTRY
                </button>
            </div>
        </div>

        {showAddForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="pane p-8 bg-white border-blue-200 shadow-2xl w-full max-w-6xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 relative">
                    <button 
                        onClick={() => setShowAddForm(false)}
                        className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-black transition-all"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                <History size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-black uppercase tracking-tight">Record Movement Event</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Synchronized Journal Entry</p>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                            <button 
                                onClick={() => setNewEntry({ ...newEntry, type: 'arrival' })}
                                className={cn("px-6 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all", newEntry.type === 'arrival' ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black")}
                            >ARRIVAL</button>
                            <button 
                                onClick={() => setNewEntry({ ...newEntry, type: 'production' })}
                                className={cn("px-6 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all", newEntry.type === 'production' ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-black")}
                            >PRODUCTION</button>
                        </div>
                    </div>

                    <form onSubmit={handleAddEntry} className="space-y-8">
                        {newEntry.type === 'arrival' ? (
                            <div className="grid grid-cols-4 gap-6">
                                <Field>
                                    <Label>Item Category</Label>
                                    <Select value={newEntry.itemType} onChange={(e: any) => setNewEntry({ ...newEntry, itemType: e.target.value as any })}>
                                        <option value="material">Raw Material</option>
                                        <option value="part">Component / Part</option>
                                    </Select>
                                </Field>
                                <Field>
                                    <Label>Identity</Label>
                                    <Select value={newEntry.itemId} onChange={(e: any) => setNewEntry({ ...newEntry, itemId: e.target.value })}>
                                        {newEntry.itemType === 'material' ? materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>) : parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                    </Select>
                                </Field>
                                <Field>
                                    <Label>Source Partner</Label>
                                    <Select value={newEntry.supplierId} onChange={(e: any) => setNewEntry({ ...newEntry, supplierId: e.target.value })}>
                                        <option value="">Direct / Self</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </Select>
                                </Field>
                                <Field>
                                    <Label>Net Magnitude</Label>
                                    <Input required type="number" placeholder="Enter Amount" value={newEntry.quantity} onChange={(e: any) => setNewEntry({ ...newEntry, quantity: e.target.value })} />
                                </Field>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-8">
                                <Field>
                                    <Label>Production Base Model</Label>
                                    <Select value={newEntry.productId} onChange={(e: any) => {
                                        const p = products.find(prod => prod.id === e.target.value);
                                        setNewEntry({ ...newEntry, productId: e.target.value, variationId: p?.variations?.[0]?.id || "", baseMaterialId: p?.materials?.[0]?.materialId || "" });
                                    }}>
                                        <option value="">-- Choose Pen Model --</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </Select>
                                </Field>
                                <Field>
                                    <Label>Variant Specification</Label>
                                    <Select value={newEntry.variationId} onChange={(e: any) => setNewEntry({ ...newEntry, variationId: e.target.value })}>
                                         <option value="">-- Choose Variation --</option>
                                        {products.find(p => p.id === newEntry.productId)?.variations?.map((v:any) => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)}
                                    </Select>
                                </Field>
                                <Field>
                                    <Label>Batch Magnitude (Pcs)</Label>
                                    <Input required type="number" className="text-lg font-bold" value={newEntry.quantity} onChange={(e: any) => setNewEntry({ ...newEntry, quantity: e.target.value })} />
                                </Field>
                            </div>
                        )}

                        <div className="flex gap-6 pt-6 border-t border-slate-50">
                            <Field className="flex-1">
                                <Label>Journal Date</Label>
                                <Input type="date" value={newEntry.date} onChange={(e: any) => setNewEntry({ ...newEntry, date: e.target.value })} />
                            </Field>
                            <Field className="flex-[2]">
                                <Label>Journal Reference / Internal Notes</Label>
                                <Input placeholder="Additional context for this movement..." value={newEntry.notes} onChange={(e: any) => setNewEntry({ ...newEntry, notes: e.target.value })} />
                            </Field>
                            <div className="flex gap-3 items-end pb-0.5">
                                <button type="submit" className="btn-primary px-10 py-3 h-fit active:scale-95 transition-all">VALIDATE ENTRY</button>
                                <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 rounded-lg text-sm font-bold text-slate-400 hover:text-black transition-all">Discard</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Registry History */}
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        className="w-full pl-12 pr-6 py-2.5 rounded-xl bg-white border border-slate-200 outline-none font-medium text-sm text-black placeholder:text-slate-300 focus:border-blue-500 transition-all" 
                        placeholder="Search entries by batch or item..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
                    <Filter size={14} className="text-slate-400" />
                    ALL MOVEMENTS
                </div>
            </div>

            <div className="pane bg-white min-h-[450px]">
                <div className="pane-header flex justify-between items-center bg-slate-50/50">
                    <span>Master Audit Log</span>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                if (isAutoLayout) {
                                    setIsAutoLayout(false);
                                    setColumnOverrides(new Set());
                                } else {
                                    setIsAutoLayout(true);
                                }
                            }}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider transition-all",
                                isAutoLayout 
                                    ? "bg-blue-500 border-blue-600 text-white shadow-sm" 
                                    : "bg-white border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200"
                            )}
                            title="Toggles between Fixed and Auto-Adjusting layout (Excel Style)"
                        >
                            {isAutoLayout ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
                            {isAutoLayout ? "Reset Layout" : "Auto-Fit All"}
                        </button>
                        <Download size={14} className="text-slate-400 hover:text-blue-500 cursor-pointer" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredEntries.length} Events Logged</span>
                    </div>
                </div>
                
                <table className={cn("w-full border-separate border-spacing-0", isAutoLayout ? "table-auto" : "table-fixed")}>
                    <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md">
                        <tr className="relative">
                            <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('date', 'w-[15%]'))} onDoubleClick={() => toggleColumnOverride('date')}>
                                <div className="flex flex-col">
                                    <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                       <span className="text-[9px] uppercase font-bold text-slate-400">Operation Date</span>
                                    </div>
                                    <div className="px-1.5 py-1.5 bg-slate-50/50">
                                        <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.date} onChange={e => setColumnFilters({...columnFilters, date: e.target.value})} />
                                    </div>
                                </div>
                            </th>
                            <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('identity', 'w-[35%]'))} onDoubleClick={() => toggleColumnOverride('identity')}>
                                <div className="flex flex-col">
                                    <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                       <span className="text-[9px] uppercase font-bold text-slate-400">Entry Identity</span>
                                    </div>
                                    <div className="px-1.5 py-1.5 bg-slate-50/50">
                                        <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter ID/Item..." value={columnFilters.batchCode} onChange={e => setColumnFilters({...columnFilters, batchCode: e.target.value})} />
                                    </div>
                                </div>
                            </th>
                            <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('source', 'w-[25%]'))} onDoubleClick={() => toggleColumnOverride('source')}>
                                <div className="flex flex-col">
                                    <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                       <span className="text-[9px] uppercase font-bold text-slate-400">Source / Ref</span>
                                    </div>
                                    <div className="px-1.5 py-1.5 bg-slate-50/50">
                                        <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.source} onChange={e => setColumnFilters({...columnFilters, source: e.target.value})} />
                                    </div>
                                </div>
                            </th>
                            <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('magnitude', 'w-[12%]'))} onDoubleClick={() => toggleColumnOverride('magnitude')}>
                                <div className="flex flex-col">
                                    <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                       <span className="text-[9px] uppercase font-bold text-slate-400">Magnitude</span>
                                    </div>
                                    <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                </div>
                            </th>
                            <th className={cn("p-0 transition-all", getWidthClass('flow', 'w-[13%]'))}>
                                <div className="flex flex-col">
                                    <div className="px-2 py-2 border-b border-slate-100 min-h-[33px] flex items-center">
                                       <span className="text-[9px] uppercase font-bold text-slate-400">Flow Type</span>
                                    </div>
                                    <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.map((entry: any) => (
                            <tr key={entry.id} className="group hover:bg-slate-50 transition-colors">
                                <td><span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(entry.date)}</span></td>
                                <td>
                                    {entry.batchCode ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                                <QrCode size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-black text-xs uppercase tracking-widest">{entry.batchCode}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{getItemName(entry.itemId, entry.itemType)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-[10px] group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors uppercase">
                                                {entry.itemType ? entry.itemType.charAt(0) : 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-black text-xs uppercase tracking-tight">{getItemName(entry.itemId, entry.itemType)}</span>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase">{entry.itemType}</span>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <Users size={12} className={cn("text-slate-300", entry.supplierId && "text-blue-500")} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            {entry.supplierId ? suppliers.find(s => s.id === entry.supplierId)?.name : "Internal Transfer"}
                                        </span>
                                    </div>
                                </td>
                                <td className="text-right">
                                    <div className={cn("text-xs font-black tracking-tight", entry.quantity < 0 ? "text-red-500" : "text-blue-600")}>
                                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                                    </div>
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end">
                                        <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase", entry.type === 'arrival' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600")}>
                                            {entry.type}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
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
