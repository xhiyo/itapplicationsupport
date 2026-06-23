import React from 'react';
import { ArrowRight, LayoutDashboard, ShieldCheck, Server } from 'lucide-react';
import HeroBuilding from '../assets/enhanced_building.png';
import GramediaLogo from '../assets/gramedia-g-logo-transparent.png';

function LandingPage({ onGetStarted }) {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 flex flex-col overflow-x-hidden transition-colors">

            {/* Top Section (Hero + Navbar) */}
            <div className="relative w-full flex-1 bg-[#f8f9fc] dark:bg-slate-900 flex flex-col pt-4 overflow-hidden">

                {/* Microsoft 365 Fluent UI Inspired Background */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {/* Soft Fluent Orbs */}
                    <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[80%] rounded-[100%] bg-gradient-to-br from-blue-200/30 to-indigo-200/30 dark:from-blue-900/20 dark:to-indigo-900/20 blur-[100px]"></div>
                    <div className="absolute bottom-0 left-[10%] w-[50%] h-[60%] rounded-[100%] bg-gradient-to-tr from-sky-100/40 to-transparent dark:from-sky-900/10 blur-[80px]"></div>
                    
                    {/* Subtle Dot Pattern */}
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                </div>

                {/* Navbar */}
                <nav className="w-full px-6 lg:px-12 py-4 flex items-center justify-between relative z-20">
                    <div className="flex items-center gap-3">
                        <img src={GramediaLogo} alt="Gramedia Logo" className="h-10 w-auto object-contain dark:brightness-200" />
                        <div className="flex flex-col">
                            <span className="font-bold text-[1.1rem] leading-none text-slate-900 dark:text-white tracking-tight">IT Application Support</span>
                        </div>
                    </div>
                </nav>

                {/* Hero Content */}
                <main className="w-full px-6 lg:px-12 flex flex-col lg:flex-row items-center relative z-10 flex-1">

                    {/* Left Text */}
                    <div className="w-full lg:w-[55%] pt-16 pb-20 lg:py-0 flex flex-col items-start text-left z-20 pr-0 lg:pr-10">
                        {/* Subtitle */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-5 bg-blue-600 dark:bg-blue-500"></div>
                            <span className="text-slate-500 dark:text-slate-400 font-semibold tracking-wide text-xs md:text-sm uppercase">Sistem Manajemen Application Support </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-6xl font-bold text-[#1e293b] dark:text-white tracking-tight mb-6 leading-[1.15]">
                            IT Application Support
                        </h1>

                        {/* Description */}
                        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mb-10 leading-relaxed">
                            Solusi terintegrasi untuk pelaporan, pemantauan, dan penyelesaian kendala operasional IT secara efektif.
                        </p>

                        {/* Button */}
                        <button
                            onClick={onGetStarted}
                            className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3.5 rounded-lg font-semibold text-[15px] hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <LayoutDashboard size={18} />
                            Masuk ke Dashboard
                            <ArrowRight size={18} className="ml-2" />
                        </button>
                    </div>
                </main>


                {/* Right Image (Absolute on Desktop, bleeding to right edge) */}
                <div className="w-full lg:absolute lg:top-0 lg:right-0 lg:w-[45%] h-[300px] lg:h-full z-0 overflow-hidden">
                    <img
                        src={HeroBuilding}
                        alt="Building Background"
                        className="w-full h-full object-cover object-left opacity-90 dark:opacity-75 transition-opacity"
                        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0% 100%)' }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="w-full bg-[#f8f9fc] dark:bg-slate-900 py-6 text-center text-[13px] font-medium text-slate-400 dark:text-slate-500 relative z-20">
                © 2026 Gramedia · IT Application Support System
            </div>

        </div>
    );
}

export default LandingPage;
