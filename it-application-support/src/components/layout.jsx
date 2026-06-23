import { useState, memo } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

function Layout({ children, activePage, navbarTitle, setActivePage, globalSearchTerm, setGlobalSearchTerm, showBell }) {
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
        <div className="h-screen w-screen bg-slate-50 dark:bg-slate-900 flex overflow-hidden">
            <Sidebar isOpen={isOpen} activePage={activePage} setActivePage={setActivePage} />

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