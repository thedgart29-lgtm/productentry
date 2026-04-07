"use client";

import { useEffect, useState } from "react";
import { Plus, Package, PenTool, Layers, Users, TrendingUp, Save, CheckCircle2, Box, Edit2, Trash2, X, Search, Eye, EyeOff, Maximize2, Minimize2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/ConfirmationModal";

type TabType = 'materials' | 'products' | 'types' | 'suppliers' | 'employees';

const COMMON_COLORS = [
    { name: "Blue", bg: "bg-blue-600" },
    { name: "Black", bg: "bg-black" },
    { name: "Red", bg: "bg-red-600" },
    { name: "Green", bg: "bg-green-600" },
    { name: "Silver", bg: "bg-slate-300" },
    { name: "Gold", bg: "bg-yellow-500" },
    { name: "White", bg: "bg-white border-slate-200" },
];

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('materials');
  const [data, setData] = useState<any>({ materials: [], products: [], types: [], suppliers: [], employees: [] });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInwardForm, setShowInwardForm] = useState(false);
  
  // Forms
  const [materialForm, setMaterialForm] = useState({ name: "", code: "", unit: "kg", threshold: "" });
  const [materialInwardForm, setMaterialInwardForm] = useState({ materialId: "", supplierId: "", quantity: "", date: new Date().toISOString().split('T')[0] });
  const [productForm, setProductForm] = useState({ name: "", code: "" });
  const [typeForm, setTypeForm] = useState({ productId: "", size: "", sizeUnit: "MM", diameter: "", unitWeight: "", color: "", code: "", hasColor: false });
  const [supplierForm, setSupplierForm] = useState({ name: "", contact: "", address: "" });
  const [employeeForm, setEmployeeForm] = useState({ name: "", idCode: "", designation: "", authCode: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Global Confirmation & Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'save' | 'delete'; onConfirm: () => void } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState({
      name: "",
      code: "",
      threshold: "",
      unit: "",
      specs: "",
      status: "",
      category: "",
      contact: ""
  });
  const [isAutoLayout, setIsAutoLayout] = useState(false);
  const [columnOverrides, setColumnOverrides] = useState<Set<string>>(new Set());

  // Load/Save layout settings
  useEffect(() => {
    const savedLayout = localStorage.getItem(`tableLayout_master_${activeTab}`);
    if (savedLayout) {
        const { isAuto, overrides } = JSON.parse(savedLayout);
        setIsAutoLayout(isAuto);
        setColumnOverrides(new Set(overrides));
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(`tableLayout_master_${activeTab}`, JSON.stringify({
        isAuto: isAutoLayout,
        overrides: Array.from(columnOverrides)
    }));
  }, [isAutoLayout, columnOverrides, activeTab]);

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

  const term = searchTerm.toLowerCase();
  const filteredMaterials = (data.materials || []).filter((m: any) => {
      const matchesSearch = m.name?.toLowerCase().includes(term) || m.code?.toLowerCase().includes(term);
      const matchesName = m.name?.toLowerCase().includes(columnFilters.name.toLowerCase());
      const matchesCode = m.code?.toLowerCase().includes(columnFilters.code.toLowerCase());
      const matchesUnit = m.unit?.toLowerCase().includes(columnFilters.unit.toLowerCase());
      return matchesSearch && matchesName && matchesCode && matchesUnit;
  });
  const filteredProducts = (data.products || []).filter((p: any) => {
      const matchesSearch = p.name?.toLowerCase().includes(term) || p.code?.toLowerCase().includes(term);
      const matchesName = p.name?.toLowerCase().includes(columnFilters.name.toLowerCase());
      const matchesCode = p.code?.toLowerCase().includes(columnFilters.code.toLowerCase());
      return matchesSearch && matchesName && matchesCode;
  });
  const filteredTypes = (data.types || []).filter((t: any) => {
      const matchesSearch = t.code?.toLowerCase().includes(term) || t.size?.toLowerCase().includes(term) || (data.products?.find((p:any) => p.id === t.productId)?.name || t.productId)?.toLowerCase().includes(term);
      const matchesName = (data.products?.find((p:any) => p.id === t.productId)?.name || "").toLowerCase().includes(columnFilters.name.toLowerCase());
      const matchesCode = t.code?.toLowerCase().includes(columnFilters.code.toLowerCase());
      return matchesSearch && matchesName && matchesCode;
  });
  const filteredSuppliers = (data.suppliers || []).filter((s: any) => {
      const matchesSearch = s.name?.toLowerCase().includes(term) || s.contact?.toLowerCase().includes(term);
      const matchesName = s.name?.toLowerCase().includes(columnFilters.name.toLowerCase());
      const matchesContact = s.contact?.toLowerCase().includes(columnFilters.contact.toLowerCase());
      return matchesSearch && matchesName && matchesContact;
  });
  const filteredEmployees = (data.employees || []).filter((e: any) => {
      const matchesSearch = e.name?.toLowerCase().includes(term) || e.idCode?.toLowerCase().includes(term) || e.designation?.toLowerCase().includes(term);
      const matchesName = e.name?.toLowerCase().includes(columnFilters.name.toLowerCase());
      const matchesDept = e.designation?.toLowerCase().includes(columnFilters.category.toLowerCase());
      return matchesSearch && matchesName && matchesDept;
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const res = await fetch("/api/master");
    const d = await res.json();
    setData((prev: any) => ({ ...prev, ...d }));
    
    if (d.materials.length > 0 && !materialInwardForm.materialId) {
      setMaterialInwardForm(prev => ({ ...prev, materialId: d.materials[0].id }));
    }
    if (d.suppliers.length > 0 && !materialInwardForm.supplierId) {
      setMaterialInwardForm(prev => ({ ...prev, supplierId: d.suppliers[0].id }));
    }
    if (d.products.length > 0 && !typeForm.productId) {
      setTypeForm(prev => ({ ...prev, productId: d.products[0].id }));
    }
  }

  // Auto-estimate Unit Weight
  useEffect(() => {
    const size = parseFloat(typeForm.size);
    const diameter = parseFloat(typeForm.diameter);
    
    if (!isNaN(size) && !isNaN(diameter) && size > 0 && diameter > 0) {
      let lengthInMm = size;
      if (typeForm.sizeUnit === "CM") lengthInMm = size * 10;
      if (typeForm.sizeUnit === "IN") lengthInMm = size * 25.4;

      const radius = diameter / 2;
      const volumeMm3 = Math.PI * Math.pow(radius, 2) * lengthInMm;
      const volumeCm3 = volumeMm3 / 1000;
      const estimatedWeight = (volumeCm3 * 1.05).toFixed(2);
      
      setTypeForm(prev => ({ ...prev, unitWeight: estimatedWeight }));
    }
  }, [typeForm.size, typeForm.sizeUnit, typeForm.diameter]);

  async function handleSubmit(type: string, body: any) {
    const isEditing = !!editingId;
    
    setConfirmModal({
      isOpen: true,
      title: isEditing ? "Save Changes?" : "Confirm Addition?",
      message: isEditing ? "Are you sure you want to update this entry's details?" : "Are you sure you want to add this new entry to the registry?",
      type: 'save',
      onConfirm: async () => {
        await fetch("/api/master", {
          method: "POST",
          body: JSON.stringify({ ...body, type, action: isEditing ? 'update' : 'create', id: editingId }),
        });
        
        // Reset forms
        if (type === 'material') setMaterialForm({ name: "", code: "", unit: "kg", threshold: "" });
        if (type === 'product') setProductForm({ name: "", code: "" });
        if (type === 'productType') setTypeForm({productId: data.products[0]?.id || "", size:"", sizeUnit: "MM", diameter: "", unitWeight: "", color:"", code:"", hasColor: false});
        if (type === 'supplier') setSupplierForm({ name: "", contact: "", address: "" });
        if (type === 'employee') setEmployeeForm({ name: "", idCode: "", designation: "", authCode: "" });
        
        setShowAddForm(false);
        setEditingId(null);
        fetchData();
      }
    });
  }

  const handleDelete = (type: string, id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Deletion",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      type: 'delete',
      onConfirm: async () => {
        await fetch("/api/master", {
          method: "POST",
          body: JSON.stringify({ type, action: 'delete', id }),
        });
        fetchData();
      }
    });
  };

  const handleMaterialInward = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/master", {
      method: "POST",
      body: JSON.stringify({ ...materialInwardForm, type: 'material', action: 'inward' }),
    });
    setMaterialInwardForm({ ...materialInwardForm, quantity: "" });
    setShowInwardForm(false);
    fetchData();
  };

  const openAddForm = () => {
    setEditingId(null);
    if (activeTab === 'materials') setMaterialForm({ name: "", code: "", unit: "kg", threshold: "" });
    if (activeTab === 'products') setProductForm({ name: "", code: "" });
    if (activeTab === 'types') setTypeForm({productId: data.products[0]?.id || "", size:"", sizeUnit: "MM", diameter: "", unitWeight: "", color:"", code:"", hasColor: false});
    if (activeTab === 'suppliers') setSupplierForm({ name: "", contact: "", address: "" });
    if (activeTab === 'employees') setEmployeeForm({ name: "", idCode: "", designation: "", authCode: "" });
    setShowAddForm(true);
  };

  return (
    <div className="flex gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 relative">
      
      {/* Left Panel: Operational Overview */}
      <div className="w-[280px] flex-shrink-0 space-y-6">
        <div className="pane p-6 bg-white">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Operational Standards</h3>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h4 className="text-sm font-bold text-black">Master Registry</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Configuration Hub</p>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium">Total Materials</span>
                        <span className="text-black font-bold">{data.materials?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium">Active Products</span>
                        <span className="text-black font-bold">{data.products?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-medium">Quality Checkpoints</span>
                        <span className="text-black font-bold">14</span>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="text-[10px] font-bold text-black uppercase">Standard Compliance</span>
                    </div>
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="pane p-6 bg-slate-800 text-white">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Pro Tip</h3>
            <p className="text-xs leading-relaxed text-slate-300">
                Ensure all Material Codes are unique and follow the <span className="text-blue-400 font-bold uppercase">factory naming convention</span> for better tracking.
            </p>
        </div>
      </div>

      {/* Main Panel: Tabs and Management */}
      <div className="flex-1 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 mb-6">
            <div className="flex gap-8">
                <Tab text="Materials" active={activeTab === 'materials'} onClick={() => { setActiveTab('materials'); setCurrentPage(1); setShowAddForm(false); setSearchTerm(""); }} />
                <Tab text="Products" active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setCurrentPage(1); setShowAddForm(false); setSearchTerm(""); }} />
                <Tab text="Types" active={activeTab === 'types'} onClick={() => { setActiveTab('types'); setCurrentPage(1); setShowAddForm(false); setSearchTerm(""); }} />
                <Tab text="Suppliers" active={activeTab === 'suppliers'} onClick={() => { setActiveTab('suppliers'); setCurrentPage(1); setShowAddForm(false); setSearchTerm(""); }} />
                <Tab text="Employees" active={activeTab === 'employees'} onClick={() => { setActiveTab('employees'); setCurrentPage(1); setShowAddForm(false); setSearchTerm(""); }} />
            </div>

            <div className="flex gap-2 pb-3 items-center">
                <div className="relative w-64 mr-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        className="w-full search-input pl-14 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none font-medium text-xs text-black placeholder:text-slate-300 focus:border-blue-500 transition-all focus:bg-white"
                        placeholder={`Filter ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}...`}
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
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
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all",
                        isAutoLayout 
                            ? "bg-blue-500 border-blue-600 text-white shadow-sm" 
                            : "bg-white border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200"
                    )}
                    title="Toggles between Fixed and Auto-Adjusting layout (Excel Style)"
                >
                    {isAutoLayout ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    {isAutoLayout ? "Reset" : "Auto-Fit"}
                </button>
                {activeTab === 'materials' && (
                    <button onClick={() => setShowInwardForm(!showInwardForm)} className="btn-secondary py-1.5 px-4 text-[10px] hover:scale-105 transition-all">
                        <Save size={14} className="mr-2" /> STOCK RECEPTION
                    </button>
                )}
                <button onClick={openAddForm} className="btn-primary py-1.5 px-4 text-[10px] hover:scale-105 transition-all">
                    <Plus size={14} className="mr-2" /> NEW REGISTRY
                </button>
            </div>
        </div>

        <div className="animate-in fade-in duration-500">
          {activeTab === 'materials' && (
            <div className="space-y-6">
               {showInwardForm && (
                   <Modal title="Inventory Inward Registry" icon={<Save size={16} className="text-blue-500" />} onClose={() => setShowInwardForm(false)}>
                       <form onSubmit={handleMaterialInward} className="grid grid-cols-4 gap-6">
                           <Field>
                               <Label>Active Registry</Label>
                               <Select value={materialInwardForm.materialId} onChange={(e: any) => setMaterialInwardForm({...materialInwardForm, materialId: e.target.value})}>
                                   {data.materials?.map((m:any) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                               </Select>
                           </Field>
                           <Field>
                               <Label>Provider</Label>
                               <Select value={materialInwardForm.supplierId} onChange={(e: any) => setMaterialInwardForm({...materialInwardForm, supplierId: e.target.value})}>
                                   {data.suppliers?.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                               </Select>
                           </Field>
                           <Field>
                               <Label>Net Qty</Label>
                               <Input type="number" value={materialInwardForm.quantity} onChange={(e: any) => setMaterialInwardForm({...materialInwardForm, quantity: e.target.value})} />
                           </Field>
                           <Field>
                               <Label>Reception Date</Label>
                               <Input type="date" value={materialInwardForm.date} onChange={(e: any) => setMaterialInwardForm({...materialInwardForm, date: e.target.value})} />
                           </Field>
                           <div className="col-span-4 flex justify-end gap-3 pt-4 border-t border-slate-200">
                               <button type="button" onClick={() => setShowInwardForm(false)} className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-black transition-all">Cancel</button>
                               <button type="submit" className="btn-secondary py-2 px-8 text-xs">Validate Inventory Update</button>
                           </div>
                       </form>
                   </Modal>
               )}

               {showAddForm && (
                   <Modal title={editingId ? 'Modify Material' : 'Configure New Material'} subtitle="Synchronized Master Protocol" icon={editingId ? <Edit2 size={20} /> : <Plus size={20} />} editing={!!editingId} onClose={() => { setShowAddForm(false); setEditingId(null); }}>
                        <div className="grid grid-cols-3 gap-6">
                            <Field>
                                <Label>Material Identity</Label>
                                <Input placeholder="e.g. High-Density Polymer" value={materialForm.name} onChange={(e: any) => setMaterialForm({...materialForm, name: e.target.value})} />
                            </Field>
                            <Field>
                                <Label>Code</Label>
                                <Input maxLength={3} placeholder="PLA" className="uppercase font-bold tracking-widest text-blue-600" value={materialForm.code} onChange={(e: any) => setMaterialForm({...materialForm, code: e.target.value})} />
                            </Field>
                            <Field>
                                <Label>Unit</Label>
                                <Select value={materialForm.unit} onChange={(e: any) => setMaterialForm({...materialForm, unit: e.target.value})}>
                                    <option value="kg">KG</option>
                                    <option value="pcs">PCS</option>
                                </Select>
                            </Field>
                            <Field>
                                <Label>Stock Alert Level</Label>
                                <Input type="number" placeholder="Trigger alert at e.g. 50" value={materialForm.threshold} onChange={(e: any) => setMaterialForm({...materialForm, threshold: e.target.value})} />
                            </Field>
                            <div className="col-span-2 flex items-end justify-end gap-3 pt-6 border-t border-slate-50 mt-4">
                                <button type="button" onClick={() => { setShowAddForm(false); setEditingId(null); }} className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-black transition-all">Discard</button>
                                <button onClick={() => handleSubmit('material', materialForm)} className={cn("btn-primary py-2.5 px-8 text-xs", editingId && "bg-orange-600 hover:bg-orange-700 shadow-orange-100")}>
                                    {editingId ? 'Update Material' : 'Commit to Registry'}
                                </button>
                            </div>
                        </div>
                   </Modal>
               )}

            <div className="pane bg-white overflow-hidden">
               <div className="pane-header flex justify-between items-center">
                   <span>Active Material Registry</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredMaterials.length} Units Registry</span>
               </div>
               <table className={cn("w-full border-separate border-spacing-0", isAutoLayout ? "table-auto" : "table-fixed")}>
                   <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md">
                       <tr>
                           <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('name', 'w-[30%]'))} onDoubleClick={() => toggleColumnOverride('name')}>
                               <div className="flex flex-col">
                                   <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                      <span className="text-[9px] uppercase font-bold text-slate-400">Material Identity</span>
                                   </div>
                                   <div className="px-1.5 py-1.5 bg-slate-50/50">
                                       <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.name} onChange={e => setColumnFilters({...columnFilters, name: e.target.value})} />
                                   </div>
                               </div>
                           </th>
                           <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('code', 'w-[15%]'))} onDoubleClick={() => toggleColumnOverride('code')}>
                               <div className="flex flex-col">
                                   <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                      <span className="text-[9px] uppercase font-bold text-slate-400">Code</span>
                                   </div>
                                   <div className="px-1.5 py-1.5 bg-slate-50/50">
                                       <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.code} onChange={e => setColumnFilters({...columnFilters, code: e.target.value})} />
                                   </div>
                               </div>
                           </th>
                           <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('stock', 'w-[15%]'))} onDoubleClick={() => toggleColumnOverride('stock')}>
                               <div className="flex flex-col">
                                   <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                      <span className="text-[9px] uppercase font-bold text-slate-400">Stock</span>
                                   </div>
                                   <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                               </div>
                           </th>
                           <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('unit', 'w-[10%]'))} onDoubleClick={() => toggleColumnOverride('unit')}>
                               <div className="flex flex-col">
                                   <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                      <span className="text-[9px] uppercase font-bold text-slate-400">Unit</span>
                                   </div>
                                   <div className="px-1.5 py-1.5 bg-slate-50/50">
                                       <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="..." value={columnFilters.unit} onChange={e => setColumnFilters({...columnFilters, unit: e.target.value})} />
                                   </div>
                               </div>
                           </th>
                           <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('threshold', 'w-[15%]'))} onDoubleClick={() => toggleColumnOverride('threshold')}>
                               <div className="flex flex-col">
                                   <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                      <span className="text-[9px] uppercase font-bold text-slate-400">Low Stock</span>
                                   </div>
                                   <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                               </div>
                           </th>
                           <th className={cn("p-0 transition-all", getWidthClass('action', 'w-[15%]'))}>
                               <div className="flex flex-col">
                                   <div className="px-2 py-2 border-b border-slate-100 min-h-[33px] flex items-center">
                                      <span className="text-[9px] uppercase font-bold text-slate-400">Action</span>
                                   </div>
                                   <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                               </div>
                           </th>
                       </tr>
                   </thead>
                   <tbody>
                       {filteredMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((m: any) => {
                           const inwardStock = m.inwardEntries?.reduce((acc: number, e: any) => acc + e.quantity, 0) || 0;
                           const consumedStock = (data.inwards || []).filter((i:any) => i.materialId === m.id).reduce((acc: number, i: any) => acc + i.materialQuantity, 0) || 0;
                           const stock = (inwardStock - consumedStock).toFixed(2);
                           return (
                             <tr key={m.id} className="group hover:bg-slate-50 transition-colors">
                                 <td className="font-bold border-r border-slate-100 p-2 text-left">{m.name}</td>
                                 <td className="border-r border-slate-100 p-2 text-left"><span className="text-blue-600 font-bold">{m.code}</span></td>
                                 <td className="font-bold border-r border-slate-100 p-2 text-left">{stock}</td>
                                 <td className="text-slate-400 font-bold uppercase border-r border-slate-100 p-2 text-left">{m.unit}</td>
                                 <td className="border-r border-slate-100 p-2 text-left">{m.threshold || 0}</td>
                                 <td className="p-2 text-left">
                                     <div className="flex items-center gap-2">
                                         <button onClick={() => { setEditingId(m.id); setMaterialForm({ name: m.name, code: m.code, unit: m.unit, threshold: (m.threshold || 0).toString() }); setShowAddForm(true); }} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={14} /></button>
                                         <button onClick={() => handleDelete('material', m.id, m.name)} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-600 transition-all shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={14} /></button>
                                     </div>
                                 </td>
                             </tr>
                           )
                       })}
                   </tbody>
               </table>
               <Pagination total={filteredMaterials.length} current={currentPage} onChange={setCurrentPage} itemsPerPage={itemsPerPage} />
            </div>
          </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
                {showAddForm && (
                    <Modal title={editingId ? 'Modify Brand Identity' : 'Authorize Production Hub'} subtitle="Synchronized Master Protocol" icon={editingId ? <Edit2 size={20} /> : <Plus size={20} />} editing={!!editingId} onClose={() => { setShowAddForm(false); setEditingId(null); }}>
                        <div className="grid grid-cols-2 gap-6">
                            <Field>
                                <Label>Brand Identity</Label>
                                <Input placeholder="e.g. Signature Gold" value={productForm.name} onChange={(e: any) => setProductForm({...productForm, name: e.target.value})} />
                            </Field>
                            <Field>
                                <Label>Unique Code</Label>
                                <Input maxLength={3} placeholder="P01" className="uppercase font-bold tracking-widest text-blue-600" value={productForm.code} onChange={(e: any) => setProductForm({...productForm, code: e.target.value})} />
                            </Field>
                            <div className="col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-50 mt-4">
                                <button type="button" onClick={() => { setShowAddForm(false); setEditingId(null); }} className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-black transition-all">Discard</button>
                                <button onClick={() => handleSubmit('product', productForm)} className={cn("btn-primary py-2.5 px-12 text-xs", editingId && "bg-orange-600 hover:bg-orange-700 shadow-orange-100")}>
                                    {editingId ? 'Update Brand' : 'Authorize Hub'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
                <div className="pane bg-white overflow-hidden">
                    <div className="pane-header flex justify-between items-center">
                        <span>Production Hub Registry</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredProducts.length} Units Active</span>
                    </div>
                    <table className={cn("w-full border-separate border-spacing-0", isAutoLayout ? "table-auto" : "table-fixed")}>
                        <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md">
                            <tr>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('name', 'w-[35%]'))} onDoubleClick={() => toggleColumnOverride('name')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Product Hub Name</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50">
                                            <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.name} onChange={e => setColumnFilters({...columnFilters, name: e.target.value})} />
                                        </div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('code', 'w-[15%]'))} onDoubleClick={() => toggleColumnOverride('code')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Code</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50">
                                            <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.code} onChange={e => setColumnFilters({...columnFilters, code: e.target.value})} />
                                        </div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('specs', 'w-[25%]'))} onDoubleClick={() => toggleColumnOverride('specs')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Specifications</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('status', 'w-[15%]'))} onDoubleClick={() => toggleColumnOverride('status')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Status</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                                <th className={cn("p-0 transition-all", getWidthClass('action', 'w-[10%]'))}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 min-h-[33px] flex items-center">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Action</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((p: any) => (
                                <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="font-bold border-r border-slate-100 p-2 text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Package size={14} />
                                            </div>
                                            {p.name}
                                        </div>
                                    </td>
                                    <td className="border-r border-slate-100 p-2 text-left"><span className="text-blue-600 font-bold uppercase tracking-widest">{p.code}</span></td>
                                    <td className="border-r border-slate-100 p-2 text-left">{data.types?.filter((t:any) => t.productId === p.id).length || 0} Active Variants</td>
                                    <td className="border-r border-slate-100 p-2 text-left"><span className="text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-0.5 rounded-full">Authorized</span></td>
                                    <td className="p-2 text-left">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setEditingId(p.id); setProductForm({ name: p.name, code: p.code }); setShowAddForm(true); }} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete('product', p.id, p.name)} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-600 transition-all shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={14} /></button>
                                            </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination total={filteredProducts.length} current={currentPage} onChange={setCurrentPage} itemsPerPage={itemsPerPage} />
                </div>
            </div>
          )}

          {activeTab === 'types' && (
            <div className="space-y-6">
                {showAddForm && (
                    <Modal title={editingId ? 'Modify Variation' : 'Authorize Variant'} subtitle="Synchronized Master Protocol" icon={editingId ? <Edit2 size={20} /> : <Plus size={20} />} editing={!!editingId} onClose={() => { setShowAddForm(false); setEditingId(null); }} maxWidth="max-w-4xl">
                        <div className="grid grid-cols-3 gap-6">
                            <Field>
                                <Label>Base Master Product</Label>
                                <Select value={typeForm.productId} onChange={(e: any) => setTypeForm({...typeForm, productId: e.target.value})}>
                                    {data.products?.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </Select>
                            </Field>
                            <Field>
                                <Label>Model Specification</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="e.g. 0.7" className="flex-1" value={typeForm.size} onChange={(e: any) => setTypeForm({...typeForm, size: e.target.value})} />
                                    <Select className="w-20 px-2" value={typeForm.sizeUnit} onChange={(e: any) => setTypeForm({...typeForm, sizeUnit: e.target.value})}>
                                        <option value="MM">MM</option>
                                        <option value="CM">CM</option>
                                        <option value="IN">IN</option>
                                    </Select>
                                </div>
                            </Field>
                            <Field>
                                <Label>Diameter (mm)</Label>
                                <Input placeholder="e.g. 15" value={typeForm.diameter} onChange={(e: any) => setTypeForm({...typeForm, diameter: e.target.value})} />
                            </Field>
                            <Field>
                                <Label className="flex items-center gap-1.5 text-nowrap">
                                    Unit Weight (G/Pc) 
                                    {(parseFloat(typeForm.unitWeight) > 0) && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-200">✨ Estimated</span>}
                                </Label>
                                <Input type="number" step="0.01" value={typeForm.unitWeight} onChange={(e: any) => setTypeForm({...typeForm, unitWeight: e.target.value})} />
                            </Field>
                             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 self-end mb-1">
                                 <span className="text-xs font-bold text-black">Has Variance?</span>
                                 <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={typeForm.hasColor} onChange={(e: any) => setTypeForm({...typeForm, hasColor: e.target.checked})} />
                             </div>
                            <Field>
                                <Label>Variation Code</Label>
                                <Input maxLength={2} className="uppercase font-black text-center" placeholder="XX" value={typeForm.code} onChange={(e: any) => setTypeForm({...typeForm, code: e.target.value})} />
                            </Field>
                            {typeForm.hasColor && (
                                <div className="col-span-3">
                                    <Label>Color Selection</Label>
                                    <div className="flex gap-3 pt-2">
                                        {COMMON_COLORS.map((c) => (
                                            <button key={c.name} onClick={() => setTypeForm({ ...typeForm, color: c.name })} className={cn("w-10 h-10 rounded-full transition-all border-2 flex items-center justify-center", c.bg, typeForm.color === c.name ? "border-blue-500 scale-110 shadow-md" : "border-slate-100 hover:scale-105")}>
                                                {typeForm.color === c.name && <div className={cn("w-2 h-2 rounded-full", c.name === "White" ? "bg-black" : "bg-white")} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="col-span-3 flex justify-end gap-3 pt-6 border-t border-slate-50 mt-4">
                                <button type="button" onClick={() => { setShowAddForm(false); setEditingId(null); }} className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-black transition-all">Discard</button>
                                <button onClick={() => handleSubmit('productType', typeForm)} className={cn("btn-primary py-2.5 px-12 text-xs", editingId && "bg-orange-600 hover:bg-orange-700 shadow-orange-100")}>
                                    {editingId ? 'Update Variation' : 'Authorize Variant'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
                <div className="pane bg-white overflow-hidden">
                    <div className="pane-header flex justify-between items-center">
                        <span>Authorized Variants</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredTypes.length} Active Variants</span>
                    </div>
                    <table className={cn("w-full border-separate border-spacing-0", isAutoLayout ? "table-auto" : "table-fixed")}>
                        <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md">
                            <tr>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('code', 'w-[10%]'))} onDoubleClick={() => toggleColumnOverride('code')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Code</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50">
                                            <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.code} onChange={e => setColumnFilters({...columnFilters, code: e.target.value})} />
                                        </div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('master', 'w-[25%]'))} onDoubleClick={() => toggleColumnOverride('master')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Master Product</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50">
                                            <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.name} onChange={e => setColumnFilters({...columnFilters, name: e.target.value})} />
                                        </div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('specs', 'w-[25%]'))} onDoubleClick={() => toggleColumnOverride('specs')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Specs / Size</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('diameter', 'w-[12%]'))} onDoubleClick={() => toggleColumnOverride('diameter')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Diameter</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('weight', 'w-[12%]'))} onDoubleClick={() => toggleColumnOverride('weight')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Weight (G)</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                                <th className={cn("p-0 transition-all", getWidthClass('action', 'w-[16%]'))}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 min-h-[33px] flex items-center">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Status / Action</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTypes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((t: any) => (
                                <tr key={t.id} className={cn("group hover:bg-slate-50 transition-colors", !t.isActive && "opacity-40 grayscale-[0.5]")}>
                                    <td className="border-r border-slate-100 p-2 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-100 px-2 py-1 rounded font-black text-xs">{t.code}</span>
                                            {!t.isActive && <span className="text-[8px] font-bold text-slate-400 uppercase">Inactive</span>}
                                        </div>
                                    </td>
                                    <td className="font-bold border-r border-slate-100 p-2 text-left">{data.products?.find((p:any) => p.id === t.productId)?.name || t.productId}</td>
                                    <td className="border-r border-slate-100 p-2 text-left">
                                        <div className="flex items-center gap-2">
                                            {t.color && (
                                                <div className={cn("w-3 h-3 rounded-full border border-slate-200", COMMON_COLORS.find(c => c.name === t.color)?.bg || "bg-slate-400")} />
                                            )}
                                            {t.size} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t.sizeUnit || 'MM'}</span> {t.color ? '—' : ''} {t.color}
                                        </div>
                                    </td>
                                    <td className="border-r border-slate-100 p-2 text-left">{t.diameter || "—"} <span className="text-[9px] text-slate-400">MM</span></td>
                                    <td className="border-r border-slate-100 p-2 text-left font-bold">{t.unitWeight || "0"} <span className="text-[9px] text-slate-400">G</span></td>
                                    <td className="p-2 text-left">
                                        <div className="flex items-center gap-3">
                                            <button onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await fetch("/api/master", {
                                                        method: "POST",
                                                        body: JSON.stringify({ type: 'productType', action: 'toggleStatus', id: t.id }),
                                                    });
                                                    fetchData();
                                                }} className={cn("text-[10px] font-black uppercase px-2 py-1 rounded border transition-colors", t.isActive ? "text-red-500 border-red-100 hover:bg-red-50" : "text-green-600 border-green-100 hover:bg-green-50")}>
                                                {t.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => { setEditingId(t.id); setTypeForm({ productId: t.productId, size: t.size, sizeUnit: t.sizeUnit, diameter: t.diameter, unitWeight: t.unitWeight.toString(), color: t.color, code: t.code, hasColor: t.hasColor }); setShowAddForm(true); }} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-slate-100 font-bold"><Edit2 size={12} /></button>
                                            <button onClick={() => handleDelete('productType', t.id, `${t.code} - ${t.size}`)} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-600 transition-all shadow-sm border border-transparent hover:border-slate-100 font-bold"><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination total={filteredTypes.length} current={currentPage} onChange={setCurrentPage} itemsPerPage={itemsPerPage} />
                </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-6">
                {showAddForm && (
                    <Modal title={editingId ? 'Modify Partner' : 'Register Provider'} subtitle="Synchronized Master Protocol" icon={editingId ? <Edit2 size={20} /> : <Plus size={20} />} editing={!!editingId} onClose={() => { setShowAddForm(false); setEditingId(null); }}>
                        <div className="grid grid-cols-2 gap-6">
                            <Field>
                                <Label>Official Entity Name</Label>
                                <Input placeholder="e.g. Apex Global Hub" value={supplierForm.name} onChange={(e: any) => setSupplierForm({...supplierForm, name: e.target.value})} />
                            </Field>
                            <Field>
                                <Label>Contact Credentials</Label>
                                <Input placeholder="Email or GST Number" value={supplierForm.contact} onChange={(e: any) => setSupplierForm({...supplierForm, contact: e.target.value})} />
                            </Field>
                            <div className="col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-50 mt-4">
                                <button type="button" onClick={() => { setShowAddForm(false); setEditingId(null); }} className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-black transition-all">Discard</button>
                                <button onClick={() => handleSubmit('supplier', supplierForm)} className={cn("btn-primary py-2.5 px-12 text-xs", editingId && "bg-orange-600 hover:bg-orange-700 shadow-orange-100")}>
                                    {editingId ? 'Update Partner' : 'Register Provider'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
                <div className="pane bg-white overflow-hidden">
                    <div className="pane-header flex justify-between items-center">
                        <span>Verified Partners</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredSuppliers.length} Active Entities</span>
                    </div>
                    <table className={cn("w-full border-separate border-spacing-0", isAutoLayout ? "table-auto" : "table-fixed")}>
                        <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md">
                            <tr>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('name', 'w-[25%]'))} onDoubleClick={() => toggleColumnOverride('name')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Supplier Name</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50">
                                            <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.name} onChange={e => setColumnFilters({...columnFilters, name: e.target.value})} />
                                        </div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('contact', 'w-[20%]'))} onDoubleClick={() => toggleColumnOverride('contact')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Contact / Person</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50">
                                            <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.contact} onChange={e => setColumnFilters({...columnFilters, contact: e.target.value})} />
                                        </div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('address', 'w-[40%]'))} onDoubleClick={() => toggleColumnOverride('address')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Operation Address</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                                <th className={cn("p-0 transition-all", getWidthClass('action', 'w-[15%]'))}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 min-h-[33px] flex items-center">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Action</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map((s: any) => (
                                <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="font-bold border-r border-slate-100 p-2 text-left">{s.name}</td>
                                    <td className="border-r border-slate-100 p-2 text-left">{s.contact}</td>
                                    <td className="border-r border-slate-100 p-2 text-left text-xs text-slate-500">{s.address}</td>
                                    <td className="p-2 text-left">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setEditingId(s.id); setSupplierForm({ name: s.name, contact: s.contact, address: s.address }); setShowAddForm(true); }} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-slate-100 font-bold"><Edit2 size={12} /></button>
                                            <button onClick={() => handleDelete('supplier', s.id, s.name)} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-600 transition-all shadow-sm border border-transparent hover:border-slate-100 font-bold"><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6">
                {showAddForm && (
                    <Modal title={editingId ? 'Modify Personnel' : 'Authorize Staff'} subtitle="Synchronized Master Protocol" icon={editingId ? <Edit2 size={20} /> : <Plus size={20} />} editing={!!editingId} onClose={() => { setShowAddForm(false); setEditingId(null); }} maxWidth="max-w-4xl">
                        <div className="grid grid-cols-3 gap-6">
                            <Field>
                                <Label>Full Legal Name</Label>
                                <Input placeholder="e.g. Mike Torello" value={employeeForm.name} onChange={(e: any) => setEmployeeForm({...employeeForm, name: e.target.value})} />
                            </Field>
                            <Field>
                                <Label>Employee ID Code</Label>
                                <Input placeholder="e.g. EMP001" className="uppercase font-bold tracking-widest" value={employeeForm.idCode} onChange={(e: any) => setEmployeeForm({...employeeForm, idCode: e.target.value})} />
                            </Field>
                            <Field>
                                <Label>Operational Designation</Label>
                                <Select value={employeeForm.designation} onChange={(e: any) => setEmployeeForm({...employeeForm, designation: e.target.value})}>
                                    <option value="">-- Select Role --</option>
                                    <option value="Administrator">Administrator</option>
                                    <option value="Production Manager">Production Manager</option>
                                    <option value="Inventory Supervisor">Inventory Supervisor</option>
                                    <option value="Quality Inspector">Quality Inspector</option>
                                    <option value="Operator">Operator</option>
                                </Select>
                            </Field>
                            <Field>
                                <Label>Authentication Code</Label>
                                <Input maxLength={4} className="font-mono text-center tracking-[0.5em] text-blue-600 font-black" placeholder="••••" value={employeeForm.authCode} onChange={(e: any) => setEmployeeForm({...employeeForm, authCode: e.target.value})} />
                            </Field>
                            <div className="col-span-3 flex justify-end gap-3 pt-6 border-t border-slate-50 mt-4">
                                <button type="button" onClick={() => { setShowAddForm(false); setEditingId(null); }} className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-black transition-all">Discard</button>
                                <button onClick={() => handleSubmit('employee', employeeForm)} className={cn("btn-primary py-2.5 px-12 text-xs", editingId && "bg-orange-600 hover:bg-orange-700 shadow-orange-100")}>
                                    {editingId ? 'Update Personnel' : 'Authorize Access'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
                <div className="pane bg-white overflow-hidden">
                    <div className="pane-header flex justify-between items-center">
                        <span>Staff Identification Registry</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredEmployees.length} Active Personnel</span>
                    </div>
                    <table className={cn("w-full border-separate border-spacing-0", isAutoLayout ? "table-auto" : "table-fixed")}>
                        <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md">
                            <tr>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('name', 'w-[30%]'))} onDoubleClick={() => toggleColumnOverride('name')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Personnel Name</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50">
                                            <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.name} onChange={e => setColumnFilters({...columnFilters, name: e.target.value})} />
                                        </div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('id', 'w-[15%]'))} onDoubleClick={() => toggleColumnOverride('id')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Entity ID</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('designation', 'w-[25%]'))} onDoubleClick={() => toggleColumnOverride('designation')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Designation</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50">
                                            <input className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 placeholder:text-slate-300 shadow-sm" placeholder="Filter..." value={columnFilters.category} onChange={e => setColumnFilters({...columnFilters, category: e.target.value})} />
                                        </div>
                                    </div>
                                </th>
                                <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('auth', 'w-[15%]'))} onDoubleClick={() => toggleColumnOverride('auth')}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Auth Code</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                                <th className={cn("p-0 transition-all", getWidthClass('action', 'w-[15%]'))}>
                                    <div className="flex flex-col">
                                        <div className="px-2 py-2 border-b border-slate-100 min-h-[33px] flex items-center">
                                           <span className="text-[9px] uppercase font-bold text-slate-400">Action</span>
                                        </div>
                                        <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((e: any) => (
                                <tr key={e.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="border-r border-slate-100 p-2 text-left">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                                {e.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-black text-xs uppercase tracking-tight">{e.name}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{e.idCode}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="border-r border-slate-100 p-2 text-left">
                                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-widest">{e.idCode}</span>
                                    </td>
                                    <td className="border-r border-slate-100 p-2 text-left">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-black uppercase tracking-tight">{e.designation}</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Master Level</span>
                                        </div>
                                    </td>
                                    <td className="border-r border-slate-100 p-2 text-left">
                                        <div className="flex items-center gap-2 font-mono text-xs font-black text-blue-600/40">
                                            •••• {e.authCode}
                                        </div>
                                    </td>
                                    <td className="p-2 text-left">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setEditingId(e.id); setEmployeeForm({ name: e.name, idCode: e.idCode, designation: e.designation, authCode: e.authCode }); setShowAddForm(true); }} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-slate-100 font-bold"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete('employee', e.id, e.name)} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-600 transition-all shadow-sm border border-transparent hover:border-slate-100 font-bold"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination total={filteredEmployees.length} current={currentPage} onChange={setCurrentPage} itemsPerPage={itemsPerPage} />
                </div>
            </div>
          )}
        </div>
      </div>
      {confirmModal && (
          <ConfirmationModal 
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(null)}
            onConfirm={confirmModal.onConfirm}
            title={confirmModal.title}
            message={confirmModal.message}
            type={confirmModal.type}
          />
      )}
    </div>
  );
}

