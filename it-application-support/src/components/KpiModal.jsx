import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getPicKpis, createPicKpi, updatePicKpi, deletePicKpi } from '../services/api';

export default function KpiModal({ isOpen, onClose, picId, picName }) {
    const { t } = useLanguage();
    const [kpis, setKpis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ kpi_name: '', target_value: 0, unit: '' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (isOpen && picId) {
            fetchKpis();
        }
    }, [isOpen, picId]);

    const fetchKpis = async () => {
        setLoading(true);
        try {
            const data = await getPicKpis(picId);
            setKpis(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await createPicKpi({ pic_id: picId, ...editForm });
            setIsCreating(false);
            setEditForm({ kpi_name: '', target_value: 0, unit: '' });
            fetchKpis();
        } catch (error) {
            alert(t('Gagal menyimpan KPI'));
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await updatePicKpi(editingId, editForm);
            setEditingId(null);
            fetchKpis();
        } catch (error) {
            alert(t('Gagal mengupdate KPI'));
        }
    };

    const handleDelete = async (id) => {
        if (confirm(t('Apakah Anda yakin ingin menghapus KPI ini?'))) {
            try {
                await deletePicKpi(id);
                fetchKpis();
            } catch (error) {
                alert(t('Gagal menghapus KPI'));
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-md w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                            {t('Kelola Target KPI')}
                        </h2>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                            {t('PIC:')} <span className="font-bold text-blue-600 dark:text-blue-400">{picName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
                    {loading ? (
                        <div className="text-center py-10 text-slate-500">{t('Loading...')}</div>
                    ) : (
                        <div className="space-y-4">
                            {kpis.map(kpi => (
                                <div key={kpi.id} className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[4px] p-4 shadow-sm flex items-center justify-between">
                                    {editingId === kpi.id ? (
                                        <form onSubmit={handleUpdateSubmit} className="flex-1 flex gap-3 items-end">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">{t('Nama KPI')}</label>
                                                <input type="text" required value={editForm.kpi_name} onChange={e => setEditForm({...editForm, kpi_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-[4px] text-sm" />
                                            </div>
                                            <div className="w-24">
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">{t('Target')}</label>
                                                <input type="number" required value={editForm.target_value} onChange={e => setEditForm({...editForm, target_value: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-[4px] text-sm" />
                                            </div>
                                            <div className="w-32">
                                                <label className="text-xs font-bold text-slate-500 mb-1 block">{t('Satuan')}</label>
                                                <input type="text" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} placeholder="Tiket, %, dll" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-[4px] text-sm" />
                                            </div>
                                            <div className="flex gap-2 pb-0.5">
                                                <button type="submit" className="p-2 bg-emerald-100 text-emerald-600 rounded-[4px] hover:bg-emerald-200"><Save size={18} /></button>
                                                <button type="button" onClick={() => setEditingId(null)} className="p-2 bg-slate-100 text-slate-500 rounded-[4px] hover:bg-slate-200"><X size={18} /></button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white">{kpi.kpi_name}</h4>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {t('Target:')} <span className="font-bold text-slate-700 dark:text-slate-300">{kpi.target_value} {kpi.unit}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => {
                                                    setEditingId(kpi.id);
                                                    setEditForm({ kpi_name: kpi.kpi_name, target_value: kpi.target_value, unit: kpi.unit });
                                                    setIsCreating(false);
                                                }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-[4px] transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(kpi.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-[4px] transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            {kpis.length === 0 && !isCreating && (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[4px]">
                                    {t('Belum ada target KPI khusus untuk PIC ini.')}
                                </div>
                            )}

                            {isCreating && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-[4px] p-4 shadow-sm">
                                    <form onSubmit={handleCreateSubmit} className="flex gap-3 items-end">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 block">{t('Nama KPI')}</label>
                                            <input type="text" required value={editForm.kpi_name} onChange={e => setEditForm({...editForm, kpi_name: e.target.value})} placeholder="Contoh: Target Resolusi" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-[4px] text-sm" />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 block">{t('Target')}</label>
                                            <input type="number" required value={editForm.target_value} onChange={e => setEditForm({...editForm, target_value: Number(e.target.value)})} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-[4px] text-sm" />
                                        </div>
                                        <div className="w-32">
                                            <label className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1 block">{t('Satuan')}</label>
                                            <input type="text" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value})} placeholder="Tiket, %, dll" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-[4px] text-sm" />
                                        </div>
                                        <div className="flex gap-2 pb-0.5">
                                            <button type="submit" className="p-2 bg-blue-600 text-white rounded-[4px] hover:bg-blue-700"><Save size={18} /></button>
                                            <button type="button" onClick={() => setIsCreating(false)} className="p-2 bg-slate-200 text-slate-600 rounded-[4px] hover:bg-slate-300"><X size={18} /></button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {!isCreating && !editingId && (
                                <button 
                                    onClick={() => {
                                        setIsCreating(true);
                                        setEditForm({ kpi_name: '', target_value: 0, unit: '' });
                                    }}
                                    className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-[4px] font-bold transition-all text-sm"
                                >
                                    <Plus size={18} /> {t('Tambah KPI Baru')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
