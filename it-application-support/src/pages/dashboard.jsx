import React, { useState, useEffect } from 'react';
import {
    Ticket,
    CheckCircle2,
    AlertCircle,
    Server,
    Activity,
    PlusCircle,
    BookOpen,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    MoreVertical,
    ChevronLeft as ChevronLeftSmall,
    ChevronRight as ChevronRightSmall,
    ChevronDown
} from 'lucide-react';


import { getTickets } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const COLORS = ['#F43F5E', '#F59E0B', '#3B82F6']; // Rose, Amber, Blue

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

const getInitials = (name) => {
    if (!name) return 'NA';
    return name.substring(0, 2).toUpperCase();
};

const fixDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    // mssql driver treats DATETIME as UTC, so we extract UTC components to get the actual local time
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
};

function Dashboard({ setActivePage, globalSearchTerm }) {
    const { t } = useLanguage();
    const [stats, setStats] = useState({ active: 0, completed: 0, highPriority: 0, total: 0, priorityData: { high: 0, medium: 0, low: 0 } });
    const [recentLogs, setRecentLogs] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Calendar states
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Filters and Pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Semua Status");
    const [filterPriority, setFilterPriority] = useState("Semua Prioritas");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        const fetchRealData = async () => {
            try {
                const taskData = await getTickets();

                let active = 0, completed = 0, highPriority = 0, total = 0;
                let prioHigh = 0, prioMed = 0, prioLow = 0;

                for (let i = 0; i < taskData.length; i++) {
                    const row = taskData[i];
                    if (!row) continue;

                    const stage = (row.status || "").toLowerCase();
                    const priority = (row.priority || "").toLowerCase();

                    total++;

                    let isActive = false;

                    if (stage.includes("done") || stage.includes("selesai") || stage.includes("complete") || stage.includes("closed")) {
                        completed++;
                    } else {
                        if (!stage.includes("cancel") && !stage.includes("batal")) {
                            active++;
                            isActive = true;
                        }
                    }

                    if (isActive) {
                        if (priority.includes("high") || priority.includes("tinggi") || priority.includes("urgent")) {
                            highPriority++;
                            prioHigh++;
                        } else if (priority.includes("medium") || priority.includes("normal") || priority.includes("sedang")) {
                            prioMed++;
                        } else {
                            prioLow++;
                        }
                    }
                }

                setStats({ active, completed, highPriority, total, priorityData: { high: prioHigh, medium: prioMed, low: prioLow } });

                // Map all tickets
                const mappedTickets = taskData.map(row => {
                    const createdDate = fixDate(row.created_at);
                    const updatedDate = row.updated_at ? fixDate(row.updated_at) : null;

                    return {
                        id: row.id,
                        ticketId: `#${row.id}`,
                        req: row.description || 'Tidak ada deskripsi',
                        app: row.category || '365',
                        subject: row.title || '-',
                        prio: row.priority || 'Medium',
                        status: row.status || 'To Do',
                        pic: row.pic_name || null,
                        created: createdDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
                        updated: updatedDate && updatedDate.getTime() !== createdDate.getTime()
                            ? updatedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                            : '-',
                        rawDate: createdDate
                    };
                }).sort((a, b) => b.id - a.id);
                setAllTickets(mappedTickets);

                // Set dynamic logs from real data
                const recentActivities = [...taskData]
                    .sort((a, b) => fixDate(b.updated_at || b.created_at).getTime() - fixDate(a.updated_at || a.created_at).getTime())
                    .slice(0, 5)
                    .map(row => {
                        const dateObj = fixDate(row.updated_at || row.created_at);
                        const isToday = dateObj.toLocaleDateString('id-ID') === new Date().toLocaleDateString('id-ID');
                        const timeStr = isToday
                            ? dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                            : dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

                        if (row.status === 'Completed') {
                            return { title: t("Task diselesaikan"), desc: row.title, time: timeStr, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' };
                        } else if (row.status === 'On Progress') {
                            return { title: t("Task diproses"), desc: row.title, time: timeStr, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' };
                        } else if (row.priority === 'High') {
                            return { title: t("Prioritas tinggi"), desc: row.title, time: timeStr, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' };
                        } else {
                            return { title: t("Ticket baru / To Do"), desc: row.title, time: timeStr, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' };
                        }
                    });

                setRecentLogs(recentActivities);
                setLoading(false);

            } catch (err) {
                console.error("Gagal menarik data:", err);
                setLoading(false);
            }
        };

        fetchRealData();
    }, []);

    // Filter Logic
    const filteredTickets = React.useMemo(() => {
        return allTickets.filter(ticket => {
            const activeSearch = searchTerm || globalSearchTerm || "";
            const matchesSearch =
                ticket.ticketId.toLowerCase().includes(activeSearch.toLowerCase()) ||
                ticket.req.toLowerCase().includes(activeSearch.toLowerCase()) ||
                ticket.app.toLowerCase().includes(activeSearch.toLowerCase()) ||
                ticket.subject.toLowerCase().includes(activeSearch.toLowerCase());

            const matchesStatus = filterStatus === "Semua Status" || ticket.status.toLowerCase().includes(filterStatus.toLowerCase());
            const matchesPriority = filterPriority === "Semua Prioritas" || ticket.prio.toLowerCase() === filterPriority.toLowerCase();

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [allTickets, searchTerm, globalSearchTerm, filterStatus, filterPriority]);

    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
    const currentTickets = filteredTickets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterPriority]);


    const safeTotalPrio = stats.priorityData.high + stats.priorityData.medium + stats.priorityData.low;
    const highPct = safeTotalPrio > 0 ? Math.round((stats.priorityData.high / safeTotalPrio) * 100) : 0;
    const medPct = safeTotalPrio > 0 ? Math.round((stats.priorityData.medium / safeTotalPrio) * 100) : 0;
    const lowPct = safeTotalPrio > 0 ? Math.round((stats.priorityData.low / safeTotalPrio) * 100) : 0;

    const pieData = safeTotalPrio > 0 ? [
        { name: 'High', value: stats.priorityData.high },
        { name: 'Medium', value: stats.priorityData.medium },
        { name: 'Low', value: stats.priorityData.low }
    ] : [{ name: 'Total', value: 1 }];

    // --- Calendar Logic ---
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Monday=0, Sunday=6
    };

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const renderCalendarDays = () => {
        const days = [];

        // Prev month trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(<div key={`prev-${i}`} className="text-slate-300 py-1.5">{prevMonthDays - i}</div>);
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = new Date().getDate() === i && new Date().getMonth() === month && new Date().getFullYear() === year;
            const isSelected = selectedDate.getDate() === i && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

            days.push(
                <div
                    key={`curr-${i}`}
                    onClick={() => setSelectedDate(new Date(year, month, i))}
                    className={`py-1.5 rounded cursor-pointer relative flex flex-col items-center justify-center ${isSelected ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-200' : isToday ? 'text-blue-600 font-bold hover:bg-slate-50 dark:hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    {i}
                </div>
            );
        }

        // Next month leading days
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        for (let i = 1; i <= totalCells - (firstDay + daysInMonth); i++) {
            days.push(<div key={`next-${i}`} className="text-slate-300 py-1.5">{i}</div>);
        }

        return days;
    };

    const selectedDateTickets = allTickets.filter(t => {
        if (!t.rawDate) return false;
        return t.rawDate.getDate() === selectedDate.getDate() &&
            t.rawDate.getMonth() === selectedDate.getMonth() &&
            t.rawDate.getFullYear() === selectedDate.getFullYear();
    });

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            {/* Top Row: Greeting & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('Welcome,')}</p>
                    <h1 className="text-[28px] font-bold text-slate-800 dark:text-white leading-tight mb-2 flex items-center gap-2">
                        {t('IT Application Support Team')} <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-[13px] text-slate-600 dark:text-slate-400">{t('Progress Pekerjaan Tim IT Application Support')}</p>
                </div>

                <div>
                    <h3 className="text-[12px] font-bold text-slate-800 dark:text-white mb-2">{t('Quick Actions')}</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActivePage("Tiket")}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center"><PlusCircle size={12} className="text-blue-600" /></div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{t('Buat Ticket')}</span>
                        </button>

                        <button
                            onClick={() => setActivePage("Knowledge Base")}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center"><BookOpen size={12} className="text-blue-600" /></div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{t('Knowledge Base')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

                {/* Left Main Content */}
                <div className="space-y-6">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title={t("Tiket Aktif")}
                            value={stats.active}
                            icon={Ticket}
                            iconColor="text-blue-500"
                            iconBg="bg-blue-50"
                            desc={t("Tiket dalam penanganan")}
                            loading={loading}
                        />
                        <StatCard
                            title={t('Tiket Selesai')}
                            value={stats.completed}
                            icon={CheckCircle2}
                            iconColor="text-emerald-500"
                            iconBg="bg-emerald-50"
                            desc={t("Total tiket diselesaikan")}
                            loading={loading}
                        />
                        <StatCard
                            title={t('Prioritas Tinggi')}
                            value={stats.highPriority}
                            icon={AlertCircle}
                            iconColor="text-rose-500"
                            iconBg="bg-rose-50"
                            desc={t("Butuh tindakan segera")}
                            loading={loading}
                        />
                        <StatCard
                            title={t('Total Laporan')}
                            value={stats.total}
                            icon={Server}
                            iconColor="text-violet-500"
                            iconBg="bg-violet-50"
                            desc={t("Keseluruhan tiket harian")}
                            loading={loading}
                        />
                    </div>

                    {/* Middle Section: Charts & Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Priority Distribution Donut */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col min-h-[260px]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-[13px] font-bold text-slate-800 dark:text-white">
                                    {t('Prioritas')} <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">({t('Tiket yang masih aktif')})</span>
                                </h2>
                            </div>

                            <div className="flex-1 grid grid-cols-3 gap-3 mt-4">
                                {/* High */}
                                <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                                    <span className="text-3xl font-black text-rose-600 dark:text-rose-400 mb-1">
                                        {loading ? '-' : stats.priorityData.high}
                                    </span>
                                    <span className="text-[12px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">{t('Tinggi')}</span>
                                </div>

                                {/* Medium */}
                                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                                    <span className="text-3xl font-black text-amber-600 dark:text-amber-400 mb-1">
                                        {loading ? '-' : stats.priorityData.medium}
                                    </span>
                                    <span className="text-[12px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">{t('Sedang')}</span>
                                </div>

                                {/* Low */}
                                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">
                                        {loading ? '-' : stats.priorityData.low}
                                    </span>
                                    <span className="text-[12px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">{t('Rendah')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col min-h-[260px]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[13px] font-bold text-slate-800 dark:text-white">{t('Riwayat Aktivitas Terkini')}</h2>
                                <button className="text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700">{t('Lihat Semua')}</button>
                            </div>

                            <div className="space-y-4 flex-1">
                                {recentLogs.map((log, i) => (
                                    <div key={i} className="flex gap-3 relative">
                                        {/* Connecting line */}
                                        {i !== recentLogs.length - 1 && (
                                            <div className="absolute left-[13px] top-[28px] bottom-[-20px] w-px bg-slate-100 dark:bg-slate-700"></div>
                                        )}
                                        <div className={`w-7 h-7 rounded-full ${log.bg.replace('bg-', 'dark:bg-').replace('50', '900/30')} ${log.bg} ${log.color} flex items-center justify-center shrink-0 z-10 ring-4 ring-white dark:ring-slate-800`}>
                                            <log.icon size={12} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className="text-[12px] font-bold text-slate-800 dark:text-white">{log.title}</h4>
                                                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                                                    {log.time}
                                                    <div className={`w-1.5 h-1.5 rounded-full ${log.color.replace('text-', 'bg-')}`}></div>
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{log.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table: Ticket Terbaru */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">

                        {/* Table Header / Filters */}
                        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-[14px] font-bold text-slate-800 dark:text-white">{t('Ticket Terbaru')}</h2>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative inline-flex items-center">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="appearance-none text-[11px] font-medium border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-slate-600 dark:text-slate-300 outline-none bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                                    >
                                        <option value="Semua Status">{t('Semua Status')}</option>
                                        <option value="To Do">{t('To Do')}</option>
                                        <option value="On Progress">{t('On Progress')}</option>
                                        <option value="Completed">{t('Completed')}</option>
                                    </select>
                                    <ChevronDown size={14} strokeWidth={2} className="absolute right-2.5 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative inline-flex items-center">
                                    <select
                                        value={filterPriority}
                                        onChange={(e) => setFilterPriority(e.target.value)}
                                        className="appearance-none text-[11px] font-medium border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-slate-600 dark:text-slate-300 outline-none bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                                    >
                                        <option value="Semua Prioritas">{t('Semua Prioritas')}</option>
                                        <option value="High">{t('High')}</option>
                                        <option value="Medium">{t('Medium')}</option>
                                        <option value="Low">{t('Low')}</option>
                                    </select>
                                    <ChevronDown size={14} strokeWidth={2} className="absolute right-2.5 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                        <Search size={12} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={t("Cari tiket...")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-48 pl-7 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table Content */}
                        <div className="overflow-x-auto min-h-[305px]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                        <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[30%]">{t('Judul Tiket')}</th>
                                        <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[15%]">{t('Layanan')}</th>
                                        <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[15%]">{t('PIC')}</th>
                                        <th className="py-3 px-4 text-[11px] font-bold text-slate-500 text-center w-[10%]">{t('Status')}</th>
                                        <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[10%]">{t('Prioritas')}</th>
                                        <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[20%]">{t('Dibuat')}</th>
                                    </tr>
                                </thead>
                                <tbody key={`page-${currentPage}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {loading ? (
                                        <tr className="h-[250px]">
                                            <td colSpan="9" className="py-8 text-center text-slate-500 align-middle">{t('Loading tickets...')}</td>
                                        </tr>
                                    ) : currentTickets.length === 0 ? (
                                        <tr className="h-[250px]">
                                            <td colSpan="9" className="py-8 text-center text-slate-500 align-middle">{t('Tidak ada tiket ditemukan')}</td>
                                        </tr>
                                    ) : currentTickets.map((ticket, index) => {
                                        const isHigh = ticket.prio.toLowerCase().includes('high');
                                        const isMedium = ticket.prio.toLowerCase().includes('medium');
                                        const isDone = ticket.status.toLowerCase().includes('completed') || ticket.status.toLowerCase().includes('selesai');
                                        const isProgress = ticket.status.toLowerCase().includes('progress');

                                        return (
                                            <tr key={ticket.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group" onClick={() => setActivePage(`TicketDetail_${ticket.id}`)}>

                                                <td className="py-3 px-4 align-middle">
                                                    <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {ticket.subject}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{ticket.req}</div>
                                                </td>
                                                <td className="py-3 px-4 align-middle">
                                                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                                        {ticket.app}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[9px] shadow-sm ${ticket.pic ? getAvatarColor(ticket.pic) : 'bg-slate-200 text-slate-500'}`}>
                                                            {ticket.pic ? getInitials(ticket.pic) : '?'}
                                                        </div>
                                                        <span className="font-bold text-[11px] text-slate-800 dark:text-white">{ticket.pic || t('Belum di-assign')}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 align-middle text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${isDone ? 'bg-emerald-50 text-emerald-600' :
                                                        isProgress ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {ticket.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 align-middle">
                                                    <span className={`text-[10px] font-bold ${isHigh ? 'text-rose-500' :
                                                        isMedium ? 'text-amber-500' : 'text-blue-500'
                                                        }`}>
                                                        {ticket.prio}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 align-middle text-[11px] text-slate-500 dark:text-slate-500">{ticket.created}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-slate-200 flex items-center justify-between min-h-[60px]">
                            <span className="text-[11px] text-slate-500 font-medium">
                                {t('Menampilkan')} {currentTickets.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length)} {t('dari')} {filteredTickets.length} {t('tiket')}
                            </span>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(prev => prev === 1 ? totalPages : prev - 1)}
                                        className="p-1 rounded bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>

                                    {Array.from({ length: totalPages }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentPage(idx + 1)}
                                            className={`w-6 h-6 rounded text-[11px] font-bold flex items-center justify-center transition-colors ${currentPage === idx + 1
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(prev => prev === totalPages ? 1 : prev + 1)}
                                        className="p-1 rounded bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Right Panel Sidebar */}
                <div className="space-y-6">

                    {/* Calendar Widget */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"><ChevronLeft size={16} /></button>
                            <h3 className="text-[12px] font-bold text-slate-800 dark:text-white">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
                            <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"><ChevronRight size={16} /></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-2">
                            <div>{t('Sen')}</div><div>{t('Sel')}</div><div>{t('Rab')}</div><div>{t('Kam')}</div><div>{t('Jum')}</div><div>{t('Sab')}</div><div>{t('Min')}</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {renderCalendarDays()}
                        </div>
                    </div>

                    {/* Agenda Hari Ini */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">{t('Agenda')}: {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}</h3>
                            <span className="text-[10px] font-semibold text-slate-400">{selectedDateTickets.length} {t('agenda')}</span>
                        </div>
                        {selectedDateTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                                <div className="w-16 h-16 bg-blue-50/50 rounded-2xl flex items-center justify-center mb-4 text-blue-200">
                                    <CalendarIcon size={32} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-[12px] font-bold text-slate-800 dark:text-white mb-1">{t('Tidak ada tiket dibuat')}</h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('Pilih tanggal lain atau buat tiket baru.')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {selectedDateTickets.map(t_item => (
                                    <div key={t_item.id} className="flex flex-col p-3 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setActivePage(`TicketDetail_${t_item.id}`)}>
                                        <div className="flex justify-between items-start mb-1.5">
                                            <span className="text-[11px] font-bold text-blue-600">{t_item.ticketId}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(t_item.rawDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{t_item.subject}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, iconColor, iconBg, desc, loading }) {
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 flex flex-col min-h-[120px]">
            {/* Top row: Icon and Huge Number */}
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-xl border border-slate-100 dark:border-slate-700/50 ${iconBg.replace('bg-', 'dark:bg-').replace('50', '900/30')} ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[28px] font-black text-slate-800 dark:text-white">
                    {loading ? '...' : value}
                </span>
            </div>

            {/* Bottom row: Texts */}
            <div className="mt-auto">
                <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">{title}</h3>
                </div>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{desc}</p>
            </div>
        </div>
    );
}

export default Dashboard;
