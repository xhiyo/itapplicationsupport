import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Laporan({ setActivePage }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full relative bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="px-8 py-5 shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-tight">
            {t('Reports')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Halaman Laporan
          </p>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <p className="font-medium text-sm">Halaman laporan telah dikosongkan.</p>
      </div>
    </div>
  );
}
