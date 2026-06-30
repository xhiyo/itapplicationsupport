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
    ChevronDown,
    UserCircle2
} from 'lucide-react';


import { getTickets, getPicIt } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import LogoGAM2 from '../assets/logo_GAM2_transparent.png';
import LogoGAM3 from '../assets/logo_GAM3_transparent.png';

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

const getResolutionTime = (created, finished, status) => {
    if (status !== 'Completed') return '-';
    if (!created || !finished) return '-';
    
    const start = new Date(created);
    const end = new Date(finished);
    
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

function Dashboard({ setActivePage, globalSearchTerm, adminViewAs, setAdminViewAs }) {
    const { t } = useLanguage();
    const [stats, setStats] = useState({ active: 0, completed: 0, highPriority: 0, total: 0, priorityData: { high: 0, medium: 0, low: 0 } });
    const [recentLogs, setRecentLogs] = useState([]);
    const [allTickets, setAllTickets] = useState([]);
    const [picsList, setPicsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentHeroLogo, setCurrentHeroLogo] = useState(LogoGAM2);

    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const isAdminUser = currentUser?.role === 'Admin' || (currentUser?.name && currentUser.name.toLowerCase().includes('dwi'));

    const [adminDropdownPics, setAdminDropdownPics] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHeroLogo(prev => prev === LogoGAM2 ? LogoGAM3 : LogoGAM2);
        }, 5000); // Ganti logo setiap 5 detik
        return () => clearInterval(interval);
    }, []);

    // Calendar states
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarMode, setCalendarMode] = useState('days'); // 'days', 'months', 'years'
    const [yearRangeStart, setYearRangeStart] = useState(new Date().getFullYear() - 4);

    // Filters and Pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("Semua Status");
    const [filterPriority, setFilterPriority] = useState("Semua Prioritas");
    const [statusOpen, setStatusOpen] = useState(false);
    const [priorityOpen, setPriorityOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [picPage, setPicPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        const fetchRealData = async () => {
            try {
                let taskData = await getTickets();

                if (!isAdminUser) {
                    taskData = taskData.filter(t => t.pic_name === currentUser?.name);
                } else if (adminViewAs !== 'Semua PIC') {
                    taskData = taskData.filter(t => t.pic_name === adminViewAs);
                }

                // Fetch registered PICs from PIC IT table
                try {
                    let picsData = await getPicIt();

                    if (isAdminUser) {
                        setAdminDropdownPics([...new Set(picsData.map(p => p.pic_name))].filter(Boolean));
                    }

                    if (!isAdminUser) {
                        picsData = picsData.filter(p => p.pic_name === currentUser?.name);
                    } else if (adminViewAs !== 'Semua PIC') {
                        picsData = picsData.filter(p => p.pic_name === adminViewAs);
                    }
                    const uniqueNames = [...new Set(picsData.map(p => p.pic_name))].filter(Boolean);
                    setPicsList(uniqueNames);
                } catch (picErr) {
                    console.error("Gagal memuat data PIC untuk insight:", picErr);
                }

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

                    if (priority.includes("high") || priority.includes("tinggi") || priority.includes("urgent")) {
                        highPriority++;
                        prioHigh++;
                    } else if (priority.includes("medium") || priority.includes("normal") || priority.includes("sedang")) {
                        prioMed++;
                    } else {
                        prioLow++;
                    }
                }

                setStats({ active, completed, highPriority, total, priorityData: { high: prioHigh, medium: prioMed, low: prioLow } });

                // Map all tickets
                const mappedTickets = taskData.map(row => {
                    const createdDate = fixDate(row.created_at);
                    const updatedDate = row.updated_at ? fixDate(row.updated_at) : null;
                    const createdFormat = {
                        date: createdDate ? createdDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
                        time: createdDate ? createdDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'
                    };

                    return {
                        id: row.id,
                        ticketId: `#${row.id}`,
                        req: row.description || 'Tidak ada deskripsi',
                        app: row.category || '365',
                        subject: row.title || '-',
                        prio: row.priority || 'Medium',
                        status: row.status || 'To Do',
                        pic: row.pic_name || null,
                        createdFormat: createdFormat,
                        created_at: row.created_at,
                        finished_at: row.finished_at || row.updated_at,
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
                            return { title: t("Task diselesaikan"), desc: row.title, time: timeStr, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50' };
                        } else if (row.status === 'On Progress') {
                            return { title: t("Task diproses"), desc: row.title, time: timeStr, icon: Activity, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50' };
                        } else if (row.priority === 'High') {
                            return { title: t("Prioritas tinggi"), desc: row.title, time: timeStr, icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50' };
                        } else {
                            return { title: t("Ticket baru / To Do"), desc: row.title, time: timeStr, icon: Activity, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50' };
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
    }, [adminViewAs, isAdminUser, currentUser?.name]);

    // Filter Logic
    const filteredTickets = React.useMemo(() => {
        return allTickets.filter(ticket => {
            const activeSearch = searchTerm || globalSearchTerm || "";
            const matchesSearch =
                ticket.ticketId.toLowerCase().includes(activeSearch.toLowerCase()) ||
                ticket.subject.toLowerCase().includes(activeSearch.toLowerCase());

            const matchesStatus = filterStatus === "Semua Status" || ticket.status.toLowerCase().includes(filterStatus.toLowerCase());
            const matchesPriority = filterPriority === "Semua Prioritas" || ticket.prio.toLowerCase() === filterPriority.toLowerCase();

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [allTickets, searchTerm, globalSearchTerm, filterStatus, filterPriority]);

    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const currentTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

            const hasActiveTickets = allTickets.some(t => {
                if (!t.rawDate) return false;
                const isCompleted = t.status.toLowerCase().includes('complete') || t.status.toLowerCase().includes('selesai') || t.status.toLowerCase().includes('done');
                if (isCompleted) return false;
                return t.rawDate.getDate() === i &&
                    t.rawDate.getMonth() === month &&
                    t.rawDate.getFullYear() === year;
            });

            days.push(
                <div
                    key={`curr-${i}`}
                    onClick={() => setSelectedDate(new Date(year, month, i))}
                    className={`py-1.5 rounded cursor-pointer relative flex flex-col items-center justify-center ${isSelected ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-200' : isToday ? 'text-blue-600 font-bold hover:bg-slate-50 dark:hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <span>{i}</span>
                    {hasActiveTickets && (
                        <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>
                    )}
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

        const isCompleted = t.status.toLowerCase().includes('complete') || t.status.toLowerCase().includes('selesai') || t.status.toLowerCase().includes('done');
        if (isCompleted) return false;

        return t.rawDate.getDate() === selectedDate.getDate() &&
            t.rawDate.getMonth() === selectedDate.getMonth() &&
            t.rawDate.getFullYear() === selectedDate.getFullYear();
    });

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            {/* Gramedia Corporate Hero Banner */}
            <div className="relative w-full rounded-md overflow-hidden mb-8 border border-slate-200 dark:border-slate-800">
                {/* Background Gradient matching the image (White to Soft Purple/Blue) */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#f0f7ff] via-[#ffffff] to-[#f5efff] dark:from-slate-900 dark:via-slate-800 dark:to-purple-900/20 z-0"></div>

                {/* Dot grid pattern (Left) */}
                <div className="absolute top-10 left-[5%] opacity-[0.15] dark:opacity-[0.05] z-0" style={{ backgroundImage: "radial-gradient(#64748b 2px, transparent 2px)", backgroundSize: "20px 20px", width: "160px", height: "160px" }}></div>

                {/* Dot grid pattern (Right) */}
                <div className="absolute bottom-10 right-[35%] opacity-[0.15] dark:opacity-[0.05] z-0" style={{ backgroundImage: "radial-gradient(#64748b 2px, transparent 2px)", backgroundSize: "20px 20px", width: "200px", height: "160px" }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8">
                    <div className="flex-1 w-full">
                        <p className="text-sm md:text-base font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-3">Innovation, Transformed.</p>
                        <h1 className="text-3xl md:text-4xl lg:text-[42px] font-black text-slate-800 dark:text-white leading-[1.2] mb-4">
                            Application Support
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 font-medium mb-8 text-base md:text-lg">
                            Selamat datang di Website IT Application Support. Pantau dan kelola seluruh kegiatan operasional anda disini.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setActivePage("Tiket")}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded shadow shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                                <PlusCircle size={16} /> Buat Ticket Baru
                            </button>
                            <button
                                onClick={() => setActivePage("Knowledge Base")}
                                className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold rounded shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-y-0.5 flex items-center gap-2">
                                <BookOpen size={16} /> Knowledge Base
                            </button>
                        </div>
                    </div>

                    <div className="relative w-full h-[150px] md:h-[200px] md:w-[35%] lg:w-[30%] xl:w-[25%] flex justify-center md:justify-start items-center mt-6 md:mt-0 shrink-0 transition-all duration-300">
                        {/* Glowing orb behind the logo */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-400/20 to-purple-500/20 blur-3xl rounded-full"></div>

                        {/* Cached Images for Cross-fading */}
                        <img
                            src={LogoGAM2}
                            alt="Gramedia Hero"
                            className={`absolute left-0 right-0 mx-auto md:mx-0 z-10 w-full max-w-[280px] h-auto hover:scale-105 transition-all duration-1000 ${currentHeroLogo === LogoGAM2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                        />
                        <img
                            src={LogoGAM3}
                            alt="Gramedia Hero"
                            className={`absolute left-0 right-0 mx-auto md:mx-0 z-10 w-full max-w-[310px] h-auto hover:scale-105 transition-all duration-1000 ${currentHeroLogo === LogoGAM3 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

                {/* Left Main Content */}
                <div className="flex flex-col gap-6 min-h-0">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title={t("Tiket Aktif")}
                            value={stats.active}
                            icon={Ticket}
                            iconColor="text-blue-500"
                            desc={t("Tiket dalam penanganan")}
                            loading={loading}
                        />
                        <StatCard
                            title={t('Tiket Selesai')}
                            value={stats.completed}
                            icon={CheckCircle2}
                            iconColor="text-emerald-500"
                            desc={t("Total tiket diselesaikan")}
                            loading={loading}
                        />
                        <StatCard
                            title={t('Prioritas Tinggi')}
                            value={stats.highPriority}
                            icon={AlertCircle}
                            iconColor="text-rose-500"
                            desc={t("Butuh tindakan segera")}
                            loading={loading}
                        />
                        <StatCard
                            title={t('Total Laporan')}
                            value={stats.total}
                            icon={Server}
                            iconColor="text-violet-500"
                            desc={t("Keseluruhan tiket harian")}
                            loading={loading}
                        />
                    </div>

                    {/* Middle Section: Charts & Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">

                        {/* Priority Distribution & Workload Insight */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[4px] p-5 shadow-sm flex flex-col h-full min-h-[480px]">
                            <div className="flex justify-between items-center mb-2 shrink-0">
                                <h2 className="text-[13px] font-bold text-slate-800 dark:text-white">
                                    {t('Total Prioritas')} <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">({t('Tiket Aktif')})</span>
                                </h2>
                            </div>

                            {/* Small Grid */}
                            <div className="grid grid-cols-3 gap-2 mt-1">
                                {/* High */}
                                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-[4px] p-2 flex flex-col items-center justify-center text-center">
                                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                                        {loading ? '-' : stats.priorityData.high}
                                    </span>
                                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">{t('Tinggi')}</span>
                                </div>

                                {/* Medium */}
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-[4px] p-2 flex flex-col items-center justify-center text-center">
                                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                                        {loading ? '-' : stats.priorityData.medium}
                                    </span>
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">{t('Sedang')}</span>
                                </div>

                                {/* Low */}
                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-[4px] p-2 flex flex-col items-center justify-center text-center">
                                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                                        {loading ? '-' : stats.priorityData.low}
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">{t('Rendah')}</span>
                                </div>
                            </div>

                            {/* PIC Active Tickets Workload Insight */}
                            <div className="mt-6 border-t border-slate-100 dark:border-slate-700/50 pt-4 flex-1 flex flex-col justify-between">
                                <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wider">
                                    {t('Tiket Aktif per PIC')}
                                </h3>
                                {loading ? (
                                    <div className="text-[11px] text-slate-400 py-2 text-center">{t('Memuat insight...')}</div>
                                ) : (() => {
                                    const activeTickets = allTickets.filter(t =>
                                        !t.status.toLowerCase().includes('complete') &&
                                        !t.status.toLowerCase().includes('selesai') &&
                                        !t.status.toLowerCase().includes('done')
                                    );
                                    const picCounts = {};
                                    // Inisialisasi semua PIC terdaftar dengan 0 tiket
                                    picsList.forEach(name => {
                                        picCounts[name] = 0;
                                    });
                                    // Hitung tiket aktif per PIC
                                    activeTickets.forEach(t => {
                                        const name = t.pic || t('Belum Ditugaskan');
                                        picCounts[name] = (picCounts[name] || 0) + 1;
                                    });

                                    const picWorkload = Object.entries(picCounts)
                                        .map(([name, count]) => ({ name, count }))
                                        .sort((a, b) => b.count - a.count);

                                    if (picWorkload.length === 0) {
                                        return <div className="text-[11px] text-slate-400 py-2 text-center">{t('Tidak ada tiket aktif')}</div>;
                                    }

                                    const PICS_PER_PAGE = 5;
                                    const totalPicPages = Math.ceil(picWorkload.length / PICS_PER_PAGE) || 1;
                                    const safePicPage = Math.max(1, Math.min(picPage, totalPicPages));

                                    const paginatedPicWorkload = picWorkload.slice(
                                        (safePicPage - 1) * PICS_PER_PAGE,
                                        safePicPage * PICS_PER_PAGE
                                    );

                                    return (
                                        <div className="flex flex-col flex-1 justify-between">
                                            <div className="space-y-2 flex-1">
                                                {paginatedPicWorkload.map((pic, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-700/30">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">{pic.name}</span>
                                                        <span className={`font-bold px-2 py-0.5 rounded border text-[10px] ${pic.count > 0
                                                            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-100/30 dark:border-blue-900/20"
                                                            : "text-slate-400 dark:text-slate-550 bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/20 dark:border-slate-750/10"
                                                            }`}>
                                                            {pic.count} {t('Tiket')}
                                                        </span>
                                                    </div>
                                                ))}
                                                {/* Filler items to maintain exact height on last page */}
                                                {Array.from({ length: Math.max(0, PICS_PER_PAGE - paginatedPicWorkload.length) }).map((_, idx) => (
                                                    <div key={`filler-${idx}`} className="flex items-center justify-between text-[11px] p-1.5 rounded border border-transparent opacity-0 pointer-events-none select-none" aria-hidden="true">
                                                        <span className="font-bold">Filler Name</span>
                                                        <span className="font-bold px-2 py-0.5 rounded border text-[10px]">0 Tiket</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Mirroring PIC IT Pagination Style */}
                                            {totalPicPages > 1 && (
                                                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-center gap-1.5 shrink-0">
                                                    <button
                                                        disabled={safePicPage === 1}
                                                        onClick={() => setPicPage(prev => Math.max(1, prev - 1))}
                                                        className="w-7 h-7 flex items-center justify-center rounded-[4px] border border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                                    >
                                                        <ChevronLeft size={14} />
                                                    </button>

                                                    {Array.from({ length: totalPicPages }).map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setPicPage(i + 1)}
                                                            className={`w-7 h-7 flex items-center justify-center rounded-[4px] text-[11px] font-bold transition-colors ${safePicPage === i + 1
                                                                ? 'bg-blue-600 text-white shadow-sm'
                                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                                }`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}

                                                    <button
                                                        disabled={safePicPage === totalPicPages}
                                                        onClick={() => setPicPage(prev => Math.min(totalPicPages, prev + 1))}
                                                        className="w-7 h-7 flex items-center justify-center rounded-[4px] border border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[4px] p-5 shadow-sm flex flex-col h-full min-h-[480px]">
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h2 className="text-[13px] font-bold text-slate-800 dark:text-white">{t('Riwayat Aktivitas Terkini')}</h2>
                                <button className="text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 px-2 py-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 shrink-0">{t('Lihat Semua')}</button>
                            </div>

                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
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

                </div>

                {/* Right Panel Sidebar */}
                <div className="flex flex-col gap-5 min-h-0">

                    {/* Admin View Filter */}
                    {isAdminUser && (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[4px] p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none"></div>

                            <div className="flex items-center gap-2 mb-1">
                                <UserCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-[12px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('View As')}</h3>
                            </div>

                            <div className="relative">
                                <select
                                    value={adminViewAs}
                                    onChange={(e) => setAdminViewAs(e.target.value)}
                                    className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[13px] font-bold text-slate-700 dark:text-slate-300 rounded-[4px] py-2 pl-3 pr-8 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <option value="Semua PIC">{t('Semua PIC (Default)')}</option>
                                    {adminDropdownPics.map(pic => (
                                        <option key={pic} value={pic}>{pic}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {/* Calendar Widget */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[4px] p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => {
                                if (calendarMode === 'days') handlePrevMonth();
                                else if (calendarMode === 'years') setYearRangeStart(prev => prev - 12);
                                else setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
                            }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"><ChevronLeft size={16} /></button>
                            <div className="flex items-center justify-center flex-1">
                                {calendarMode === 'days' && (
                                    <button onClick={() => setCalendarMode('months')} className="text-[12px] font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-3 py-1.5 transition-colors">
                                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </button>
                                )}
                                {calendarMode === 'months' && (
                                    <button onClick={() => { setCalendarMode('years'); setYearRangeStart(currentDate.getFullYear() - (currentDate.getFullYear() % 10)); }} className="text-[12px] font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-3 py-1.5 transition-colors">
                                        {currentDate.getFullYear()}
                                    </button>
                                )}
                                {calendarMode === 'years' && (
                                    <button className="text-[12px] font-bold text-slate-800 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-3 py-1.5 transition-colors pointer-events-none">
                                        {yearRangeStart} - {yearRangeStart + 11}
                                    </button>
                                )}
                            </div>
                            <button onClick={() => {
                                if (calendarMode === 'days') handleNextMonth();
                                else if (calendarMode === 'years') setYearRangeStart(prev => prev + 12);
                                else setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
                            }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"><ChevronRight size={16} /></button>
                        </div>

                        {calendarMode === 'days' ? (
                            <>
                                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-2">
                                    <div>{t('Sen')}</div><div>{t('Sel')}</div><div>{t('Rab')}</div><div>{t('Kam')}</div><div>{t('Jum')}</div><div>{t('Sab')}</div><div>{t('Min')}</div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                    {renderCalendarDays()}
                                </div>
                            </>
                        ) : calendarMode === 'months' ? (
                            <div className="grid grid-cols-3 gap-2">
                                {monthNames.map((m, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setCurrentDate(new Date(currentDate.getFullYear(), i, 1));
                                            setCalendarMode('days');
                                        }}
                                        className={`py-3 text-[11px] font-bold rounded-[4px] transition-colors ${currentDate.getMonth() === i ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600'}`}
                                    >
                                        {m.substring(0, 3)}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => (
                                    <button
                                        key={y}
                                        onClick={() => {
                                            setCurrentDate(new Date(y, currentDate.getMonth(), 1));
                                            setCalendarMode('months');
                                        }}
                                        className={`py-3 text-[11px] font-bold rounded-[4px] transition-colors ${currentDate.getFullYear() === y ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600'}`}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pengingat Tiket */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[4px] p-3.5 shadow-sm flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[12px] font-bold text-slate-800 dark:text-white">{t('Pengingat')}: {selectedDate.getDate()} {monthNames[selectedDate.getMonth()].substring(0, 3)}</h3>
                            <span className="text-[10px] font-semibold text-slate-400">{selectedDateTickets.length} {t('tiket')}</span>
                        </div>
                        {selectedDateTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center w-full text-center border-2 border-dashed border-slate-100 dark:border-slate-700/50 rounded-lg bg-slate-50/50 dark:bg-slate-800/20 py-8">
                                <div className="w-10 h-10 bg-white dark:bg-slate-800 shadow-sm rounded-full flex items-center justify-center mb-3">
                                    <CalendarIcon size={16} strokeWidth={2} className="text-slate-300 dark:text-slate-500" />
                                </div>
                                <h4 className="text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">{t('Jadwal Kosong')}</h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[160px] leading-tight">{t('Tidak ada tugas untuk tanggal ini.')}</p>
                            </div>
                        ) : (
                            <div className="flex flex-row gap-3 overflow-x-auto pb-4 custom-scrollbar items-stretch flex-nowrap mt-1">
                                {selectedDateTickets.map(t_item => (
                                    <div key={t_item.id} className="flex flex-col p-3.5 w-[240px] h-[140px] shrink-0 border border-slate-100 dark:border-slate-700 rounded-[4px] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setActivePage(`TicketDetail_${t_item.id}`)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[12px] font-bold text-blue-600 line-clamp-1 pr-2">{t_item.subject}</span>
                                            <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{new Date(t_item.rawDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-4 leading-relaxed flex-1">{t_item.req}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                </div>
            </div>

            {/* Full Width Section: Table Ticket Terbaru */}
            <div className="mt-6 w-full">
                {/* Table: Ticket Terbaru */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0px_4px_24px_rgba(0,0,0,0.02)] p-6 overflow-hidden">

                    {/* Table Header / Filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-[22px] font-bold text-[#1e293b] dark:text-white tracking-tight leading-none mb-1">{t('Ticket Terbaru')}</h2>
                            <span className="text-[13px] font-medium text-emerald-500">{t('Active Tickets')}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={14} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder={t("Search")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-[200px] pl-9 pr-4 py-2 bg-[#f9fafb] dark:bg-slate-900 rounded-full text-[13px] font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-0 transition-colors border-none"
                                />
                            </div>

                            {/* Status Filter */}
                            <div
                                className="relative inline-flex items-center bg-[#f9fafb] dark:bg-slate-900 rounded-lg px-4 py-2 cursor-pointer border-none outline-none w-[160px]"
                                tabIndex={0}
                                onClick={() => setStatusOpen(!statusOpen)}
                                onBlur={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget)) setStatusOpen(false);
                                }}
                            >
                                <span className="text-[12px] text-slate-500 font-medium mr-2 shrink-0">Status:</span>
                                <span className="text-[12px] font-bold text-[#1e293b] dark:text-slate-200 pr-5 flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{filterStatus === 'Semua Status' ? t('All') : t(filterStatus)}</span>
                                <ChevronDown size={14} strokeWidth={2.5} className="absolute right-3.5 text-[#1e293b] dark:text-slate-400 pointer-events-none" />

                                {statusOpen && (
                                    <div className="absolute top-full mt-2 right-0 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-50 py-1">
                                        {['Semua Status', 'To Do', 'On Progress', 'Completed'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFilterStatus(opt);
                                                    setStatusOpen(false);
                                                }}
                                                className={`block w-full text-left px-4 py-2.5 text-[12px] font-semibold transition-colors ${filterStatus === opt ? 'bg-[#5932EA]/10 text-[#5932EA] dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                            >
                                                {opt === 'Semua Status' ? t('All') : t(opt)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Priority Filter */}
                            <div
                                className="relative inline-flex items-center bg-[#f9fafb] dark:bg-slate-900 rounded-lg px-4 py-2 cursor-pointer border-none outline-none w-[160px]"
                                tabIndex={0}
                                onClick={() => setPriorityOpen(!priorityOpen)}
                                onBlur={(e) => {
                                    if (!e.currentTarget.contains(e.relatedTarget)) setPriorityOpen(false);
                                }}
                            >
                                <span className="text-[12px] text-slate-500 font-medium mr-2 shrink-0">Priority:</span>
                                <span className="text-[12px] font-bold text-[#1e293b] dark:text-slate-200 pr-5 flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{filterPriority === 'Semua Prioritas' ? t('All') : t(filterPriority)}</span>
                                <ChevronDown size={14} strokeWidth={2.5} className="absolute right-3.5 text-[#1e293b] dark:text-slate-400 pointer-events-none" />

                                {priorityOpen && (
                                    <div className="absolute top-full mt-2 right-0 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden z-50 py-1">
                                        {['Semua Prioritas', 'High', 'Medium', 'Low'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFilterPriority(opt);
                                                    setPriorityOpen(false);
                                                }}
                                                className={`block w-full text-left px-4 py-2.5 text-[12px] font-semibold transition-colors ${filterPriority === opt ? 'bg-[#5932EA]/10 text-[#5932EA] dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                            >
                                                {opt === 'Semua Prioritas' ? t('All') : t(opt)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto min-h-[305px]">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[28%]">{t('Ticket Name')}</th>
                                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%] text-center">{t('Service')}</th>
                                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[13%] text-center">{t('PIC')}</th>
                                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%] text-center">{t('Status')}</th>
                                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[10%] text-center">{t('Priority')}</th>
                                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[13%] text-center">{t('Created Date')}</th>
                                    <th className="py-3.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[12%] text-center">{t('Waktu Penyelesaian')}</th>
                                </tr>
                            </thead>
                            <tbody key={`page-${currentPage}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {loading ? (
                                    <tr className="h-[250px]">
                                        <td colSpan="7" className="py-8 text-center text-slate-500 align-middle">{t('Loading tickets...')}</td>
                                    </tr>
                                ) : currentTickets.length === 0 ? (
                                    <tr className="h-[250px]">
                                        <td colSpan="7" className="py-8 text-center text-slate-500 align-middle">{t('Tidak ada tiket ditemukan')}</td>
                                    </tr>
                                ) : Array.from({ length: itemsPerPage }).map((_, index) => {
                                    const ticket = currentTickets[index];

                                    if (!ticket) {
                                        // Empty row to maintain fixed table height
                                        return (
                                            <tr key={`empty-${index}`} className="border-b border-transparent">
                                                <td className="py-4 px-2 h-[70px]" colSpan="7"></td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 last:border-0 cursor-pointer" onClick={() => setActivePage(`TicketDetail_${ticket.id}`)}>
                                            <td className="px-6 py-4 align-middle h-[70px]">
                                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-2 leading-snug" style={{ wordBreak: 'break-word' }}>
                                                    {ticket.subject}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{ticket.req}</div>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
                                                    {ticket.app}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                <div className="flex items-center justify-start gap-3 w-[130px] mx-auto text-left">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[11px] shrink-0 shadow-sm ${ticket.pic ? getAvatarColor(ticket.pic) : 'bg-slate-200 text-slate-500'}`}>
                                                        {getInitials(ticket.pic)}
                                                    </div>
                                                    <span className="font-bold text-sm text-slate-800 dark:text-white truncate">{ticket.pic || t('Unassigned')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold ${ticket.status === 'Completed'
                                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                        : ticket.status === 'On Progress'
                                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                    }`}>
                                                    {t(ticket.status)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                {ticket.prio === 'High' ? (
                                                    <span className="inline-flex items-center justify-center text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                                                        {t('High')}
                                                    </span>
                                                ) : ticket.prio === 'Medium' ? (
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
                                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{ticket.createdFormat?.date}</div>
                                                <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{ticket.createdFormat?.time}</div>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${ticket.status === 'Completed' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50' : 'text-slate-400'}`}>
                                                    {getResolutionTime(ticket.created_at, ticket.finished_at, ticket.status)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">

                            <span className="text-[13px] font-medium text-slate-400 hidden sm:inline">
                                {t('Showing data')} {currentTickets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} {t('to')} {Math.min(currentPage * itemsPerPage, filteredTickets.length)} {t('of')} {filteredTickets.length} {t('entries')}
                            </span>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => prev === 1 ? totalPages : prev - 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded-[4px] bg-[#f9fafb] dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                </button>

                                {Array.from({ length: totalPages }).map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentPage(idx + 1)}
                                        className={`w-7 h-7 flex items-center justify-center rounded-[4px] text-[12px] font-semibold transition-colors ${currentPage === idx + 1
                                            ? 'bg-[#5932EA] text-white shadow-sm'
                                            : 'bg-[#f9fafb] dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(prev => prev === totalPages ? 1 : prev + 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded-[4px] bg-[#f9fafb] dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, iconColor, desc, loading }) {
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm rounded-[4px] p-5 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 flex flex-col min-h-[120px]">
            {/* Top row: Icon and Huge Number */}
            <div className="flex items-center gap-4 mb-4">
                <Icon size={20} strokeWidth={2} className={`${iconColor} shrink-0`} />
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
