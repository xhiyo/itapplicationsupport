import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { getTickets, getPicIt, getPicKpis, createPicKpi, updatePicKpi, deletePicKpi } from "../services/api";
import {
  FileText, Search, Download, Calendar,
  ChevronDown, ChevronLeft, ChevronRight, Ticket,
  CheckCircle2, AlertTriangle, Layers, Target, Users, LayoutDashboard, Plus, Trash2, Edit2, Save, X
} from "lucide-react";
import * as XLSX from "xlsx";

export default function Laporan() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("kpi"); // 'kpi' or 'global'

  const [tickets, setTickets] = useState([]);
  const [pics, setPics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global Laporan Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Layanan");
  const [picFilter, setPicFilter] = useState("Semua PIC");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // KPI Tab States
  const [selectedKpiPicId, setSelectedKpiPicId] = useState(null);
  const [customKpis, setCustomKpis] = useState([]);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [editingKpiId, setEditingKpiId] = useState(null);
  const [editKpiForm, setEditKpiForm] = useState({ kpi_name: '', target_value: 0, unit: '' });
  const [isCreatingKpi, setIsCreatingKpi] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, categoryFilter, picFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'kpi' && selectedKpiPicId) {
      fetchCustomKpis(selectedKpiPicId);
    }
  }, [activeTab, selectedKpiPicId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsData, picsData] = await Promise.all([
        getTickets(),
        getPicIt()
      ]);
      setTickets(ticketsData);

      // Get unique PICs list
      const uniquePics = [];
      const picMap = new Map();
      picsData.forEach(p => {
        const id = p.pic_id || p.id;
        if (!picMap.has(id)) {
          picMap.set(id, true);
          uniquePics.push({ id, name: p.pic_name });
        }
      });
      setPics(uniquePics);
      if (uniquePics.length > 0 && !selectedKpiPicId) {
        setSelectedKpiPicId(uniquePics[0].id);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomKpis = async (picId) => {
    setKpiLoading(true);
    try {
      const data = await getPicKpis(picId);
      setCustomKpis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setKpiLoading(false);
    }
  };

  // --- KPI CRUD Handlers ---
  const handleCreateKpi = async (e) => {
    e.preventDefault();
    try {
      await createPicKpi({ pic_id: selectedKpiPicId, ...editKpiForm });
      setIsCreatingKpi(false);
      setEditKpiForm({ kpi_name: '', target_value: 0, unit: '' });
      fetchCustomKpis(selectedKpiPicId);
    } catch (error) {
      alert(t('Gagal menyimpan KPI'));
    }
  };
  const handleUpdateKpi = async (e) => {
    e.preventDefault();
    try {
      await updatePicKpi(editingKpiId, editKpiForm);
      setEditingKpiId(null);
      fetchCustomKpis(selectedKpiPicId);
    } catch (error) {
      alert(t('Gagal mengupdate KPI'));
    }
  };
  const handleDeleteKpi = async (id) => {
    if (confirm(t('Apakah Anda yakin ingin menghapus KPI ini?'))) {
      try {
        await deletePicKpi(id);
        fetchCustomKpis(selectedKpiPicId);
      } catch (error) {
        alert(t('Gagal menghapus KPI'));
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds())
      .toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    if (!name) return "IT";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    if (!name) return 'bg-blue-600';
    const colors = [
      'bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 'bg-purple-600',
      'bg-fuchsia-600', 'bg-pink-600', 'bg-rose-600', 'bg-orange-600',
      'bg-emerald-600', 'bg-teal-600', 'bg-cyan-600', 'bg-sky-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // --- Filtering Logic for Global Tab ---
  const globalFilteredTickets = tickets.filter(ticket => {
    if (ticket.status !== 'Completed') return false; // Laporan hanya menampilkan tiket selesai

    const search = searchTerm.toLowerCase();
    const matchesSearch = !search ||
      (ticket.title?.toLowerCase() || "").includes(search) ||
      (ticket.id?.toString() || "").includes(search);

    const matchesCategory = categoryFilter === "Semua Layanan" || ticket.category === categoryFilter;
    const matchesPic = picFilter === "Semua PIC" || ticket.pic_name === picFilter;

    let matchesDate = true;
    if (startDate && endDate && ticket.created_at) {
      const ticketDate = new Date(ticket.created_at).toISOString().split('T')[0];
      matchesDate = ticketDate >= startDate && ticketDate <= endDate;
    }

    return matchesSearch && matchesCategory && matchesPic && matchesDate;
  });

  // Calculate generic KPIs based on global filters
  const totalSelesaiGlobal = globalFilteredTickets.length;
  const totalHighGlobal = globalFilteredTickets.filter(t => t.priority === 'High').length;
  const layananCountsGlobal = {};
  globalFilteredTickets.forEach(t => {
    const cat = t.category || '365';
    layananCountsGlobal[cat] = (layananCountsGlobal[cat] || 0) + 1;
  });
  let layananTerbanyakGlobal = '-';
  let layananTerbanyakCountGlobal = 0;
  Object.keys(layananCountsGlobal).forEach(cat => {
    if (layananCountsGlobal[cat] > layananTerbanyakCountGlobal) {
      layananTerbanyakCountGlobal = layananCountsGlobal[cat];
      layananTerbanyakGlobal = cat;
    }
  });

  const totalPagesGlobal = Math.ceil(globalFilteredTickets.length / ITEMS_PER_PAGE) || 1;
  const paginatedTicketsGlobal = globalFilteredTickets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- Logic for KPI Tab ---
  const selectedPicData = pics.find(p => p.id === selectedKpiPicId);
  const picKpiTickets = tickets.filter(t => t.status === 'Completed' && selectedPicData && t.pic_name === selectedPicData.name);

  const totalSelesaiPic = picKpiTickets.length;
  const totalHighPic = picKpiTickets.filter(t => t.priority === 'High').length;

  const handleExportExcel = () => {
    const dataToExport = activeTab === 'global' ? globalFilteredTickets : picKpiTickets;
    if (dataToExport.length === 0) return;

    const exportData = dataToExport.map(ticket => ({
      [t("ID Tiket")]: ticket.id,
      [t("Judul Tiket")]: ticket.title,
      [t("Layanan")]: ticket.category || '365',
      [t("Prioritas")]: ticket.priority,
      [t("PIC")]: ticket.pic_name || 'Unassigned',
      [t("Tanggal Dibuat")]: formatDate(ticket.created_at)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

    let filename = `Laporan_${activeTab === 'global' ? 'Global' : (selectedPicData?.name || 'PIC').replace(/\s+/g, '')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="flex flex-col h-full relative bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in duration-500">

      {/* HEADER SECTION (Fixed at top) */}
      <div className="px-8 pt-8 pb-4 shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0b1b3d] dark:text-white flex items-center gap-3 mb-2 tracking-tight">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText size={22} strokeWidth={2.5} />
              </div>
              {t('Laporan')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t('Monitoring, filter, dan atur target KPI per PIC dalam satu tempat.')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              disabled={activeTab === 'global' ? globalFilteredTickets.length === 0 : picKpiTickets.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${(activeTab === 'global' ? globalFilteredTickets.length === 0 : picKpiTickets.length === 0)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
            >
              <Download size={18} strokeWidth={2.5} />
              {t('Export ke Excel')}
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('kpi')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'kpi'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
          >
            <Target size={18} /> {t('Performa KPI PIC')}
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'global'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
          >
            <LayoutDashboard size={18} /> {t('Semua Tiket')}
          </button>
        </div>
      </div>

      {/* CONTENT SECTION (Scrollable) */}
      <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 p-8">

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* -------------------- TAB 1: KPI PIC -------------------- */}
            {activeTab === 'kpi' && (
              <div className="flex flex-col lg:flex-row gap-8 min-h-full animate-in fade-in slide-in-from-bottom-2">

                {/* Kiri: Daftar PIC */}
                <div className="w-full lg:w-72 shrink-0">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="px-2 pb-3 mb-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 text-slate-800 dark:text-white font-bold">
                      <Users size={18} className="text-blue-600 dark:text-blue-400" />
                      {t('Daftar PIC')}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                      {pics.map(pic => (
                        <button
                          key={pic.id}
                          onClick={() => setSelectedKpiPicId(pic.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${selectedKpiPicId === pic.id
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getAvatarColor(pic.name)}`}>
                            {getInitials(pic.name)}
                          </div>
                          <span className="text-sm font-semibold truncate">{pic.name}</span>
                        </button>
                      ))}
                      {pics.length === 0 && (
                        <p className="text-sm text-center text-slate-500 py-4">Belum ada PIC</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Kanan: Detail KPI & Rapor PIC */}
                <div className="flex-1 flex flex-col gap-6">
                  {selectedPicData ? (
                    <>
                      {/* Header PIC Rapor */}
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md ${getAvatarColor(selectedPicData.name)}`}>
                            {getInitials(selectedPicData.name)}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedPicData.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2 mt-1">
                              <CheckCircle2 size={16} className="text-emerald-500" /> {picKpiTickets.length} Tiket Selesai
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Kotak-Kotak Pencapaian (Real-time dari tiket) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">{t('Total Selesai')}</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{totalSelesaiPic}</h3>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center">
                            <AlertTriangle size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">{t('Prioritas Tinggi')}</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{totalHighPic}</h3>
                          </div>
                        </div>
                      </div>

                      {/* Bagian CRUD Target KPI Khusus */}
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                            <Target className="text-blue-600 dark:text-blue-400" size={20} />
                            {t('Manajemen Target KPI')}
                          </h3>
                        </div>

                        {kpiLoading ? (
                          <div className="text-center py-6 text-slate-500">{t('Memuat KPI...')}</div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                              {customKpis.map(kpi => (
                                <div key={kpi.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3">
                                  {editingKpiId === kpi.id ? (
                                    <form onSubmit={handleUpdateKpi} className="flex flex-col gap-3 w-full">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="col-span-2">
                                          <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('Nama KPI')}</label>
                                          <input type="text" required value={editKpiForm.kpi_name} onChange={e => setEditKpiForm({ ...editKpiForm, kpi_name: e.target.value })} className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                          <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('Target')}</label>
                                          <input type="number" required value={editKpiForm.target_value} onChange={e => setEditKpiForm({ ...editKpiForm, target_value: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                          <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t('Satuan')}</label>
                                          <input type="text" value={editKpiForm.unit} onChange={e => setEditKpiForm({ ...editKpiForm, unit: e.target.value })} className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                        </div>
                                      </div>
                                      <div className="flex gap-2 justify-end mt-1">
                                        <button type="button" onClick={() => setEditingKpiId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 text-xs font-bold">{t('Batal')}</button>
                                        <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold flex items-center gap-1"><Save size={14} /> {t('Simpan')}</button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{kpi.kpi_name}</p>
                                          <h4 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{kpi.target_value} <span className="text-sm font-bold">{kpi.unit}</span></h4>
                                        </div>
                                        <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                          <button onClick={() => {
                                            setEditingKpiId(kpi.id);
                                            setEditKpiForm({ kpi_name: kpi.kpi_name, target_value: kpi.target_value, unit: kpi.unit });
                                            setIsCreatingKpi(false);
                                          }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md"><Edit2 size={14} /></button>
                                          <button onClick={() => handleDeleteKpi(kpi.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"><Trash2 size={14} /></button>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>

                            {isCreatingKpi ? (
                              <div className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-5">
                                <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300 mb-3">{t('Tambah Target KPI Baru')}</h4>
                                <form onSubmit={handleCreateKpi} className="flex flex-col md:flex-row gap-3 items-end">
                                  <div className="flex-1 w-full">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">{t('Nama KPI')}</label>
                                    <input type="text" required value={editKpiForm.kpi_name} onChange={e => setEditKpiForm({ ...editKpiForm, kpi_name: e.target.value })} placeholder="Contoh: SLA Penyelesaian" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                  </div>
                                  <div className="w-full md:w-24">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">{t('Target')}</label>
                                    <input type="number" required value={editKpiForm.target_value} onChange={e => setEditKpiForm({ ...editKpiForm, target_value: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                  </div>
                                  <div className="w-full md:w-32">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1 block">{t('Satuan')}</label>
                                    <input type="text" value={editKpiForm.unit} onChange={e => setEditKpiForm({ ...editKpiForm, unit: e.target.value })} placeholder="Tiket, %, dll" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                                  </div>
                                  <div className="flex gap-2 w-full md:w-auto">
                                    <button type="button" onClick={() => setIsCreatingKpi(false)} className="flex-1 md:flex-none p-2.5 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 font-bold text-sm"><X size={18} /></button>
                                    <button type="submit" className="flex-1 md:flex-none p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-500/20"><Save size={18} /></button>
                                  </div>
                                </form>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setIsCreatingKpi(true);
                                  setEditKpiForm({ kpi_name: '', target_value: 0, unit: '' });
                                  setEditingKpiId(null);
                                }}
                                className="w-full py-3 mt-2 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl font-bold transition-all text-sm"
                              >
                                <Plus size={18} /> {t('Tambah Target KPI')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800/50">
                      Pilih PIC di samping untuk melihat rapor KPI
                    </div>
                  )}
                </div>

              </div>
            )}


            {/* -------------------- TAB 2: GLOBAL TICKETS -------------------- */}
            {activeTab === 'global' && (
              <div className="animate-in fade-in slide-in-from-bottom-2">

                {/* KPI Cards Global */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={26} strokeWidth={2.5} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('Total Selesai')}</p>
                      <h3 className="text-3xl font-black text-[#0b1b3d] dark:text-white tracking-tight">{totalSelesaiGlobal}</h3>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                      <AlertTriangle size={26} strokeWidth={2.5} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('Prioritas Tinggi')}</p>
                      <h3 className="text-3xl font-black text-[#0b1b3d] dark:text-white tracking-tight">{totalHighGlobal}</h3>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Layers size={26} strokeWidth={2.5} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('Layanan Terbanyak')}</p>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-black text-[#0b1b3d] dark:text-white truncate" title={layananTerbanyakGlobal}>{layananTerbanyakGlobal}</h3>
                        <span className="text-sm font-bold text-slate-400">({layananTerbanyakCountGlobal})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters Area */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl mb-6 p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="xl:col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">Pencarian</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search size={16} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                          placeholder={t('ID atau Judul...')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">Dari Tanggal</label>
                      <div className="relative">
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white appearance-none"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Calendar size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">Sampai Tanggal</label>
                      <div className="relative">
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white appearance-none"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                        <Calendar size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* PIC */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">Filter PIC</label>
                      <div className="relative">
                        <select
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white appearance-none pr-10"
                          value={picFilter}
                          onChange={(e) => setPicFilter(e.target.value)}
                        >
                          <option value="Semua PIC">Semua PIC</option>
                          {pics.map((pic) => (
                            <option key={pic.id} value={pic.name}>{pic.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Area */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-4 px-6 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">ID</th>
                          <th className="py-4 px-6 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Judul Tiket</th>
                          <th className="py-4 px-6 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Layanan</th>
                          <th className="py-4 px-6 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">PIC</th>
                          <th className="py-4 px-6 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Prioritas</th>
                          <th className="py-4 px-6 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Dibuat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {paginatedTicketsGlobal.length > 0 ? (
                          paginatedTicketsGlobal.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                              <td className="py-4 px-6">
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">#{ticket.id}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{ticket.title}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                  {ticket.category || '365'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(ticket.pic_name)}`}>
                                    {getInitials(ticket.pic_name)}
                                  </div>
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {ticket.pic_name || 'Unassigned'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${ticket.priority === 'High'
                                    ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                                    : ticket.priority === 'Medium'
                                      ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400'
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
                                  }`}>
                                  {ticket.priority === 'High' ? t('Tinggi') : ticket.priority === 'Medium' ? t('Sedang') : t('Rendah')}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  {formatDate(ticket.created_at)}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                  <Search size={24} />
                                </div>
                                <p>{t('Tidak ada data tiket yang sesuai dengan filter.')}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {globalFilteredTickets.length > 0 && (
                    <div className="py-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t('Menampilkan')} <span className="font-bold text-slate-700 dark:text-slate-300">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> {t('ke')} <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(currentPage * ITEMS_PER_PAGE, globalFilteredTickets.length)}</span> {t('dari')} <span className="font-bold text-slate-700 dark:text-slate-300">{globalFilteredTickets.length}</span> {t('tiket')}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-sm"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                          {currentPage} / {totalPagesGlobal}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPagesGlobal, p + 1))}
                          disabled={currentPage === totalPagesGlobal}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-sm"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
