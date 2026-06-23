import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, Trash2, ChevronDown } from 'lucide-react';
import axios from 'axios';
import heic2any from 'heic2any';
export default function TicketModal({ isOpen, onClose, onSubmit, initialData, pics = [] }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [layanan, setLayanan] = useState('365');
    const [priority, setPriority] = useState('Low');
    const [status, setStatus] = useState('To Do');
    const [picId, setPicId] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const [rootCause, setRootCause] = useState('');
    const [resolution, setResolution] = useState('');
    const [internalNotes, setInternalNotes] = useState('');

    useEffect(() => {
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else {
            setPreviewUrl(null);
        }
    }, [file]);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || '');
            setLayanan(initialData.category || '365');
            setPriority(initialData.priority || 'Low');
            setStatus(initialData.status || 'To Do');
            setPicId(initialData.pic_id || '');
            // Assuming we might have these later, use empty for now if undefined
            setRootCause(initialData.rootCause || '');
            setResolution(initialData.resolution || '');
            setInternalNotes(initialData.internalNotes || '');
        } else {
            setTitle('');
            setDescription('');
            setLayanan('365');
            setPriority('Low');
            setStatus('To Do');
            setPicId('');
            setRootCause('');
            setResolution('');
            setInternalNotes('');
        }
        setFile(null);
    }, [initialData, isOpen]);

    const processFile = async (selectedFile) => {
        if (!selectedFile) return;

        const validExtensions = ['jpg', 'jpeg', 'png', 'heic', 'heif'];
        const ext = selectedFile.name ? selectedFile.name.split('.').pop().toLowerCase() : '';

        if (!validExtensions.includes(ext) && !selectedFile.type?.startsWith('image/')) {
            alert("Invalid file type! Please upload or paste a JPG, PNG, or HEIC image.");
            if (fileInputRef.current) fileInputRef.current.value = '';
            setFile(null);
            return;
        }

        if (ext === 'heic' || ext === 'heif') {
            try {
                const convertedBlob = await heic2any({
                    blob: selectedFile,
                    toType: "image/jpeg",
                    quality: 0.8
                });
                const newFileName = selectedFile.name.replace(/\.heic|\.heif/i, '.jpg');
                const convertedFile = new File([convertedBlob], newFileName, { type: 'image/jpeg' });
                setFile(convertedFile);
            } catch (error) {
                console.error("Error converting HEIC:", error);
                alert("Failed to process HEIC image.");
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } else {
            setFile(selectedFile);
        }
    };

    const handleFileChange = (e) => {
        processFile(e.target.files[0]);
    };

    useEffect(() => {
        const handlePaste = (e) => {
            if (!isOpen || initialData) return; 

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const fileToProcess = new File([blob], "pasted-image.png", { type: blob.type });
                        processFile(fileToProcess);
                        e.preventDefault();
                    }
                    break;
                }
            }
        };

        if (isOpen && !initialData) {
            window.addEventListener('paste', handlePaste);
        }
        
        return () => {
            window.removeEventListener('paste', handlePaste);
        };
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleAutoParse = async () => {
        if (!file) return alert("Please select an image first");
        setParsing(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await axios.post('http://localhost:5000/api/tickets/ocr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDescription(res.data.text);
        } catch (error) {
            console.error("Error parsing text:", error);
            alert("Failed to parse text from image.");
        } finally {
            setParsing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', layanan);
        formData.append('priority', priority);
        formData.append('status', status);
        if (picId) {
            formData.append('pic_id', picId);
        }
        // formData.append('rootCause', rootCause);
        // formData.append('resolution', resolution);
        // formData.append('internalNotes', internalNotes);
        if (file) {
            formData.append('attachment', file);
        }
        
        await onSubmit(formData, initialData?.id);
        setLoading(false);
        onClose();
    };

    const isEdit = !!initialData;
    const formattedId = initialData ? `#${initialData.id}` : '';

    return (
        <div className="w-full max-h-full bg-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b border-slate-100 shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        {isEdit ? 'Edit Tiket' : 'Buat Tiket Baru'}
                    </h2>
                    {isEdit && (
                        <p className="text-sm font-medium text-slate-500 mt-1">{formattedId}</p>
                    )}
                </div>
                <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Form Body */}
            <form id="ticket-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Judul Tiket <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        placeholder="Masukkan judul tiket"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">Layanan <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select
                                value={layanan}
                                onWheel={(e) => e.target.blur()}
                                onChange={(e) => setLayanan(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none"
                            >
                                <option value="365">365</option>
                                <option value="Di Luar 365">Di Luar 365</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2.5} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">Prioritas <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select
                                value={priority}
                                onWheel={(e) => e.target.blur()}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none"
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2.5} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">PIC <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select
                                required
                                value={picId}
                                onWheel={(e) => e.target.blur()}
                                onChange={(e) => setPicId(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none"
                            >
                                <option value="">Pilih PIC...</option>
                                {[...new Map(pics.map(item => [item.pic_name, item])).values()].map(pic => (
                                    <option key={pic.pic_id} value={pic.pic_id}>{pic.pic_name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2.5} />
                        </div>
                    </div>
                    {isEdit && (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">Status <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    value={status}
                                    onWheel={(e) => e.target.blur()}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 text-sm font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none"
                                >
                                    <option value="To Do">To Do</option>
                                    <option value="On Progress">On Progress</option>
                                    <option value="Completed">Completed</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2.5} />
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Deskripsi Masalah <span className="text-red-500">*</span></label>
                    <textarea
                        required
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none"
                        placeholder="Jelaskan masalah secara detail..."
                    />
                    <div className="text-[11px] text-slate-400 text-right mt-1 font-medium">{description?.length || 0}/2000</div>
                </div>



                {!isEdit && (
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">Lampiran</label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
                            <button
                                type="button"
                                onClick={handleAutoParse}
                                disabled={!file || parsing}
                                className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg font-bold text-xs hover:bg-purple-100 transition-colors disabled:opacity-50"
                            >
                                {parsing ? <span className="animate-spin"><Bot size={14} /></span> : <Bot size={14} />}
                                <span>{parsing ? 'Parsing...' : 'Auto-Parse Text'}</span>
                            </button>
                        </div>
                        
                        {previewUrl ? (
                            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-between p-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded bg-slate-200 shrink-0 overflow-hidden">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-sm font-medium text-blue-600 truncate">{file?.name || 'attachment.jpg'}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFile(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative overflow-hidden">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.heic,.heif,image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 border-dashed rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                    <span>+ Tambah Lampiran</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 shrink-0 flex items-center justify-between bg-white">
                {isEdit ? (
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={16} />
                        Hapus Tiket
                    </button>
                ) : (
                    <div></div>
                )}
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="ticket-form"
                        disabled={loading}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center"
                    >
                        {loading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Buat Tiket')}
                    </button>
                </div>
            </div>
        </div>
    );
}
