import { memo } from "react";
import gramediaLogo from "../assets/gramedia-g-logo-transparent.png";
import {
    LayoutDashboard,
    Bot,
    UserRound,
    BookOpen,
    Ticket,
    FileText,
    Settings,
    LogOut,
    RefreshCw
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const items = [
    { title: "Dashboard", icon: LayoutDashboard },
    { title: "Ticket", icon: Ticket },
    { title: "Recurring Task", icon: RefreshCw },
    { title: "Laporan", icon: FileText },
    { title: "Knowledge Base", icon: BookOpen },
    { title: "PIC", icon: UserRound },
    { title: "Chatbot AI", icon: Bot },
    { title: "Pengaturan", icon: Settings },
];

function Sidebar({ isOpen, activePage, setActivePage, user, setAuth }) {
    const { t } = useLanguage();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuth(null);
        setActivePage("Landing");
    };

    return (
        <aside
            className={`h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 py-6 flex flex-col overflow-hidden shrink-0 transition-[width] duration-[400ms] ease-in-out will-change-[width] z-20 ${isOpen ? "w-[280px]" : "w-[88px]"}`}
        >
            {/* Logo Area */}
            <div className={`px-6 flex items-center gap-3 overflow-hidden transition-all duration-[400ms] ease-in-out mb-8`}>
                <div className="flex items-center justify-center shrink-0 w-10 h-10 bg-white dark:bg-slate-900 rounded-[4px] relative overflow-hidden">
                    <img src={gramediaLogo} alt="Gramedia Logo" className="w-9 h-9 object-contain z-10" />
                </div>

                <div
                    className={`overflow-hidden transition-all duration-[400ms] ease-in-out ${isOpen ? "opacity-100 translate-x-0 w-[180px]" : "opacity-0 -translate-x-2 w-0"}`}
                >
                    <h1 className="text-[14px] font-bold text-slate-800 dark:text-white leading-tight whitespace-nowrap">
                        Section Application<br />Support
                    </h1>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar">
                {items.map((item, index) => {
                    const Icon = item.icon;
                    // Support active state checking
                    const isActive = activePage === item.title ||
                        (item.title === "Ticket" && (activePage === "Tiket" || activePage?.startsWith("TicketDetail_")));

                    return (
                        <button
                            type="button"
                            key={index}
                            onClick={() => setActivePage(item.title === "Ticket" ? "Tiket" : item.title)}
                            className={`w-full flex items-center rounded-[4px] text-left transition-all duration-300 ease-out px-3 py-3 group relative overflow-hidden ${isActive
                                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                        >
                            <span className={`flex items-center justify-center shrink-0 transition-transform duration-300 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"}`}>
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </span>

                            <span
                                className={`overflow-hidden whitespace-nowrap text-sm tracking-wide transition-all duration-[400ms] ease-in-out ${isOpen
                                    ? "opacity-100 w-auto ml-3 translate-x-0"
                                    : "opacity-0 w-0 ml-0 -translate-x-2"
                                    }`}
                            >
                                {t(item.title)}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Sections: Help Card & Profile */}
            <div className="mt-auto px-4 flex flex-col gap-4 overflow-hidden shrink-0 pb-2">
                {/* Profile Section */}
                <div className="flex items-center justify-between p-2 rounded-[4px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden transition-all duration-[400ms] ease-in-out">
                        <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-[13px] border border-blue-200 dark:border-blue-800">
                            {user && user.name ? user.name.charAt(0).toUpperCase() : "G"}
                        </div>
                        <div className={`text-left flex flex-col overflow-hidden transition-all duration-[400ms] ease-in-out ${isOpen ? "opacity-100 translate-x-0 w-[180px]" : "opacity-0 -translate-x-2 w-0"}`}>
                            <h4 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight flex whitespace-nowrap">{user ? user.name : "Guest"}</h4>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${user?.role === 'Admin' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                                {user ? user.role : "Unknown"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center rounded-[4px] text-left transition-all duration-300 ease-out px-3 py-3 group relative overflow-hidden text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <span className="flex items-center justify-center shrink-0 transition-transform duration-300">
                        <LogOut size={20} strokeWidth={2} />
                    </span>
                    <span
                        className={`overflow-hidden whitespace-nowrap text-sm font-bold tracking-wide transition-all duration-[400ms] ease-in-out ${isOpen
                            ? "opacity-100 w-auto ml-3 translate-x-0"
                            : "opacity-0 w-0 ml-0 -translate-x-2"
                            }`}
                    >
                        {t('Keluar')}
                    </span>
                </button>
            </div>
        </aside>
    );
}

export default memo(Sidebar);