function Pagination({ total, current, onChange, itemsPerPage }: { total: number, current: number, onChange: (p: number) => void, itemsPerPage: number }) {
    const totalPages = Math.ceil(total / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {Math.min(total, (current - 1) * itemsPerPage + 1)}-{Math.min(total, current * itemsPerPage)} of {total} units
            </p>
            <div className="flex items-center gap-2">
                <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1} className="px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white">PREVIOUS</button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                        <button key={i} onClick={() => onChange(i + 1)} className={cn("w-7 h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center border", current === i + 1 ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300")}>{i + 1}</button>
                    ))}
                </div>
                <button onClick={() => onChange(Math.min(totalPages, current + 1))} disabled={current === totalPages} className="px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white">NEXT</button>
            </div>
        </div>
    );
}

function Modal({ title, subtitle, icon, editing, onClose, children, maxWidth = "max-w-6xl" }: any) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={cn("pane p-8 bg-white border-blue-200 shadow-2xl w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 relative", maxWidth)}>
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-black transition-all"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", editing ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500")}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-black uppercase tracking-tight">{title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{subtitle}</p>
                        </div>
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}

function Tab({ text, active, onClick }: { text: string, active: boolean, onClick: () => void }) {
    return (
        <button onClick={onClick} className={cn("pb-3 text-sm font-bold transition-all border-b-2 px-1 translate-y-[1px]", active ? "text-black border-blue-500" : "text-slate-400 border-transparent hover:text-slate-600")}>
            {text}
        </button>
    )
}

function Field({ children, className }: any) {
    return <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>;
}

function Label({ children, className }: any) {
    return <label className={cn("text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-0.5", className)}>{children}</label>;
}

function Input({ className, ...props }: any) {
    return <input className={cn("w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 outline-none font-medium text-sm text-black focus:border-blue-500 transition-all placeholder:text-slate-300", className)} {...props} />;
}

function Select({ children, className, ...props }: any) {
    return <select className={cn("w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 outline-none font-bold text-sm text-black focus:border-blue-500 transition-all cursor-pointer", className)} {...props}>{children}</select>;
}
