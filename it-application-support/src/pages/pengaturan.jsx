import React, { useState } from 'react';
import { 
    Monitor, Ticket, Bell, Database, Info,
    Sun, Moon, RotateCcw, Trash2, Settings, Globe
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

function Pengaturan({ theme, setTheme, showBell, setShowBell, language, setLanguage }) {
    const { t } = useLanguage();

    return (
        <div className="animate-in fade-in duration-500 pb-10">
            
            {/* Header Area */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <Settings className="text-blue-600" size={24} /> {t('Pengaturan')}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('Kelola preferensi aplikasi agar sesuai dengan kebutuhan Anda.')}</p>
                </div>
            </div>

            <div>
                <div className="max-w-6xl mx-auto space-y-12 pt-4">
                    {/* Preferensi Tampilan */}
                    <section id="tampilan" className="scroll-mt-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Monitor size={22} className="text-slate-700 dark:text-slate-300" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('Preferensi Tampilan')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('Sesuaikan tampilan aplikasi agar lebih nyaman digunakan.')}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
                            <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('Tema')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Pilih tema aplikasi yang Anda sukai.')}</p>
                                </div>
                                <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <button onClick={() => setTheme('light')} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold min-w-[100px] transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 border border-slate-200 dark:border-slate-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'}`}>
                                        <Sun size={14} /> {t('Terang')}
                                    </button>
                                    <button onClick={() => setTheme('dark')} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold min-w-[100px] transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 border border-slate-200 dark:border-slate-600' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'}`}>
                                        <Moon size={14} /> {t('Gelap')}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('Bahasa Aplikasi')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Pilih bahasa utama untuk antarmuka aplikasi.')}</p>
                                </div>
                                <div className="relative min-w-[200px]">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Globe size={16} className="text-slate-400" />
                                    </div>
                                    <select 
                                        value={language}
                                        onChange={(e) => {
                                            setLanguage(e.target.value);
                                            localStorage.setItem('language', e.target.value);
                                        }}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="Indonesia">Indonesia</option>
                                        <option value="Inggris">Inggris</option>
                                        <option value="Arab">Arab</option>
                                        <option value="Cina">Cina</option>
                                        <option value="Jerman">Jerman</option>
                                        <option value="Perancis">Perancis</option>
                                        <option value="Jawa">Jawa</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Notifikasi Sistem */}
                    <section id="notifikasi" className="scroll-mt-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Bell size={22} className="text-slate-700 dark:text-slate-300" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('Notifikasi Sistem')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('Atur pemberitahuan yang muncul pada ikon lonceng aplikasi.')}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
                            <div className="p-5 flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('Ikon Notifikasi Navbar')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Tampilkan ikon lonceng untuk pemberitahuan tiket High/Urgent di bagian atas layar.')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input type="checkbox" className="sr-only peer" checked={showBell} onChange={(e) => setShowBell(e.target.checked)} />
                                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Data & Aplikasi */}
                    <section id="data" className="scroll-mt-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Database size={22} className="text-slate-700 dark:text-slate-300" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('Data & Aplikasi')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('Kelola data lokal aplikasi di perangkat Anda.')}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
                            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('Reset Preferensi')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Kembalikan semua pengaturan ke default.')}</p>
                                </div>
                                <button onClick={() => { setTheme('light'); setShowBell(true); }} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer">
                                    <RotateCcw size={14} /> {t('Reset')}
                                </button>
                            </div>

                            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('Bersihkan Cache Lokal')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Hapus cache untuk meningkatkan performa aplikasi.')}</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        window.__apiCache = {};
                                        localStorage.clear();
                                        sessionStorage.clear();
                                        alert("Cache lokal berhasil dibersihkan! Aplikasi akan dimuat ulang.");
                                        window.location.reload();
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                                >
                                    <Trash2 size={14} /> {t('Bersihkan')}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Tentang Aplikasi */}
                    <section id="tentang" className="scroll-mt-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Info size={22} className="text-slate-700 dark:text-slate-300" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('Tentang Aplikasi')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('Informasi versi dan pembaruan.')}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-5 flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{t('Versi Aplikasi')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Versi terbaru yang sedang Anda gunakan.')}</p>
                                </div>
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold font-mono">v2.1.0-beta</span>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

export default Pengaturan;

