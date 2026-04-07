"use client";

import { useEffect, useState } from "react";
import { Plus, PenTool, Trash2, ListChecks, Layers, Hash, Package, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: "", 
    code: "",
    materials: [{ materialId: "", quantity: 1 }],
    parts: [{ partId: "", quantity: 1 }],
    variations: [{ id: Math.random().toString(36).substr(2, 9), name: "", code: "" }]
  });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = (products || []).filter((p: any) => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [mRes, pRes, prRes] = await Promise.all([
      fetch("/api/materials"),
      fetch("/api/parts"),
      fetch("/api/products")
    ]);
    const mData = await mRes.json();
    const pData = await pRes.json();
    setMaterials(mData);
    setParts(pData);
    setProducts(await prRes.json());
    
    // Set defaults for first row
    if (mData.length > 0 && newProduct.materials[0].materialId === "") {
        setNewProduct(prev => ({ ...prev, materials: [{ materialId: mData[0].id, quantity: 1 }] }));
    }
    if (pData.length > 0 && newProduct.parts[0].partId === "") {
        setNewProduct(prev => ({ ...prev, parts: [{ partId: pData[0].id, quantity: 1 }] }));
    }
  }

  const addRow = (type: 'materials' | 'parts' | 'variations') => {
    if (type === 'materials') {
      setNewProduct({ ...newProduct, materials: [...newProduct.materials, { materialId: materials[0]?.id || "", quantity: 1 }] });
    } else if (type === 'parts') {
      setNewProduct({ ...newProduct, parts: [...newProduct.parts, { partId: parts[0]?.id || "", quantity: 1 }] });
    } else {
      setNewProduct({ ...newProduct, variations: [...newProduct.variations, { id: Math.random().toString(36).substr(2, 9), name: "", code: "" }] });
    }
  };

  const updateRow = (type: 'materials' | 'parts' | 'variations', index: number, field: string, value: any) => {
    const updated = [...newProduct[type]] as any[];
    updated[index] = { ...updated[index], [field]: value };
    setNewProduct({ ...newProduct, [type]: updated });
  };

  const removeRow = (type: 'materials' | 'parts' | 'variations', index: number) => {
    const updated = (newProduct[type] as any[]).filter((_, i) => i !== index);
    setNewProduct({ ...newProduct, [type]: updated });
  };

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/products", {
      method: "POST",
      body: JSON.stringify(newProduct),
    });
    setNewProduct({ 
      name: "", 
      code: "", 
      materials: [{ materialId: materials[0]?.id || "", quantity: 1 }],
      parts: [{ partId: parts[0]?.id || "", quantity: 1 }],
      variations: [{ id: Math.random().toString(36).substr(2, 9), name: "", code: "" }]
    });
    setShowAddForm(false);
    fetchData();
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-8 pb-3">
            <span className="text-sm font-bold text-black border-b-2 border-blue-500 px-1 translate-y-[1px]">Pen Models</span>
            <span className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors px-1 cursor-pointer">Spec Analyzer</span>
        </div>
        <div className="flex gap-3 pb-3 items-center">
            <div className="relative w-64 mr-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                    className="w-full search-input pl-14 pr-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200 outline-none font-medium text-[11px] text-black placeholder:text-slate-300 focus:border-blue-500 transition-all focus:bg-white"
                    placeholder="Filter products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-primary py-1.5 px-4 text-[11px] h-auto shadow-none"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              CREATE NEW PEN
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

            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <PenTool size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-black uppercase tracking-tight">Configure New Pen Product</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Synchronized Master Specification</p>
                </div>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <Field>
                  <Label>Pen Identity / Brand Name</Label>
                  <Input required placeholder="e.g. Classic Blue Ball Pen" value={newProduct.name} onChange={(e: any) => setNewProduct({ ...newProduct, name: e.target.value })} />
                </Field>
                <Field>
                  <Label>Product Identifer (3 Letters)</Label>
                  <Input required placeholder="BT1" maxLength={3} className="uppercase font-bold tracking-widest text-blue-600" value={newProduct.code} onChange={(e: any) => setNewProduct({ ...newProduct, code: e.target.value })} />
                </Field>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Materials */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Package className="w-3 h-3 text-blue-500" /> Resource Materials
                  </label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {newProduct.materials.map((row, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Select className="flex-1" value={row.materialId} onChange={(e: any) => updateRow('materials', index, "materialId", e.target.value)}>
                          {materials.map((m: any) => (<option key={m.id} value={m.id}>{m.name} ({m.code})</option>))}
                        </Select>
                        <Input type="number" className="w-24 font-bold" value={row.quantity} onChange={(e: any) => updateRow('materials', index, "quantity", e.target.value)} />
                        <button type="button" onClick={() => removeRow('materials', index)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addRow('materials')} className="text-blue-600 text-[10px] font-bold hover:underline ml-1 uppercase">+ Add Material Resource</button>
                </div>

                {/* Parts */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Layers className="w-3 h-3 text-indigo-500" /> Component Inventory
                  </label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {newProduct.parts.map((row, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Select className="flex-1" value={row.partId} onChange={(e: any) => updateRow('parts', index, "partId", e.target.value)}>
                          {parts.map((p: any) => (<option key={p.id} value={p.id}>{p.name} ({p.code})</option>))}
                        </Select>
                        <Input type="number" className="w-24 font-bold" value={row.quantity} onChange={(e: any) => updateRow('parts', index, "quantity", e.target.value)} />
                        <button type="button" onClick={() => removeRow('parts', index)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addRow('parts')} className="text-indigo-600 text-[10px] font-bold hover:underline ml-1 uppercase">+ Add Component Link</button>
                </div>
              </div>

              {/* Variations */}
              <div className="space-y-4 pt-6 border-t border-slate-50">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Standard Scale Variations (Sizes/Types)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                  {newProduct.variations.map((v, index) => (
                    <div key={v.id} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <Input required placeholder="Name (e.g. 0.7mm)" className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-xs" value={v.name} onChange={(e: any) => updateRow('variations', index, 'name', e.target.value)} />
                      <Input required placeholder="XX" maxLength={2} className="w-12 bg-transparent border-none p-0 focus:ring-0 text-xs text-center font-bold uppercase" value={v.code} onChange={(e: any) => updateRow('variations', index, 'code', e.target.value)} />
                      <button type="button" onClick={() => removeRow('variations', index)} className="text-slate-300 hover:text-red-500 p-1 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addRow('variations')} className="text-slate-400 text-[10px] font-bold hover:text-black ml-1 uppercase">+ Add Brand Variation</button>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">Commit Pen to Registry</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-10 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-black transition-all">Dismiss</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {filteredProducts.map((p: any) => (
          <div key={p.id} className="premium-card p-6 flex flex-col bg-white overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 text-white">
                <PenTool className="w-7 h-7" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-2 py-1 rounded">CODE: {p.code}</span>
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{p.name}</h3>
            
            <div className="flex-1 space-y-6 mt-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ListChecks className="w-3 h-3" /> Materials & Parts
                </p>
                <div className="flex flex-wrap gap-2">
                    {p.materials?.map((m: any, i: number) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-md text-slate-600">
                            {materials.find(mat => mat.id === m.materialId)?.code}: {m.quantity}
                        </span>
                    ))}
                    {p.parts?.map((pt:any, i:number) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-1 bg-indigo-50 rounded-md text-indigo-600">
                            {parts.find(par => par.id === pt.partId)?.code}: {pt.quantity}
                        </span>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Variations
                </p>
                <div className="flex flex-wrap gap-2">
                    {p.variations?.map((v:any) => (
                        <span key={v.id} className="text-[10px] font-bold px-2 py-1 border border-slate-200 rounded-full text-slate-500">
                            {v.name} ({v.code})
                        </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ))}
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
