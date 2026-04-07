"use client";

import { useEffect, useState } from "react";
import { Search, Plus, QrCode, TrendingUp, Package, Layers, Calendar, Filter, Download, ChevronRight, Info, AlertCircle, Edit2, Trash2, X, Maximize2, Minimize2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ConfirmationModal } from "@/components/ConfirmationModal";

export default function InwardPage() {
    const [data, setData] = useState<any>({ materials: [], products: [], types: [], suppliers: [], inwards: [] });
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState(() => {
        const to = new Date().toISOString().split('T')[0];
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getUTCMonth() - 1);
        const from = fromDate.toISOString().split('T')[0];
        return { from, to };
    });

    const [columnFilters, setColumnFilters] = useState({
        batchCode: "",
        date: "",
        product: "",
        pcs: "",
        consumption: ""
    });
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
        batchCode: [],
        date: [],
        product: [],
        pcs: [],
        consumption: []
    });
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [activeFilterPopup, setActiveFilterPopup] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, key: string } | null>(null);
    const [isAutoLayout, setIsAutoLayout] = useState(false);
    const [columnOverrides, setColumnOverrides] = useState<Set<string>>(new Set());

    // Load/Save layout settings
    useEffect(() => {
        const savedLayout = localStorage.getItem("tableLayout_inward");
        if (savedLayout) {
            const { isAuto, overrides } = JSON.parse(savedLayout);
            setIsAutoLayout(isAuto);
            setColumnOverrides(new Set(overrides));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("tableLayout_inward", JSON.stringify({
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

    // Entry Form
    const [entryForm, setEntryForm] = useState({
        date: new Date().toISOString().split('T')[0],
        productId: "",
        pcs: "",
        materialId: "",
        typeId: "",
        notes: ""
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'save' | 'delete'; onConfirm: () => void } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const [mRes, iRes] = await Promise.all([
            fetch("/api/master"),
            fetch("/api/inward")
        ]);
        const master = await mRes.json();
        const inwards = await iRes.json();
        setData({ ...master, inwards });

        if (master.products.length > 0 && !entryForm.productId) {
            const firstProduct = master.products[0];
            const types = master.types.filter((t: any) => t.productId === firstProduct.id && t.isActive !== false);
            setEntryForm(prev => ({ ...prev, productId: firstProduct.id, typeId: types[0]?.id || "" }));
        }
        if (master.materials.length > 0 && !entryForm.materialId) {
            setEntryForm(prev => ({ ...prev, materialId: master.materials[0].id }));
        }
    }

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEditing = !!editingId;

        setConfirmModal({
            isOpen: true,
            title: isEditing ? "Save Changes?" : "Confirm Batch Entry?",
            message: isEditing ? "Are you sure you want to update this batch's records?" : "Are you sure you want to register this new production batch?",
            type: 'save',
            onConfirm: async () => {
                const selectedType = data.types.find((t: any) => t.id === entryForm.typeId);
                const unitWeight = selectedType?.unitWeight || 0;
                const materialQuantity = (Number(entryForm.pcs) * Number(unitWeight)) / 1000;

                await fetch("/api/inward", {
                    method: isEditing ? "PUT" : "POST",
                    body: JSON.stringify({ ...entryForm, materialQuantity, id: editingId }),
                });

                setShowAddForm(false);
                setEditingId(null);
                setEntryForm({
                    date: new Date().toISOString().split('T')[0],
                    productId: data.products[0]?.id || "",
                    pcs: "",
                    materialId: data.materials[0]?.id || "",
                    typeId: "",
                    notes: ""
                });
                fetchData();
            }
        });
    };

    const handleDelete = (id: string, batchCode: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Confirm Deletion",
            message: `Are you sure you want to delete batch "${batchCode}"? This action will restore consumed material quantities and cannot be undone.`,
            type: 'delete',
            onConfirm: async () => {
                await fetch("/api/inward", {
                    method: "DELETE",
                    body: JSON.stringify({ id }),
                });
                fetchData();
            }
        });
    };

    const getProductCode = (id: string) => data.products.find((p: any) => p.id === id)?.code || "??";
    const getMaterialCode = (id: string) => data.materials.find((m: any) => m.id === id)?.code || "??";
    const getTypeCode = (id: string) => data.types.find((t: any) => t.id === id)?.code || "??";

    const nextBatchNo = (data.inwards.length + 1).toString().padStart(3, '0');
    const tempBatchCode = editingId
        ? data.inwards.find((i: any) => i.id === editingId)?.batchCode
        : `${getProductCode(entryForm.productId)}${getMaterialCode(entryForm.materialId)}${getTypeCode(entryForm.typeId)}${nextBatchNo}`.toUpperCase();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const filteredInwards = data.inwards.filter((i: any) => {
        const productCode = getProductCode(i.productId);
        const materialCode = getMaterialCode(i.materialId);
        
        const matchesGlobalSearch = (i.batchCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            materialCode.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDate = (!dateFilter.from || i.date >= dateFilter.from) &&
            (!dateFilter.to || i.date <= dateFilter.to);

        const matchesColumnFilters = 
            (i.batchCode || '').toLowerCase().includes(columnFilters.batchCode.toLowerCase()) &&
            (i.date || '').toLowerCase().includes(columnFilters.date.toLowerCase()) &&
            (productCode.toLowerCase().includes(columnFilters.product.toLowerCase())) &&
            (i.pcs?.toString() || '').includes(columnFilters.pcs) &&
            (materialCode.toLowerCase().includes(columnFilters.consumption.toLowerCase()));

        const matchesMultiSelect = 
            (selectedFilters.batchCode.length === 0 || selectedFilters.batchCode.includes(i.batchCode)) &&
            (selectedFilters.date.length === 0 || selectedFilters.date.includes(i.date)) &&
            (selectedFilters.product.length === 0 || selectedFilters.product.includes(i.productId)) &&
            (selectedFilters.pcs.length === 0 || selectedFilters.pcs.includes(i.pcs?.toString())) &&
            (selectedFilters.consumption.length === 0 || selectedFilters.consumption.includes(i.materialId));

        return matchesGlobalSearch && matchesDate && matchesColumnFilters && matchesMultiSelect;
    });

    const sortedInwards = [...filteredInwards].sort((a: any, b: any) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        let aVal = a[key === 'product' ? 'productId' : key === 'consumption' ? 'materialId' : key];
        let bVal = b[key === 'product' ? 'productId' : key === 'consumption' ? 'materialId' : key];

        if (key === 'product') { aVal = getProductCode(a.productId); bVal = getProductCode(b.productId); }
        if (key === 'consumption') { aVal = getMaterialCode(a.materialId); bVal = getMaterialCode(b.materialId); }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const finalInwards = sortConfig ? sortedInwards : sortedInwards.reverse(); 
    const paginatedInwards = finalInwards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        const isActive = sortConfig?.key === key;
        return (
            <div className="inline-flex flex-col ml-1.5 translate-y-[1px]">
                <TrendingUp size={10} className={cn("transition-all", isActive && sortConfig?.direction === 'asc' ? "text-blue-600" : "text-slate-400")} />
                <TrendingUp size={10} className={cn("transition-all rotate-180 -mt-1", isActive && sortConfig?.direction === 'desc' ? "text-blue-600" : "text-slate-400")} />
            </div>
        );
    };

    const getUniqueValues = (key: string) => {
        const values = data.inwards.map((i: any) => {
            if (key === 'batchCode') return i.batchCode;
            if (key === 'date') return i.date;
            if (key === 'product') return i.productId;
            if (key === 'pcs') return i.pcs?.toString();
            if (key === 'consumption') return i.materialId;
            return null;
        }).filter(Boolean);
        return Array.from(new Set(values));
    };

    const toggleFilterValue = (key: string, value: string) => {
        const current = selectedFilters[key] || [];
        const next = current.includes(value) 
            ? current.filter((v: string) => v !== value) 
            : [...current, value];
        setSelectedFilters({ ...selectedFilters, [key]: next });
    };

    const clearColumnFilters = (key: string) => {
        setColumnFilters({ ...columnFilters, [key as keyof typeof columnFilters]: "" });
        setSelectedFilters({ ...selectedFilters, [key]: [] });
    };

    const handleContextMenu = (e: React.MouseEvent, key: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, key });
    };

    const selectedType = data.types.find((t: any) => t.id === entryForm.typeId);
    const currentWeight = selectedType?.unitWeight || 0;
    const currentConsumption = (Number(entryForm.pcs || 0) * currentWeight) / 1000;

    return (
        <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Main Panel: Operations */}
            <div className="flex-1 space-y-6">

                {/* Navigation/Actions */}
                <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex gap-8 pb-3">
                        <span className="text-sm font-bold text-black border-b-2 border-blue-500 px-1 translate-y-[1px]">Batch Registry</span>
                    </div>
                    <div className="flex items-center gap-3 pb-3">
                        {/* Search moved up */}
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                className="w-full search-input pl-14 pr-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200 outline-none font-medium text-[11px] text-black placeholder:text-slate-300 focus:border-blue-500 transition-all focus:bg-white"
                                placeholder="Filter Hub..."
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        {/* Date Filters moved up */}
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <Calendar size={14} className="text-slate-400" />
                            <input type="date" className="bg-transparent outline-none font-bold text-black" value={dateFilter.from} onChange={(e: any) => { setDateFilter({ ...dateFilter, from: e.target.value }); setCurrentPage(1); }} />
                            <span className="text-slate-300 mx-1">→</span>
                            <input type="date" className="bg-transparent outline-none font-bold text-black" value={dateFilter.to} onChange={(e: any) => { setDateFilter({ ...dateFilter, to: e.target.value }); setCurrentPage(1); }} />
                        </div>

                        <button
                            onClick={() => {
                                setEditingId(null);
                                setEntryForm({
                                    date: new Date().toISOString().split('T')[0],
                                    productId: data.products[0]?.id || "",
                                    pcs: "",
                                    materialId: data.materials[0]?.id || "",
                                    typeId: "",
                                    notes: ""
                                });
                                setShowAddForm(true);
                            }}
                            className="btn-primary py-1.5 px-4 text-[11px] h-auto shadow-none"
                        >
                            <Plus size={14} className="mr-2" /> NEW BATCH EVENT
                        </button>
                    </div>
                </div>

                {/* Modal Overlay for Form */}
                {showAddForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="pane p-8 bg-white border-blue-200 shadow-2xl w-full max-w-6xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 relative">
                            <button
                                onClick={() => { setShowAddForm(false); setEditingId(null); }}
                                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-black transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", editingId ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500")}>
                                        {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-black uppercase tracking-tight">{editingId ? 'Modify Production Batch' : 'Configure New Production Batch'}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Synchronized Registry Protocol</p>
                                    </div>
                                </div>
                                <div className="bg-slate-900 px-6 py-2 rounded-xl text-white font-mono text-xs font-bold tracking-widest flex items-center gap-3">
                                    <span className="text-slate-500 font-sans text-[10px] uppercase">Batch Code:</span>
                                    {tempBatchCode}
                                </div>
                            </div>

                            <form onSubmit={handleAddEntry} className="grid grid-cols-3 gap-6">
                                <Field>
                                    <Label>Operational Date</Label>
                                    <Input type="date" value={entryForm.date} onChange={(e: any) => setEntryForm({ ...entryForm, date: e.target.value })} />
                                </Field>
                                <Field>
                                    <Label>Base Master Product</Label>
                                    <Select value={entryForm.productId} onChange={(e: any) => {
                                        const types = data.types.filter((t: any) => t.productId === e.target.value && t.isActive !== false);
                                        setEntryForm({ ...entryForm, productId: e.target.value, typeId: types[0]?.id || "" });
                                    }}>
                                        {data.products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                                    </Select>
                                </Field>
                                <Field>
                                    <Label>Standard Variation</Label>
                                    <Select value={entryForm.typeId} onChange={(e: any) => setEntryForm({ ...entryForm, typeId: e.target.value })}>
                                        <option value="">-- Choose Type --</option>
                                        {data.types.filter((t: any) => t.productId === entryForm.productId && t.isActive !== false).map((t: any) => <option key={t.id} value={t.id}>{t.size} {t.sizeUnit} {t.color ? `- ${t.color}` : ''}</option>)}
                                    </Select>
                                </Field>
                                <Field>
                                    <Label>Yield Target (PCS)</Label>
                                    <Input required type="number" className="text-lg font-bold" value={entryForm.pcs} onChange={(e: any) => setEntryForm({ ...entryForm, pcs: e.target.value })} />
                                </Field>
                                <Field>
                                    <Label>Resource Material</Label>
                                    <Select value={entryForm.materialId} onChange={(e: any) => setEntryForm({ ...entryForm, materialId: e.target.value })}>
                                        {data.materials.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                                    </Select>
                                </Field>
                                <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100">
                                    <div className="flex flex-col">
                                        <Label className="ml-0 text-blue-400">Unit Weight</Label>
                                        <p className="font-bold text-xs text-blue-700">
                                            {currentWeight} G
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">Auto Consumption</p>
                                        <p className="text-xl font-bold text-blue-700 leading-none tracking-tight">
                                            {currentConsumption.toFixed(2)} KG
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-3 flex gap-4 pt-6 border-t border-slate-50">
                                    <button type="submit" className={cn("flex-1 py-3 btn-primary", editingId && "bg-orange-600 hover:bg-orange-700")}>
                                        {editingId ? 'Update Batch Registry' : 'Commit to Registry'}
                                    </button>
                                    <button type="button" onClick={() => { setShowAddForm(false); setEditingId(null); }} className="px-8 py-3 rounded-lg text-sm font-bold text-slate-400 hover:text-black transition-all">Dismiss</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Registry Section */}
                <div className="space-y-4">

                    <div className="pane bg-white min-h-[400px]">
                        <div className="pane-header flex justify-between items-center bg-slate-50/50">
                            <span>Synchronized Registry History</span>
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
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredInwards.length} Events</span>
                            </div>
                        </div>

                        <table className={cn("w-full border-separate border-spacing-0", isAutoLayout ? "table-auto" : "table-fixed")}>
                            <thead className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md">
                                <tr className="relative">
                                    <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('batchCode', 'w-[15%]'))} onDoubleClick={() => toggleColumnOverride('batchCode')} title="Double-click to auto-adjust this column">
                                        <div className="flex flex-col group relative" onContextMenu={(e) => handleContextMenu(e, 'batchCode')}>
                                            <div className="flex items-center justify-between px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('batchCode')}>
                                                <span className="text-[9px] uppercase font-bold text-slate-400">Batch Identity</span>
                                                <div className="flex items-center gap-1">
                                                    {getSortIcon('batchCode')}
                                                    <Filter size={10} className={cn("cursor-pointer hover:text-blue-500 transition-colors", selectedFilters.batchCode.length > 0 ? "text-blue-500" : "text-slate-400")} onClick={(e) => { e.stopPropagation(); setActiveFilterPopup(activeFilterPopup === 'batchCode' ? null : 'batchCode'); }} />
                                                </div>
                                            </div>
                                            {activeFilterPopup === 'batchCode' && (
                                                <FilterPopup columnKey="batchCode" values={getUniqueValues('batchCode')} selected={selectedFilters.batchCode} onToggle={(v: any) => toggleFilterValue('batchCode', v)} onClose={() => setActiveFilterPopup(null)} />
                                            )}
                                            <div className="px-1.5 py-1.5 bg-slate-50/50">
                                                <input 
                                                    className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-slate-300 shadow-sm transition-all" 
                                                    placeholder="Filter..." 
                                                    value={columnFilters.batchCode}
                                                    onChange={e => setColumnFilters({...columnFilters, batchCode: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('date', 'w-[12%]'))} onDoubleClick={() => toggleColumnOverride('date')} title="Double-click to auto-adjust this column">
                                        <div className="flex flex-col relative" onContextMenu={(e) => handleContextMenu(e, 'date')}>
                                            <div className="flex items-center justify-between px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('date')}>
                                                <span className="text-[9px] uppercase font-bold text-slate-400">Date</span>
                                                <div className="flex items-center gap-1">
                                                    {getSortIcon('date')}
                                                    <Filter size={10} className={cn("cursor-pointer hover:text-blue-500 transition-colors", selectedFilters.date.length > 0 ? "text-blue-500" : "text-slate-400")} onClick={(e) => { e.stopPropagation(); setActiveFilterPopup(activeFilterPopup === 'date' ? null : 'date'); }} />
                                                </div>
                                            </div>
                                            {activeFilterPopup === 'date' && (
                                                <FilterPopup columnKey="date" values={getUniqueValues('date')} selected={selectedFilters.date} onToggle={(v: any) => toggleFilterValue('date', v)} onClose={() => setActiveFilterPopup(null)} />
                                            )}
                                            <div className="px-1.5 py-1.5 bg-slate-50/50">
                                                <input 
                                                    className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-slate-300 shadow-sm transition-all" 
                                                    placeholder="Filter..." 
                                                    value={columnFilters.date}
                                                    onChange={e => setColumnFilters({...columnFilters, date: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('product', 'w-[35%]'))} onDoubleClick={() => toggleColumnOverride('product')} title="Double-click to auto-adjust this column">
                                        <div className="flex flex-col relative" onContextMenu={(e) => handleContextMenu(e, 'product')}>
                                            <div className="flex items-center justify-between px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('product')}>
                                                <span className="text-[9px] uppercase font-bold text-slate-400">Master / Specification</span>
                                                <div className="flex items-center gap-1">
                                                    {getSortIcon('product')}
                                                    <Filter size={10} className={cn("cursor-pointer hover:text-blue-500 transition-colors", selectedFilters.product.length > 0 ? "text-blue-500" : "text-slate-400")} onClick={(e) => { e.stopPropagation(); setActiveFilterPopup(activeFilterPopup === 'product' ? null : 'product'); }} />
                                                </div>
                                            </div>
                                            {activeFilterPopup === 'product' && (
                                                <FilterPopup columnKey="product" values={getUniqueValues('product')} selected={selectedFilters.product} onToggle={(v: any) => toggleFilterValue('product', v)} onClose={() => setActiveFilterPopup(null)} labelFunc={(v: any) => data.products.find((p: any) => p.id === v)?.name || v} />
                                            )}
                                            <div className="px-1.5 py-1.5 bg-slate-50/50">
                                                <input 
                                                    className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-slate-300 shadow-sm transition-all" 
                                                    placeholder="Filter..." 
                                                    value={columnFilters.product}
                                                    onChange={e => setColumnFilters({...columnFilters, product: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('pcs', 'w-[12%]'))} onDoubleClick={() => toggleColumnOverride('pcs')} title="Double-click to auto-adjust this column">
                                        <div className="flex flex-col relative" onContextMenu={(e) => handleContextMenu(e, 'pcs')}>
                                            <div className="flex items-center justify-between px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('pcs')}>
                                                <span className="text-[9px] uppercase font-bold text-slate-400">Yield (Pcs)</span>
                                                <div className="flex items-center gap-1">
                                                    {getSortIcon('pcs')}
                                                    <Filter size={10} className={cn("cursor-pointer hover:text-blue-500 transition-colors", selectedFilters.pcs.length > 0 ? "text-blue-500" : "text-slate-400")} onClick={(e) => { e.stopPropagation(); setActiveFilterPopup(activeFilterPopup === 'pcs' ? null : 'pcs'); }} />
                                                </div>
                                            </div>
                                            {activeFilterPopup === 'pcs' && (
                                                <FilterPopup columnKey="pcs" values={getUniqueValues('pcs')} selected={selectedFilters.pcs} onToggle={(v: any) => toggleFilterValue('pcs', v)} onClose={() => setActiveFilterPopup(null)} width="w-32" />
                                            )}
                                            <div className="px-1.5 py-1.5 bg-slate-50/50">
                                                <input 
                                                    className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-slate-300 shadow-sm transition-all" 
                                                    placeholder="Filter..." 
                                                    value={columnFilters.pcs}
                                                    onChange={e => setColumnFilters({...columnFilters, pcs: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th className={cn("border-r border-slate-100 p-0 transition-all", getWidthClass('consumption', 'w-[18%]'))} onDoubleClick={() => toggleColumnOverride('consumption')} title="Double-click to auto-adjust this column">
                                        <div className="flex flex-col relative" onContextMenu={(e) => handleContextMenu(e, 'consumption')}>
                                            <div className="flex items-center justify-between px-2 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('consumption')}>
                                                <span className="text-[9px] uppercase font-bold text-slate-400">Consumption</span>
                                                <div className="flex items-center gap-1">
                                                    {getSortIcon('consumption')}
                                                    <Filter size={10} className={cn("cursor-pointer hover:text-blue-500 transition-colors", selectedFilters.consumption.length > 0 ? "text-blue-500" : "text-slate-400")} onClick={(e) => { e.stopPropagation(); setActiveFilterPopup(activeFilterPopup === 'consumption' ? null : 'consumption'); }} />
                                                </div>
                                            </div>
                                            {activeFilterPopup === 'consumption' && (
                                                <FilterPopup columnKey="consumption" values={getUniqueValues('consumption')} selected={selectedFilters.consumption} onToggle={(v: any) => toggleFilterValue('consumption', v)} onClose={() => setActiveFilterPopup(null)} labelFunc={(v: any) => data.materials.find((m: any) => m.id === v)?.name || v} align="right" />
                                            )}
                                            <div className="px-1.5 py-1.5 bg-slate-50/50">
                                                <input 
                                                    className="w-full text-[9px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-slate-300 shadow-sm transition-all" 
                                                    placeholder="Filter..." 
                                                    value={columnFilters.consumption}
                                                    onChange={e => setColumnFilters({...columnFilters, consumption: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </th>
                                    <th className={cn("transition-all", getWidthClass('action', 'w-[8%]'))}>
                                        <div className="flex flex-col h-full">
                                            <div className="px-2 py-2 border-b border-slate-100 min-h-[33px] flex items-center">
                                                <span className="text-[9px] uppercase font-bold text-slate-400">Action</span>
                                            </div>
                                            <div className="px-1.5 py-1.5 bg-slate-50/50 min-h-[33px]"></div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedInwards.map((i: any) => (
                                    <tr key={i.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="border-r border-slate-50 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center font-mono text-[10px] group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                    <QrCode size={14} />
                                                </div>
                                                <span className="font-bold text-black text-xs uppercase tracking-widest">{i.batchCode}</span>
                                            </div>
                                        </td>
                                        <td className="border-r border-slate-50 text-left">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(i.date)}</span>
                                        </td>
                                        <td className="border-r border-slate-50 text-left">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-black text-xs uppercase tracking-tight">{data.products.find((p: any) => p.id === i.productId)?.name}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{data.types.find((t: any) => t.id === i.typeId)?.size}</span>
                                            </div>
                                        </td>
                                        <td className="border-r border-slate-50 text-left">
                                            <div className="flex items-center justify-start gap-2">
                                                <span className="text-xs font-black text-black">{i.pcs}</span>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase">Pcs</span>
                                            </div>
                                        </td>
                                        <td className="border-r border-slate-50 text-left">
                                            <div className="flex flex-col items-start">
                                                <span className="text-xs font-bold text-blue-600">-{i.materialQuantity.toFixed(2)} KG</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{getMaterialCode(i.materialId)}</span>
                                            </div>
                                        </td>
                                        <td className="text-left">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => {
                                                    setEditingId(i.id);
                                                    setEntryForm({
                                                        date: i.date,
                                                        productId: i.productId,
                                                        pcs: i.pcs.toString(),
                                                        materialId: i.materialId,
                                                        typeId: i.typeId,
                                                        notes: i.notes || ""
                                                    });
                                                    setShowAddForm(true);
                                                }} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition-all shadow-sm border border-transparent hover:border-slate-100"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete(i.id, i.batchCode)} className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-600 transition-all shadow-sm border border-transparent hover:border-slate-100"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <Pagination total={filteredInwards.length} current={currentPage} onChange={(p) => setCurrentPage(p)} itemsPerPage={itemsPerPage} />

                        {/* Right Click Context Menu */}
                        {contextMenu && (
                            <div 
                                className="fixed z-[200] bg-white border border-slate-200 shadow-xl rounded-lg py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
                                style={{ top: contextMenu.y, left: contextMenu.x }}
                                onMouseLeave={() => setContextMenu(null)}
                            >
                                <button className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2" onClick={() => { handleSort(contextMenu.key); setContextMenu(null); }}>
                                    {sortConfig?.key === contextMenu.key && sortConfig.direction === 'asc' ? 'Sorted Asc' : 'Sort Low to High'}
                                </button>
                                <button className="w-full text-left px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600" onClick={() => { setSortConfig({ key: contextMenu.key, direction: 'desc' }); setContextMenu(null); }}>
                                    Sort High to Low
                                </button>
                                <div className="h-[1px] bg-slate-100 my-1"></div>
                                <button className="w-full text-left px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50" onClick={() => { clearColumnFilters(contextMenu.key); setContextMenu(null); }}>
                                    Clear Filter
                                </button>
                            </div>
                        )}
                    </div>
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

// --- Helper UI Components ---

function FilterPopup({ columnKey, values, selected, onToggle, onClose, labelFunc, width = "w-48", align = "left" }: any) {
    return (
        <div className={cn(
            "absolute top-full z-50 mt-1 bg-white border border-slate-200 shadow-2xl rounded-lg p-2 animate-in slide-in-from-top-2 duration-200",
            width,
            align === "right" ? "right-0" : "left-0"
        )} onMouseLeave={onClose}>
            <div className="flex items-center justify-between mb-2 px-1 border-b border-slate-50 pb-1">
                <span className="text-[9px] font-black text-slate-300 uppercase">Selected ({selected.length})</span>
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-slate-300 hover:text-black transition-colors"><X size={10} /></button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                {values.length === 0 ? (
                    <div className="text-[10px] text-slate-300 py-2 text-center italic">No values</div>
                ) : (
                    values.sort().map((v: any) => (
                        <div key={v} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors group" onClick={() => onToggle(v)}>
                            <div className={cn(
                                "w-3 h-3 rounded flex items-center justify-center border transition-all",
                                selected.includes(v) ? "bg-blue-500 border-blue-500" : "bg-white border-slate-200 group-hover:border-slate-300"
                            )}>
                                {selected.includes(v) && <div className="w-1 h-1 bg-white rounded-full" />}
                            </div>
                            <span className={cn("text-[10px] font-medium transition-colors truncate", selected.includes(v) ? "text-blue-600 font-bold" : "text-slate-500")}>
                                {labelFunc ? labelFunc(v) : v}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function Pagination({ total, current, onChange, itemsPerPage }: { total: number, current: number, onChange: (p: number) => void, itemsPerPage: number }) {
    const totalPages = Math.ceil(total / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {Math.min(total, (current - 1) * itemsPerPage + 1)}-{Math.min(total, current * itemsPerPage)} of {total} events
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange(Math.max(1, current - 1))}
                    disabled={current === 1}
                    className="px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
                >
                    PREVIOUS
                </button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onChange(i + 1)}
                            className={cn(
                                "w-7 h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center border",
                                current === i + 1
                                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                    : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                            )}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onChange(Math.min(totalPages, current + 1))}
                    disabled={current === totalPages}
                    className="px-3 py-1 rounded-lg border border-slate-200 text-[10px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
                >
                    NEXT
                </button>
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
