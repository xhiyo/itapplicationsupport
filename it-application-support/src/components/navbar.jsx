import { memo, useState, useEffect } from "react";
import {
    Menu,
    Bell,
    ChevronDown,
    HelpCircle
} from "lucide-react";
import axios from "axios";

function Navbar({ setIsOpen, activePage, navbarTitle, globalSearchTerm, setGlobalSearchTerm, setActivePage, showBell }) {
    const [highPriorityTickets, setHighPriorityTickets] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => {
        const fetchHighPriorityTickets = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/tickets");
                const highTickets = res.data.filter(t => t.priority === 'High' && t.status !== 'Completed');
                setHighPriorityTickets(highTickets);
            } catch (error) {
                console.error("Error fetching tickets for navbar:", error);
            }
        };

        fetchHighPriorityTickets();

        // Poll every 30 seconds to keep notification up to date
        const interval = setInterval(fetchHighPriorityTickets, 30000);
        
        window.addEventListener('ticketsUpdated', fetchHighPriorityTickets);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('ticketsUpdated', fetchHighPriorityTickets);
        };
    }, []);

    // Close dropdown when clicking outside (simple implementation by detecting clicks on body can be added, but skipping for brevity)

    return (
        <header className="h-[76px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 relative">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                    <Menu size={20} strokeWidth={2.5} />
                </button>

                <div className="hidden sm:block">
                    <h1 className="text-[16px] font-bold text-slate-800 dark:text-white leading-tight">
                        Dashboard
                    </h1>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Section Application Support
                    </p>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4 z-[200]">
                {showBell && (
                    <div className="relative">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                        >
                            <Bell size={20} />
                            {highPriorityTickets.length > 0 && (
                                <span className="absolute top-2 right-2.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                                    {highPriorityTickets.length}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotifOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl overflow-hidden z-[250] animate-in slide-in-from-top-2 duration-200">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                                    <h3 className="font-bold text-slate-800 dark:text-white text-[14px]">Notifikasi Prioritas</h3>
                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{highPriorityTickets.length} Baru</span>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {highPriorityTickets.length === 0 ? (
                                        <div className="p-6 text-center">
                                            <p className="text-[12px] text-slate-500 dark:text-slate-400">Tidak ada kendala prioritas tinggi saat ini.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {highPriorityTickets.map(ticket => (
                                                <div
                                                    key={ticket.id}
                                                    onClick={() => {
                                                        setIsNotifOpen(false);
                                                        setActivePage(`TicketDetail_${ticket.id}`);
                                                    }}
                                                    className="p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex gap-3"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                                                        <span className="text-[14px]">🚨</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h4 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight mb-1">{ticket.title}</h4>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">#{ticket.id} • {ticket.category || 'Aplikasi'}</p>
                                                        <span className="text-[10px] font-semibold text-red-500 mt-1">{new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 border-t border-slate-100 dark:border-slate-700 text-center bg-slate-50/50 dark:bg-slate-800">
                                    <button onClick={() => { setIsNotifOpen(false); setActivePage("Tiket"); }} className="text-[12px] font-bold text-blue-600 hover:text-blue-700">Lihat Semua Tiket</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-colors">
                    <div className="hidden sm:block text-right">
                        <h2 className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            Gramedia Asri Media
                        </h2>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default memo(Navbar);