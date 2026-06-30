import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, FileText, X, AlertCircle, Paperclip, Download, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPicIt } from '../services/api';

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

const isImageFile = (filename) => {
    if (!filename) return false;
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
};

function KnowledgeBase() {
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [formData, setFormData] = useState({ title: '', category: '365', content: '', pic_name: '' });
    const [picList, setPicList] = useState([]);
    const [attachment, setAttachment] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const API_URL = `http://${window.location.hostname}:5000/api/knowledge`;

    useEffect(() => {
        fetchArticles();
        fetchPics();
    }, []);

    const fetchPics = async () => {
        try {
            const data = await getPicIt();
            const uniquePics = Array.from(new Set(data.map(p => p.pic_name)))
                .filter(Boolean)
                .map(name => ({ id: name, pic_name: name }));
            setPicList(uniquePics);
        } catch (error) {
            console.error('Failed to fetch PICs:', error);
        }
    };

    const fetchArticles = async () => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Gagal mengambil data. Pastikan tabel KnowledgeBase sudah dibuat di database.');
            }
            const data = await response.json();
            setArticles(data);
        } catch (error) {
            console.error(error);
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (article = null) => {
        if (article) {
            setEditingArticle(article);
            setFormData({ title: article.title, category: article.category, content: article.content, pic_name: article.pic_name || '' });
        } else {
            setEditingArticle(null);
            setFormData({ title: '', category: '365', content: '', pic_name: '' });
        }
        setAttachment(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingArticle(null);
        setAttachment(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const method = editingArticle ? 'PUT' : 'POST';
            const url = editingArticle ? `${API_URL}/${editingArticle.id}` : API_URL;

            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('category', formData.category);
            submitData.append('content', formData.content);
            submitData.append('pic_name', formData.pic_name);
            if (attachment) {
                submitData.append('attachment', attachment);
            }

            const response = await fetch(url, {
                method,
                body: submitData
            });

            if (!response.ok) throw new Error('Gagal menyimpan artikel');

            await fetchArticles();
            handleCloseModal();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Anda yakin ingin menghapus artikel ini?')) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Gagal menghapus artikel');
                await fetchArticles();
            } catch (error) {
                alert(error.message);
            }
        }
    };

    const normalizedQuery = searchQuery.toLowerCase().replace(/\s+/g, '');
    const filteredArticles = articles.filter(a => {
        const title = (a.title || '').toLowerCase().replace(/\s+/g, '');
        const content = (a.content || '').toLowerCase().replace(/\s+/g, '');
        const category = (a.category || '').toLowerCase().replace(/\s+/g, '');

        return title.includes(normalizedQuery);
    });

    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
    const currentArticles = filteredArticles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-6 w-full h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Knowledge Base</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pusat dokumentasi dan solusi kendala IT</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[4px] transition-all shadow-sm"
                >
                    <Plus size={18} />
                    Tambah Artikel
                </button>
            </div>

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[4px] flex items-center gap-3 text-red-700 dark:text-red-400">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{errorMsg}</span>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm rounded-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari judul artikel..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-[4px] focus:outline-none  dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                        />
                    </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center items-center">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                    ) : filteredArticles.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                            <FileText size={48} className="text-slate-300 mb-3" />
                            <p className="font-medium text-slate-600 dark:text-slate-400">Tidak ada artikel ditemukan</p>
                            <p className="text-sm text-slate-500 dark:text-slate-500">Cobalah kata kunci lain atau tambahkan artikel baru.</p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200/80 dark:border-slate-700 flex flex-col shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                            <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[20%]">Judul Artikel</th>
                                            <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[25%]">Deskripsi</th>
                                            <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[10%]">Layanan</th>
                                            <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[15%]">PIC</th>
                                            <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[15%] text-center">Terakhir Diupdate</th>
                                            <th className="py-3 px-4 text-[11px] font-bold text-slate-500 w-[10%] text-center">Lampiran</th>
                                            <th className="py-3 px-2 text-[11px] font-bold text-slate-500 w-[5%] text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody key={`page-${currentPage}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {Array.from({ length: itemsPerPage }).map((_, index) => {
                                            const article = currentArticles[index];
                                            if (!article) {
                                                return (
                                                    <tr key={`empty-${index}`} className="border-b border-slate-50 dark:border-slate-800/50">
                                                        <td className="py-3 px-4 h-[65px]" colSpan="7"></td>
                                                    </tr>
                                                );
                                            }
                                            return (
                                                <tr key={article.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                                    <td className="py-3 px-4 align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-[4px] bg-blue-50/80 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100/50 dark:border-blue-800/50 mt-0.5">
                                                                <FileText size={16} strokeWidth={1.5} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-tight leading-snug line-clamp-2">{article.title}</h3>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 align-middle">
                                                        {article.content ? (
                                                            <div className="prose prose-sm max-w-none text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2 prose-p:m-0 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-semibold hover:prose-a:underline">
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    components={{
                                                                        a: ({ node, ...props }) => {
                                                                            let href = props.href || '';
                                                                            // Ubah Google Drive /copy menjadi /view agar tidak menduplikasi dokumen
                                                                            if (href.includes('docs.google.com') && href.match(/\/copy(\?|$)/)) {
                                                                                href = href.replace(/\/copy(\?|$)/, '/view$1');
                                                                            }
                                                                            return <a {...props} href={href} target="_blank" rel="noopener noreferrer" />
                                                                        }
                                                                    }}
                                                                >
                                                                    {article.content}
                                                                </ReactMarkdown>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 italic">Tidak ada deskripsi</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 align-middle">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${article.category === '365' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'}`}>
                                                            {article.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 align-middle">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-sm ${article.pic_name ? getAvatarColor(article.pic_name) : 'bg-slate-200 text-slate-500'}`}>
                                                                {article.pic_name ? getInitials(article.pic_name) : '?'}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-[11px] text-slate-800 dark:text-white leading-tight">
                                                                    {article.pic_name || 'Admin IT'}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                                    {article.pic_name?.toLowerCase() === 'dwi' ? 'Admin' : 'Staff'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 align-middle text-center">
                                                        <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                                            {new Date((article.updated_at || article.created_at).replace('Z', '')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                                            {new Date((article.updated_at || article.created_at).replace('Z', '')).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 align-middle text-center">
                                                        {article.file_path ? (
                                                            <div>
                                                                <a
                                                                    href={`${API_URL}/download/${article.id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-800 rounded-md transition-colors"
                                                                    title={article.file_name || "Download / Buka Lampiran"}
                                                                >
                                                                    <Paperclip size={12} strokeWidth={2.5} />
                                                                    <span className="text-[10px] font-bold tracking-wide uppercase">Buka File</span>
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-400 dark:text-slate-500">
                                                                <span className="text-[10px] font-medium tracking-wide uppercase">-</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 align-middle text-center">
                                                        <div className="flex items-center justify-center gap-1.5 transition-opacity">
                                                            <button
                                                                onClick={() => handleOpenModal(article)}
                                                                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-[4px] transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(article.id)}
                                                                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-[4px] transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 rounded-b-md">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Baris per halaman:</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[12px] font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                                        >
                                            {[5, 10, 20, 50, 100].map((opt, idx, arr) => {
                                                const isValid = idx === 0 || arr[idx - 1] < filteredArticles.length;
                                                return (
                                                    <option key={opt} value={opt} disabled={!isValid} className={!isValid ? "text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800" : ""}>
                                                        {opt}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <span className="text-[12px] font-medium text-slate-400 hidden sm:inline">
                                        Menampilkan {currentArticles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} hingga {Math.min(currentPage * itemsPerPage, filteredArticles.length)} dari {filteredArticles.length} entri
                                    </span>
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(prev => prev === 1 ? totalPages : prev - 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-[4px] bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>

                                        {Array.from({ length: totalPages }).map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentPage(idx + 1)}
                                                className={`w-7 h-7 flex items-center justify-center rounded-[4px] text-[12px] font-semibold transition-colors ${currentPage === idx + 1
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                {idx + 1}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(prev => prev === totalPages ? 1 : prev + 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-[4px] bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
                    <div className="bg-white dark:bg-slate-800 rounded-md w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editingArticle ? 'Edit Artikel' : 'Tambah Artikel Baru'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-[4px] transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 flex-1 overflow-y-auto space-y-5">
                                <div className="grid grid-cols-3 gap-5">
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Judul Artikel</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[4px]  dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all text-sm"
                                            placeholder="Contoh: Cara Reset Password SAP"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Layanan</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[4px]  dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all text-sm"
                                        >
                                            <option value="365">365</option>
                                            <option value="Diluar 365">Diluar 365</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">PIC</label>
                                        <select
                                            value={formData.pic_name}
                                            onChange={e => setFormData({ ...formData, pic_name: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[4px]  dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all text-sm"
                                            required
                                        >
                                            <option value="" disabled>Pilih PIC...</option>
                                            {picList.map(pic => (
                                                <option key={pic.id} value={pic.pic_name}>{pic.pic_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Lampirkan File (Opsional)</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                onChange={e => setAttachment(e.target.files[0])}
                                                className="w-full px-4 py-2 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[4px]  dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                                            />
                                        </div>
                                        {editingArticle?.file_name && !attachment && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                <Paperclip size={12} /> File saat ini: {editingArticle.file_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex-1 flex flex-col h-64">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                                        <span>Deskripsi / Link (Mendukung Markdown)</span>
                                    </label>
                                    <textarea
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full flex-1 px-4 py-3 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[4px]  dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all text-sm font-mono resize-none placeholder-slate-400 dark:placeholder-slate-500"
                                        placeholder="Ketik isi panduan atau penjelasan detail di sini..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[4px] transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-[4px] transition-colors shadow-sm"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Artikel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KnowledgeBase;
