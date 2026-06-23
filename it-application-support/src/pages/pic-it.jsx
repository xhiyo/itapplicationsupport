import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, Search, Users, LayoutGrid, Building2, ChevronLeft, ChevronRight, CheckCircle2, Leaf } from 'lucide-react';
import { getPicIt, createPicIt, updatePicIt, deletePicIt, bulkUpdatePicName, bulkDeletePicGroup, createPicNameOnly } from '../services/api';

function PICIT() {
    const [pics, setPics] = useState([]);
    const [loading, setLoading] = useState(true);

    // View state
    const [selectedPicName, setSelectedPicName] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const picsPerPage = 5;

    // App Table Pagination
    const [currentAppPage, setCurrentAppPage] = useState(1);
    const appsPerPage = 7;

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPic, setEditingPic] = useState(null);
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [groupInputValue, setGroupInputValue] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // New PIC Only states
    const [isAddPicModalOpen, setIsAddPicModalOpen] = useState(false);
    const [picNameOnly, setPicNameOnly] = useState('');

    const [formData, setFormData] = useState({
        pic_name: '',
        system_name: '',
        legal_entity: '',
        keterangan: '',
        unit: ''
    });

    const fetchPics = async () => {
        setLoading(true);
        try {
            const data = await getPicIt();
            setPics(data);

            // Auto-select first PIC if none selected
            if (data.length > 0 && !selectedPicName) {
                const uniqueNames = [...new Set(data.map(p => p.pic_name))].filter(Boolean);
                if (uniqueNames.length > 0) {
                    setSelectedPicName(uniqueNames[0]);
                }
            }
        } catch (error) {
            console.error("Gagal menarik data PIC:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPics();
    }, []);

    // Helper functions
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    // Calculate Metrics
    const groupedPics = React.useMemo(() => {
        return pics.reduce((acc, pic) => {
            const name = pic.pic_name || "Unknown";
            if (!acc[name]) acc[name] = [];
            if (pic.id) {
                acc[name].push(pic);
            }
            return acc;
        }, {});
    }, [pics]);

    const uniquePicNames = React.useMemo(() => [...new Set(pics.map(p => p.pic_name))].filter(Boolean), [pics]);
    const totalPics = uniquePicNames.length;
    const totalApps = pics.filter(p => p.id).length;

    // Calculate unique departments (units)
    const uniqueUnitsSet = new Set();
    pics.forEach(p => {
        if (p.unit) {
            p.unit.split(',').forEach(u => uniqueUnitsSet.add(u.trim().toLowerCase()));
        }
    });
    const totalUnits = uniqueUnitsSet.size;

    // Filter logic
    const filteredPicNames = React.useMemo(() => {
        const cleanString = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanSearch = cleanString(searchTerm);

        return uniquePicNames.filter(name => {
            if (cleanString(name).includes(cleanSearch)) return true;
            // Search in their systems
            return groupedPics[name].some(p => cleanString(p.system_name).includes(cleanSearch));
        });
    }, [uniquePicNames, searchTerm, groupedPics]);

    // Pagination logic
    const totalPages = Math.ceil(filteredPicNames.length / picsPerPage) || 1;
    const paginatedPicNames = filteredPicNames.slice(
        (currentPage - 1) * picsPerPage,
        currentPage * picsPerPage
    );

    // Selected PIC items
    const selectedPicItems = selectedPicName ? (groupedPics[selectedPicName] || []) : [];

    // App Pagination logic
    const totalAppPages = Math.ceil(selectedPicItems.length / appsPerPage) || 1;
    const paginatedAppItems = selectedPicItems.slice(
        (currentAppPage - 1) * appsPerPage,
        currentAppPage * appsPerPage
    );

    // Tag generator helper
    const getSystemTags = (picName) => {
        const items = groupedPics[picName] || [];
        const tags = items.map(item => {
            const sys = item.system_name || '';
            // Ambil kata pertama atau bagian pertama sebelum strip
            if (sys.includes('-')) return sys.split('-')[0].trim();
            const words = sys.split(' ');
            return words[0];
        });
        const uniqueTags = [...new Set(tags)].filter(Boolean);
        const displayTags = uniqueTags.slice(0, 3);
        const remaining = uniqueTags.length - displayTags.length;

        return { displayTags, remaining };
    };

    const handleOpenModal = (pic = null, defaultPicName = '') => {
        if (pic) {
            setEditingPic(pic);
            setFormData({
                pic_name: pic.pic_name || '',
                system_name: pic.system_name || '',
                keterangan: pic.keterangan || '',
                legal_entity: pic.legal_entity || '',
                unit: pic.unit || ''
            });
        } else {
            setEditingPic(null);
            setFormData({
                pic_name: defaultPicName,
                system_name: '',
                keterangan: '',
                legal_entity: '',
                unit: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingPic) {
                await updatePicIt(editingPic.id, formData);
                showToast('Data berhasil diperbarui! 🎉');
            } else {
                await createPicIt(formData);
                showToast('Aplikasi baru berhasil ditambahkan! 🎉');
            }
            setIsModalOpen(false);
            if (!selectedPicName && formData.pic_name) {
                setSelectedPicName(formData.pic_name);
            }
            await fetchPics();
        } catch (error) {
            alert('Gagal menyimpan data PIC ke Database!');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddPicSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createPicNameOnly(picNameOnly);
            showToast(`PIC ${picNameOnly} berhasil ditambahkan! 🎉`);
            setIsAddPicModalOpen(false);
            setPicNameOnly('');
            setSelectedPicName(picNameOnly);
            fetchPics();
        } catch (error) {
            alert('Gagal menambahkan PIC: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus aplikasi ini dari tanggung jawab PIC?')) {
            try {
                await deletePicIt(id);
                fetchPics();
            } catch (error) {
                alert('Gagal menghapus aplikasi!');
            }
        }
    };

    const handleDeleteGroup = async () => {
        if (!selectedPicName) return;
        if (window.confirm(`Yakin ingin menghapus PIC "${selectedPicName}" beserta seluruh aplikasi yang menjadi tanggung jawabnya?`)) {
            try {
                await bulkDeletePicGroup(selectedPicName);
                showToast(`PIC ${selectedPicName} berhasil dihapus!`);
                setSelectedPicName(null);
                fetchPics();
            } catch (error) {
                alert('Gagal menghapus PIC!');
            }
        }
    };

    const handleSaveGroupName = async () => {
        if (!groupInputValue.trim() || groupInputValue === selectedPicName) {
            setIsEditGroupModalOpen(false);
            return;
        }
        try {
            await bulkUpdatePicName(selectedPicName, groupInputValue);
            setIsEditGroupModalOpen(false);
            showToast(`Nama PIC berhasil diubah menjadi ${groupInputValue}!`);
            setSelectedPicName(groupInputValue);
            fetchPics();
        } catch (error) {
            alert('Gagal memperbarui nama PIC!');
        }
    };

    // Color generator based on string
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

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-900 relative overflow-hidden animate-in fade-in duration-500">
            <div className="flex-1 flex flex-col overflow-auto pr-0">
                <div className="flex flex-col p-8 gap-6 min-h-full max-w-[1600px] mx-auto w-full">

                    {/* Top Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                        <div>
                            <h1 className="text-3xl font-bold text-[#0b1b3d] dark:text-white tracking-tight mb-2">PIC IT Application Support</h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Daftar Penanggung Jawab (PIC) dan aplikasi yang menjadi tanggung jawabnya.</p>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsAddPicModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                            >
                                <Plus size={18} strokeWidth={2.5} />
                                Tambah PIC Baru
                            </button>
                        </div>
                    </div>

                    {/* Search & Metrics Row */}
                    <div className="flex flex-col xl:flex-row gap-6 mb-2">
                        {/* Search Bar */}
                        <div className="w-full xl:w-[350px] flex-shrink-0">
                            <div className="relative h-full flex items-center min-h-[56px]">
                                <Search size={18} className="absolute left-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari PIC atau aplikasi..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full h-full pl-12 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-400 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Metric Cards */}
                        <div className="w-full xl:flex-1 grid grid-cols-1 gap-5">
                            {/* Card 1 */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Users size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#0b1b3d] dark:text-white">{totalPics}</h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total PIC</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Layout: Sidebar & Content */}
                    <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 pb-8">

                        {/* LEFT SIDEBAR: PIC List */}
                        <div className="w-full lg:w-[350px] shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl flex flex-col h-[650px] overflow-hidden">
                            <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
                            {paginatedPicNames.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 font-medium text-sm shadow-sm">
                                    Tidak ada PIC yang ditemukan.
                                </div>
                            ) : (
                                paginatedPicNames.map((name) => {
                                    const count = (groupedPics[name] || []).length;
                                    const { displayTags, remaining } = getSystemTags(name);
                                    const isActive = selectedPicName === name;

                                    return (
                                        <div
                                            key={name}
                                            onClick={() => {
                                                setSelectedPicName(name);
                                                setCurrentAppPage(1);
                                            }}
                                            className={`p-5 cursor-pointer transition-all border-b border-slate-100 dark:border-slate-700 last:border-b-0 relative overflow-hidden ${isActive
                                                ? 'bg-blue-50/50 dark:bg-blue-900/40'
                                                : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            {isActive && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500">
                                                    <ChevronRight size={20} strokeWidth={3} />
                                                </div>
                                            )}

                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-sm ${getAvatarColor(name)}`}>
                                                    {name ? name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div className="flex-1 pr-6">
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-[17px] mb-0.5">{name}</h4>
                                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">{count} Tanggung Jawab</p>

                                                    {displayTags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {displayTags.map((tag, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {remaining > 0 && (
                                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold">
                                                                    +{remaining}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            </div>
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                                    <div className="flex items-center justify-center gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${currentPage === i + 1
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}

                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT MAIN CONTENT: Selected PIC Details */}
                        <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden flex flex-col h-[650px]">
                            {selectedPicName ? (
                                <>
                                    {/* Header Detail */}
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md ${getAvatarColor(selectedPicName)}`}>
                                                {selectedPicName ? selectedPicName.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedPicName}</h2>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{selectedPicItems.length} Tanggung Jawab</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <button
                                                onClick={() => handleOpenModal(null, selectedPicName)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold text-sm rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
                                            >
                                                <Plus size={16} />
                                                Tambah Tanggung Jawab
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setGroupInputValue(selectedPicName);
                                                    setIsEditGroupModalOpen(true);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                            >
                                                <Edit2 size={16} />
                                                Edit PIC
                                            </button>
                                            <button
                                                onClick={handleDeleteGroup}
                                                className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-sm rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-sm"
                                            >
                                                <Trash2 size={16} />
                                                Hapus PIC
                                            </button>
                                        </div>
                                    </div>

                                    {/* Table Content */}
                                    <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-800/50">
                                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Daftar Aplikasi yang Menjadi Tanggung Jawab</h3>
                                        </div>
                                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800">
                                            <thead className="bg-white dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-6 py-4">Tanggung Jawab</th>
                                                    <th className="px-6 py-4">Keterangan</th>
                                                    <th className="px-6 py-4">Legal Entity</th>
                                                    <th className="px-6 py-4">Section / Departemen</th>
                                                    <th className="px-6 py-4 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {paginatedAppItems.map((sys) => (
                                                    <tr key={sys.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{sys.system_name}</td>
                                                        <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{sys.keterangan || '-'}</td>
                                                        <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">{sys.legal_entity || '-'}</td>
                                                        <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">{sys.unit || '-'}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleOpenModal(sys)}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Edit Aplikasi"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(sys.id)}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    title="Hapus Aplikasi"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {selectedPicItems.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                                                            <div className="flex flex-col items-center justify-center gap-3">
                                                                <LayoutGrid size={32} className="opacity-20 text-slate-400" />
                                                                <p className="text-slate-400">Belum ada aplikasi yang menjadi tanggung jawab PIC ini.</p>
                                                                <button
                                                                    onClick={() => handleOpenModal(null, selectedPicName)}
                                                                    className="text-blue-600 dark:text-blue-400 hover:underline mt-1"
                                                                >
                                                                    + Tambah Aplikasi Pertama
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium flex justify-between items-center">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            Menampilkan {selectedPicItems.length === 0 ? 0 : ((currentAppPage - 1) * appsPerPage) + 1} - {Math.min(currentAppPage * appsPerPage, selectedPicItems.length)} dari {selectedPicItems.length} aplikasi
                                        </span>

                                        {/* App Pagination Controls */}
                                        {totalAppPages > 1 && (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    disabled={currentAppPage === 1}
                                                    onClick={() => setCurrentAppPage(prev => prev - 1)}
                                                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>

                                                {Array.from({ length: totalAppPages }).map((_, i) => {
                                                    if (
                                                        totalAppPages > 5 &&
                                                        i !== 0 &&
                                                        i !== totalAppPages - 1 &&
                                                        (i < currentAppPage - 2 || i > currentAppPage)
                                                    ) {
                                                        if (i === currentAppPage - 3 || i === currentAppPage + 1) {
                                                            return <span key={i} className="text-slate-400 px-1">...</span>;
                                                        }
                                                        return null;
                                                    }

                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => setCurrentAppPage(i + 1)}
                                                            className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors ${currentAppPage === i + 1
                                                                ? 'bg-blue-600 text-white'
                                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent'
                                                                }`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    );
                                                })}

                                                <button
                                                    disabled={currentAppPage === totalAppPages}
                                                    onClick={() => setCurrentAppPage(prev => prev + 1)}
                                                    className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                        <Users size={32} className="opacity-30" />
                                    </div>
                                    <p className="font-medium text-sm text-center">Pilih PIC dari daftar di sebelah kiri untuk melihat detail aplikasi yang menjadi tanggung jawabnya.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Input/Edit PIC System */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-base">
                                {editingPic ? 'Edit Aplikasi PIC' : 'Tambah Aplikasi Baru'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nama PIC</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.pic_name}
                                    onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                                    className="w-full text-sm px-4 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-xl outline-none cursor-not-allowed"
                                    placeholder="Contoh: Dwi"
                                    disabled
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tanggung Jawab</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.system_name}
                                    onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                                    className="w-full text-sm px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl outline-none transition-all"
                                    placeholder="Contoh: SCM - Trade All Legal Entity"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Keterangan</label>
                                <select
                                    value={formData.keterangan}
                                    onWheel={(e) => e.target.blur()}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                    className="w-full text-sm px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl outline-none transition-all"
                                >
                                    <option value="">Pilih Keterangan...</option>
                                    <option value="365">365</option>
                                    <option value="Di luar 365">Di luar 365</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Legal Entity</label>
                                <input
                                    type="text"
                                    value={formData.legal_entity}
                                    onChange={(e) => setFormData({ ...formData, legal_entity: e.target.value })}
                                    className="w-full text-sm px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl outline-none transition-all"
                                    placeholder="Contoh: All legal entity"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Section / Departemen</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full text-sm px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl outline-none transition-all"
                                    placeholder="Contoh: Toko, HO"
                                />
                            </div>

                            <div className="flex gap-3 mt-4 pt-5 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-70"
                                >
                                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit Group (Rename PIC) */}
            {isEditGroupModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-base">Edit Nama PIC</h3>
                            <button
                                onClick={() => setIsEditGroupModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Baru</label>
                                <input
                                    type="text"
                                    value={groupInputValue}
                                    onChange={(e) => setGroupInputValue(e.target.value)}
                                    className="w-full text-sm px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl outline-none transition-all"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGroupName()}
                                />
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditGroupModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSaveGroupName}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                                >
                                    <Save size={16} /> Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-[200] bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <CheckCircle2 size={20} className="text-emerald-100" />
                    <span className="font-bold tracking-wide text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Modal Tambah PIC Baru (Hanya Nama) */}
            {isAddPicModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-base">Tambah PIC Baru</h3>
                            <button
                                onClick={() => setIsAddPicModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddPicSubmit} className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nama PIC</label>
                                <input
                                    type="text"
                                    required
                                    value={picNameOnly}
                                    onChange={(e) => setPicNameOnly(e.target.value)}
                                    className="w-full text-sm px-4 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl outline-none transition-all"
                                    placeholder="Contoh: Dwi"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddPicModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-70"
                                >
                                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PICIT;
