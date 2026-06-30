import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, MoreVertical, Eye, Pencil, MessageSquare, CheckCircle, Trash2, Search, Calendar, RefreshCcw, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock, CheckCircle2, MessageCircle, Ticket, Activity, AlertCircle, Layout, BookOpen } from "lucide-react";
import TicketModal from "../components/TicketModal";
import axios from "axios";
import { getTickets, getPicIt, invalidateCache } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";

const API_URL = `http://${window.location.hostname}:5000/api/tickets`;

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

export default function LaporkanKendala({ setActivePage, globalSearchTerm, user, adminViewAs }) {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [closingTicket, setClosingTicket] = useState(null);
  const [deletingTicket, setDeletingTicket] = useState(null);
  const [resolutionText, setResolutionText] = useState("");
  const [viewingResolutionTicket, setViewingResolutionTicket] = useState(null);
  const [resolutionData, setResolutionData] = useState({ loading: false, text: null });
  const [toastMessage, setToastMessage] = useState(null);

  // Filter states
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [categoryFilter, setCategoryFilter] = useState("Semua Layanan");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pics, setPics] = useState([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [localSearchTerm, globalSearchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchTickets();
    fetchPics();
  }, [adminViewAs, user]);

  const fetchPics = async () => {
    try {
      const data = await getPicIt();
      setPics(data);
    } catch (error) {
      console.error("Error fetching pics:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      let data = await getTickets();
      const isAdminUser = user?.role === 'Admin' || user?.role === 'Manager';
      if (!isAdminUser) {
        data = data.filter(t => t.pic_name === user?.name);
      } else if (adminViewAs && adminViewAs !== 'Semua PIC') {
        data = data.filter(t => t.pic_name === adminViewAs);
      }
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    invalidateCache('tickets');
    await fetchTickets();
    showToast(t("Data tiket berhasil diperbarui! 🔄"));
  };

  const handleCreateOrUpdate = async (formData, id) => {
    try {
      if (id) {
        const data = Object.fromEntries(formData);
        await axios.put(`${API_URL}/${id}`, data);
        showToast("Perubahan tiket berhasil disimpan! ✨");
      } else {
        await axios.post(API_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast("Tiket baru berhasil dibuat! 🚀");
      }
      invalidateCache('tickets');
      await fetchTickets();
      window.dispatchEvent(new Event('ticketsUpdated'));
    } catch (error) {
      console.error("Error saving ticket:", error);
      axios.post(`http://${window.location.hostname}:5000/api/tickets/log`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      }).catch(e => console.log(e));
      showToast("Gagal menyimpan perubahan tiket.");
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleInlineUpdate = async (ticket, field, value) => {
    try {
      // Optimistic update for UI feel (only updates the edited field immediately)
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, [field]: value } : t));

      const res = await axios.put(`${API_URL}/${ticket.id}`, { [field]: value });

      // Update state again with the actual finished_at from database to fix resolution time rendering
      if (res.data?.finished_at) {
        setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, finished_at: res.data.finished_at } : t));
      }

      invalidateCache('tickets');
      window.dispatchEvent(new Event('ticketsUpdated'));
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      invalidateCache('tickets');
    }
  };

  const openEditModal = (e, ticket) => {
    e.stopPropagation();
    setEditingTicket(ticket);
    setIsModalOpen(true);
  };

  const handleDelete = (ticket) => {
    setDeletingTicket(ticket);
  };

  const confirmDeleteTicket = async () => {
    if (!deletingTicket) return;
    try {
      await axios.delete(`${API_URL}/${deletingTicket.id}`);
      invalidateCache('tickets');
      fetchTickets();
      showToast("Tiket berhasil dihapus! 🗑️");
      window.dispatchEvent(new Event('ticketsUpdated'));
    } catch (error) {
      console.error("Error deleting ticket:", error);
      showToast("Gagal menghapus tiket.");
    } finally {
      setDeletingTicket(null);
    }
  };

  const submitCloseTicket = async () => {
    if (!closingTicket) return;
    try {
      if (resolutionText.trim()) {
        await axios.post(`${API_URL}/${closingTicket.id}/comments`, {
          comment_text: `Solusi :\n${resolutionText}`,
          created_by: 'IT Support'
        });
      }
      await handleInlineUpdate(closingTicket, 'status', 'Completed');
      setClosingTicket(null);
      setResolutionText("");
      showToast("Tiket berhasil ditutup dan diselesaikan! ✅");
      window.dispatchEvent(new Event('ticketsUpdated'));
    } catch (error) {
      console.error("Error closing ticket:", error);
      showToast("Gagal menutup tiket.");
    }
  };

  const handleViewResolution = async (ticket) => {
    setViewingResolutionTicket(ticket);
    setResolutionData({ loading: true, text: null });
    try {
      const res = await axios.get(`${API_URL}/${ticket.id}/comments`);
      const comments = res.data;
      const resComment = comments.slice().reverse().find(c => c.comment_text && c.comment_text.includes('Solusi :'));
      if (resComment) {
        const cleanText = resComment.comment_text.replace(/Solusi :\n?/, '').trim();
        setResolutionData({ loading: false, text: cleanText });
      } else {
        setResolutionData({ loading: false, text: "Tidak ada catatan solusi yang ditemukan untuk tiket ini." });
      }
    } catch (e) {
      console.error("Error fetching resolution:", e);
      setResolutionData({ loading: false, text: "Gagal mengambil data solusi." });
    }
  };

  // Get current user from localStorage for role-based access control
  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdminUser = currentUser?.role === 'Admin' || (currentUser?.name && currentUser.name.toLowerCase().includes('dwi'));

  const visibleTickets = tickets.filter(ticket => isAdminUser || ticket.pic_name === currentUser?.name);

  // Derived metrics
  const openCount = visibleTickets.filter(t => t.status === 'To Do').length;
  const progressCount = visibleTickets.filter(t => t.status === 'On Progress').length;
  const completedCount = visibleTickets.filter(t => t.status === 'Completed').length;
  const highPriorityCount = visibleTickets.filter(t => t.priority === 'High' && t.status !== 'Completed').length;

  // Filtering logic
  const filteredTickets = visibleTickets.filter(ticket => {
    const search = (globalSearchTerm || localSearchTerm).toLowerCase();
    const matchesSearch = !search ||
      (ticket.title?.toLowerCase() || "").includes(search);

    const statusMap = { "Semua Status": true, "To Do": ticket.status === 'To Do', "On Progress": ticket.status === 'On Progress', "Completed": ticket.status === 'Completed' };
    const matchesStatus = statusMap[statusFilter];
    const matchesCategory = categoryFilter === "Semua Layanan" || categoryFilter === "Semua Aplikasi" || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const currentTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getInitials = (name) => {
    if (!name) return "IT";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAppInitials = (app) => {
    if (!app) return "APP";
    return app.substring(0, 3).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: '-', time: '-' };
    const d = new Date(dateString);
    const date = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    return {
      date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    };
  };

  const getResolutionTime = (created, updated, status) => {
    if (status !== 'Completed') return '-';
    if (!created || !updated) return '-';

    const start = new Date(created);
    const end = new Date(updated);

    if (end <= start) return '< 1m';

    const diffMs = end - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays === 0 && diffHrs === 0 && diffMins === 0) return '< 1m';

    let result = '';
    if (diffDays > 0) result += `${diffDays}h `;
    if (diffHrs > 0 || diffDays > 0) result += `${diffHrs}j `;
    result += `${diffMins}m`;

    return result;
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900 relative overflow-hidden animate-in fade-in duration-500">
      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col overflow-auto transition-all duration-[400ms] ease-in-out`}
      >
        <div className="flex flex-col p-8 gap-6 min-h-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
            <div>

              <h1 className="text-3xl font-bold text-[#0b1b3d] dark:text-white flex items-center gap-2 mb-2 tracking-tight">
                Ticket
              </h1>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('Manajemen Tiket')}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('Daftar seluruh tiket aktif dan riwayat penyelesaian.')}</p>
            </div>

            <div className="flex w-full md:w-auto items-center gap-2">
              <button onClick={handleRefresh} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[4px] text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all">
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> {t('Refresh Data')}
              </button>
              <button onClick={() => { setEditingTicket(null); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[4px] text-sm font-bold shadow-sm shadow-blue-600/20 transition-all">
                <Plus size={18} strokeWidth={2.5} /> {t('Buat Tiket Baru')}
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm rounded-[4px] p-5 hover:shadow-md transition-shadow flex flex-col min-h-[120px]">
              <div className="flex items-center gap-4 mb-4">
                <Ticket size={20} strokeWidth={2} className="text-blue-500 shrink-0" />
                <span className="text-[28px] font-black text-slate-800 dark:text-white">
                  {openCount}
                </span>
              </div>
              <div className="mt-auto">
                <p className="text-[13px] font-bold text-slate-800 dark:text-white">{t('Tiket To Do')}</p>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">{t('Tiket belum/sedang penanganan')}</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm rounded-[4px] p-5 hover:shadow-md transition-shadow flex flex-col min-h-[120px]">
              <div className="flex items-center gap-4 mb-4">
                <CheckCircle2 size={20} strokeWidth={2} className="text-emerald-500 shrink-0" />
                <span className="text-[28px] font-black text-slate-800 dark:text-white">
                  {completedCount}
                </span>
              </div>
              <div className="mt-auto">
                <p className="text-[13px] font-bold text-slate-800 dark:text-white">{t('Tiket Selesai')}</p>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">{t('Total tiket diselesaikan')}</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm rounded-[4px] p-5 hover:shadow-md transition-shadow flex flex-col min-h-[120px]">
              <div className="flex items-center gap-4 mb-4">
                <AlertCircle size={20} strokeWidth={2} className="text-rose-500 shrink-0" />
                <span className="text-[28px] font-black text-slate-800 dark:text-white">
                  {highPriorityCount}
                </span>
              </div>
              <div className="mt-auto">
                <p className="text-[13px] font-bold text-slate-800 dark:text-white">{t('Prioritas Tinggi')}</p>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">{t('Butuh tindakan segera')}</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm rounded-[4px] p-5 hover:shadow-md transition-shadow flex flex-col min-h-[120px]">
              <div className="flex items-center gap-4 mb-4">
                <Layout size={20} strokeWidth={2} className="text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="text-[28px] font-black text-slate-800 dark:text-white">
                  {visibleTickets.length}
                </span>
              </div>
              <div className="mt-auto">
                <p className="text-[13px] font-bold text-slate-800 dark:text-white">{t('Total Laporan')}</p>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">{t('Keseluruhan tiket')}</p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm rounded-md flex flex-col overflow-hidden shrink-0 min-h-0">

            {/* Filters Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("Cari berdasarkan judul tiket...")}
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-slate-200/80 dark:border-slate-700 rounded-[4px] text-[13px] text-slate-700 focus:outline-none focus:border-blue-500 transition-colors dark:text-white"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none w-full pl-9 pr-10 py-2.5 bg-transparent border border-slate-200/80 dark:border-slate-700 rounded-[4px] text-[13px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="Semua Status">{t('Semua Status')}</option>
                  <option value="To Do">{t('To Do')}</option>
                  <option value="On Progress">{t('On Progress')}</option>
                  <option value="Completed">{t('Completed')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>

              <div className="relative min-w-[150px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none w-full pl-9 pr-10 py-2.5 bg-transparent border border-slate-200/80 dark:border-slate-700 rounded-[4px] text-[13px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="Semua Layanan">{t('Semua Layanan')}</option>
                  <option value="365">365</option>
                  <option value="Di Luar 365">Di Luar 365</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[420px]">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[26%]">{t('Judul Tiket')}</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[10%] text-center">{t('Layanan')}</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[13%] text-center">{t('PIC')}</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[11%] text-center">{t('Status')}</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[10%] text-center">{t('Prioritas')}</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[11%] text-center">{t('Tanggal Dibuat')}</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%] text-center">{t('Waktu Penyelesaian')}</th>
                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-[7%]">{t('Aksi')}</th>
                  </tr>
                </thead>
                <tbody key={`page-${currentPage}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {loading ? (
                    <tr><td colSpan="7" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">Loading tickets...</td></tr>
                  ) : currentTickets.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Ticket size={48} className="text-slate-300 dark:text-slate-600 mb-3" />
                          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{t('Tidak ada tiket yang ditemukan.')}</p>
                          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t('Coba sesuaikan filter atau pencarian Anda.')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {currentTickets.map((ticket) => {
                        const createdFormat = formatDate(ticket.created_at);
                        return (
                          <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <td
                              className="px-6 py-4 align-middle cursor-pointer"
                              onClick={() => setActivePage(`TicketDetail_${ticket.id}`)}
                            >
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-2 leading-snug" style={{ wordBreak: 'break-word' }}>
                                {ticket.title}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{ticket.description || t('Tidak ada deskripsi')}</div>
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                                {ticket.category || '365'}
                              </span>
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              <div className="flex items-center justify-start gap-3 w-[130px] mx-auto text-left">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] shrink-0 shadow-sm ${ticket.pic_name ? getAvatarColor(ticket.pic_name) : 'bg-slate-200 text-slate-500'}`}>
                                  {getInitials(ticket.pic_name || 'NA')}
                                </div>
                                <span className="font-bold text-sm text-slate-800 dark:text-white truncate">{ticket.pic_name || t('Belum di-assign')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              <div className="relative inline-flex items-center justify-center">
                                <select
                                  value={ticket.status || 'To Do'}
                                  onWheel={(e) => e.target.blur()}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'Completed') {
                                      setClosingTicket(ticket);
                                      setResolutionText("");
                                    } else {
                                      handleInlineUpdate(ticket, 'status', val);
                                    }
                                  }}
                                  className={`appearance-none inline-flex items-center pl-4 pr-12 py-1.5 rounded-full text-[11px] font-bold border-none outline-none focus:ring-0 cursor-pointer transition-colors ${ticket.status === 'Completed'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : ticket.status === 'On Progress'
                                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    }`}
                                >
                                  <option value="To Do" disabled={ticket.status === 'Completed'} className={`${ticket.status === 'Completed' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'} bg-white dark:bg-slate-800`}>{t('To Do')}</option>
                                  <option value="On Progress" disabled={ticket.status === 'Completed'} className={`${ticket.status === 'Completed' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'} bg-white dark:bg-slate-800`}>{t('On Progress')}</option>
                                  <option value="Completed" className="text-slate-800 dark:text-white bg-white dark:bg-slate-800">{t('Completed')}</option>
                                </select>
                                <ChevronDown size={12} strokeWidth={3} className={`absolute right-4 pointer-events-none ${ticket.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' :
                                  ticket.status === 'On Progress' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
                                  }`} />
                              </div>
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              {ticket.priority === 'High' ? (
                                <span className="inline-flex items-center justify-center text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                                  {t('High')}
                                </span>
                              ) : ticket.priority === 'Medium' ? (
                                <span className="inline-flex items-center justify-center text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded">
                                  {t('Medium')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">
                                  {t('Low')}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{createdFormat.date}</div>
                              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{createdFormat.time}</div>
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${ticket.status === 'Completed' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50' : 'text-slate-400'}`}>
                                {getResolutionTime(ticket.created_at, ticket.finished_at, ticket.status)}
                              </div>
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              {ticket.status === 'Completed' ? (
                                <div className="flex items-center justify-center">
                                  <span className="text-slate-400 font-bold text-lg">...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => { setClosingTicket(ticket); setResolutionText(""); }}
                                    className="p-1.5 rounded-md transition-all text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                    title={t("Selesaikan Tiket")}
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => openEditModal(e, ticket)}
                                    className="p-1.5 rounded-md transition-all text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                    title={t("Edit Ticket")}
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(ticket)}
                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-all"
                                    title={t("Hapus Tiket")}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loading && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('Rows per page')}:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="bg-slate-100 dark:bg-slate-700 border border-transparent rounded px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                    >
                      {[5, 10, 20, 50, 100].map((opt, idx, arr) => {
                        const isValid = idx === 0 || arr[idx - 1] < filteredTickets.length;
                        return (
                          <option key={opt} value={opt} disabled={!isValid} className={!isValid ? "text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800" : ""}>
                            {opt}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-[4px] hidden sm:inline">
                    {t('Menampilkan')} {currentTickets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredTickets.length)} {t('dari')} {filteredTickets.length} {t('tiket')}
                  </span>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => p === 1 ? totalPages : p - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md font-bold text-sm transition-colors ${currentPage === i + 1 ? 'bg-[#0b1b3d] dark:bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                      >{i + 1}</button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => p === totalPages ? 1 : p + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      title="Halaman Selanjutnya"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Centered Overlay Modal for Create & Edit Ticket */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 animate-in fade-in yduration-200">
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-2xl w-full max-w-2xl h-fit max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <TicketModal
              isOpen={isModalOpen}
              onClose={() => { setIsModalOpen(false); setEditingTicket(null); }}
              onSubmit={handleCreateOrUpdate}
              initialData={editingTicket}
              pics={pics}
              currentUser={currentUser}
              isAdminUser={isAdminUser}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Close Ticket Resolution Modal */}
      {closingTicket && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-xl border border-slate-200/80 dark:border-slate-700 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{t('Selesaikan Tiket')}</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Penyelesaian / Solusi</label>
              <textarea
                value={resolutionText}
                onChange={e => setResolutionText(e.target.value)}
                className="w-full bg-transparent border border-slate-200/80 dark:border-slate-800 rounded-[4px] px-3 py-2.5 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder-slate-400 dark:placeholder-slate-500"
                rows={4}
                placeholder="Jelaskan secara detail bagaimana kendala ini diselesaikan..."
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setClosingTicket(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-[4px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={submitCloseTicket}
                  className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-[4px] font-semibold hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} strokeWidth={2.5} />
                  Tutup Tiket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Resolution Modal */}
      {viewingResolutionTicket && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-xl border border-slate-200/80 dark:border-slate-700 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" />
                {t('Solusi Tiket')}
              </h3>
            </div>
            <div className="p-6">
              {resolutionData.loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-300 p-4 rounded-[4px] border border-green-100 dark:border-green-800/30 whitespace-pre-wrap text-sm leading-relaxed">
                  {resolutionData.text}
                </div>
              )}
              <div className="flex mt-6">
                <button
                  onClick={() => setViewingResolutionTicket(null)}
                  className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-[4px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTicket && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-md shadow-xl border border-slate-200/80 dark:border-slate-700 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                {t('Konfirmasi Hapus')}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                {t('Apakah Anda yakin ingin menghapus tiket')} <strong className="text-slate-800 dark:text-white">"{deletingTicket.title}"</strong> {t('secara permanen? Tindakan ini tidak dapat dibatalkan.')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingTicket(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-[4px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {t('Batal')}
                </button>
                <button
                  onClick={confirmDeleteTicket}
                  className="flex-1 bg-rose-600 text-white px-4 py-2.5 rounded-[4px] font-semibold hover:bg-rose-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                  {t('Hapus')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Effect */}
      {toastMessage && createPortal(
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 flex items-center gap-3 font-bold text-sm">
            <span className="flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
              <CheckCircle2 size={14} />
            </span>
            {toastMessage}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
