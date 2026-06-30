import { useState, memo } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

function Layout({ children, activePage, navbarTitle, setActivePage, globalSearchTerm, setGlobalSearchTerm, showBell, user, setAuth }) {
    const [isOpen, setIsOpen] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    const toggleSidebar = (newState) => {
        setIsAnimating(true);
        let val = typeof newState === 'function' ? newState(isOpen) : newState;
        setIsOpen(val);
        // Reset animating class after transition completes
        setTimeout(() => setIsAnimating(false), 400);
    };

    return (
        <div className="h-screen w-screen bg-slate-50 dark:bg-slate-900 flex overflow-hidden relative">
            {/* Global Ambient Background - Dynamics 365 / Fluent Design Style */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Subtle Gradient Orbs */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/5 blur-[120px] dark:bg-blue-600/10"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] dark:bg-indigo-600/10"></div>

                {/* Subtle Dotted Pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNCkiLz48L3N2Zz4=')] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L3N2Zz4=')]"></div>
            </div>

            <div className="relative z-20 flex h-full shadow-lg">
                <Sidebar isOpen={isOpen} activePage={activePage} setActivePage={setActivePage} user={user} setAuth={setAuth} />
            </div>

            <div className="flex-1 h-screen flex flex-col overflow-hidden relative z-10">
                <Navbar setIsOpen={toggleSidebar} activePage={activePage} navbarTitle={navbarTitle} globalSearchTerm={globalSearchTerm} setGlobalSearchTerm={setGlobalSearchTerm} setActivePage={setActivePage} showBell={showBell} />

                {/* Main scrollable content container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-6">
                    <main className="flex-1 w-full relative flex flex-col">
                        {children}
                    </main>

                    <footer className="py-5 mt-4 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                            © 2026 Section Application Support. All rights reserved.
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

export default memo(Layout);  
