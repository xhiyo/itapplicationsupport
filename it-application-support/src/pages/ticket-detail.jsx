import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { invalidateCache } from "../services/api";
import { ArrowLeft, User as UserIcon, Paperclip, Calendar, Tag, ShieldAlert, X, ChevronLeft, ChevronRight, Download, Clock, FileText, Bookmark, Layers, Users, Hash, Info, Ticket as TicketIcon, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const API_URL = "http://localhost:5000/api/tickets";
const UPLOADS_URL = "http://localhost:5000/uploads";

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

const fixDate = (dateString) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
};

export default function TicketDetail({ ticketId, goBack }) {
  const { t } = useLanguage();
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  const imageAttachments = attachments.filter(att => att.file_path.match(/\.(jpeg|jpg|gif|png)$/i));

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const [ticketRes, attachRes] = await Promise.all([
          axios.get(`${API_URL}/${ticketId}`),
          axios.get(`${API_URL}/${ticketId}/attachments`),
        ]);
        setTicket(ticketRes.data);
        setAttachments(attachRes.data);
      } catch (error) {
        console.error("Error fetching ticket details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketData();
  }, [ticketId]);



  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900 rounded-tl-3xl border-l border-t border-slate-200 dark:border-slate-700 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) return <div>Ticket not found</div>;

  const dateObj = fixDate(ticket.created_at);
  const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  const layanan = ticket.category || '-';
  const pic = ticket.pic_name || "Belum di-assign";
  const formattedId = `#${ticket.id}`;

  const statusLower = ticket.status?.toLowerCase() || '';
  const isCompleted = statusLower.includes('complete') || statusLower.includes('selesai');
  const isProgress = statusLower.includes('progress');

  let mainDescription = ticket.description || "-";
  let solutionText = "";

  const solutionMatch = mainDescription.match(/Solusi\s*:\s*([\s\S]*)$/i);
  if (solutionMatch) {
    solutionText = solutionMatch[1].trim();
    mainDescription = mainDescription.replace(/Solusi\s*:\s*([\s\S]*)$/i, '').trim();
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900 rounded-tl-3xl border-l border-t border-slate-200 dark:border-slate-700">
      <div className="w-full p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Top Navigation */}
        <div className="mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm"
          >
            <ArrowLeft size={18} />
            {t('Kembali ke daftar ticket')}
          </button>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-stretch">

          {/* LEFT COLUMN: Main Content */}
          <div className="flex flex-col gap-6 h-full">

            {/* Header Card */}
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                  <TicketIcon size={28} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">{ticket.title}</h1>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.priority === 'High' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/30' :
                      ticket.priority === 'Medium' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/30' :
                        'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30'
                      }`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' :
                      isProgress ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30' :
                        'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border border-slate-100 dark:border-slate-700 shadow-sm ${pic ? getAvatarColor(pic) : 'bg-slate-200 text-slate-500'}`}>
                    {pic ? getInitials(pic) : <Users size={18} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('PIC')}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{pic || t('Belum di-assign')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <Calendar size={18} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('Dibuat pada')}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{formattedDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                    <Clock size={18} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('Waktu')}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{formattedTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deskripsi Card */}
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <FileText size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('Deskripsi')}</h2>
              </div>
              <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed sm:ml-[52px]">
                {mainDescription ? mainDescription.split('\n\n').map((paragraph, i) => (
                  <p key={i} className={i > 0 ? "mt-4" : ""}>
                    {paragraph.replace(/\n/g, ' ')}
                  </p>
                )) : "-"}
              </div>
            </div>

            {/* Solusi Card */}
            {isCompleted && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 sm:p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-400">{t('Solusi')}</h2>
                </div>
                <div className="text-emerald-800 dark:text-emerald-300 text-sm leading-relaxed sm:ml-[52px]">
                  {solutionText ? solutionText.split('\n\n').map((paragraph, i) => (
                    <p key={i} className={i > 0 ? "mt-4" : ""}>
                      {paragraph.replace(/\n/g, ' ')}
                    </p>
                  )) : <span className="italic opacity-70">{t('Solusi belum disertakan.')}</span>}
                </div>
              </div>
            )}

            {/* Lampiran Card */}
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <Paperclip size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('Lampiran')}</h2>
              </div>

              <div className="sm:ml-[52px]">
                {attachments.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {attachments.map(att => {
                      const isImage = att.file_path.match(/\.(jpeg|jpg|gif|png)$/i);
                      const fileUrl = `${UPLOADS_URL}/${att.file_path}`;
                      const fileExt = att.file_name.split('.').pop().toUpperCase();

                      return (
                        <div key={att.id} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors group">
                          <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => {
                            if (isImage) {
                              const idx = imageAttachments.findIndex(img => img.id === att.id);
                              setSelectedImageIndex(idx);
                            } else {
                              window.open(fileUrl, '_blank');
                            }
                          }}>
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                              {isImage ? (
                                <img src={fileUrl} alt={att.file_name} className="w-full h-full object-cover" />
                              ) : (
                                <FileText size={20} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2">{att.file_name}</h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{fileExt} • Attachment</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(fileUrl, att.file_name)}
                            className="p-2 mr-1 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 dark:bg-slate-700/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                            title="Unduh Lampiran"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 inline-block">{t('Tidak ada lampiran disertakan.')}</p>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sidebar Metadata */}
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('Informasi Ticket')}</h3>

              <div className="space-y-1">
                {/* Status */}
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Bookmark size={16} />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <span className={`text-[13px] font-bold text-right ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
                    ticket.status === 'On Progress' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                    {ticket.status}
                  </span>
                </div>

                {/* Prioritas */}
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <ShieldAlert size={16} />
                    <span className="text-sm font-medium">Prioritas</span>
                  </div>
                  <span className={`text-[13px] font-bold ${ticket.priority === 'High' ? 'text-red-600 dark:text-red-400' : ticket.priority === 'Medium' ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{ticket.priority}</span>
                </div>

                {/* Layanan */}
                <div className="flex flex-col gap-2 py-3 border-b border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Layers size={16} />
                    <span className="text-sm font-medium">Layanan</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-white text-right w-full block">{layanan}</span>
                </div>

                {/* Dibuat pada */}
                <div className="flex flex-col gap-2 py-3 border-b border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">Dibuat pada</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-white text-right w-full block">
                    {formattedDate} • {formattedTime}
                  </span>
                </div>



                {/* PIC */}
                <div className="flex flex-col py-3 border-b border-slate-100 dark:border-slate-700/50 gap-2">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Users size={16} />
                    <span className="text-sm font-medium">PIC</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-white text-right w-full block">{pic}</span>
                </div>


                {/* ID Ticket */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Hash size={16} />
                    <span className="text-sm font-medium">ID Ticket</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-white">{formattedId}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Full-size Image Modal (Carousel) */}
      {selectedImageIndex !== null && imageAttachments.length > 0 && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0a0a0a] animate-in fade-in duration-200"
        >
          {/* Top Left: Download */}
          <button
            onClick={() => handleDownload(`${UPLOADS_URL}/${imageAttachments[selectedImageIndex].file_path}`, imageAttachments[selectedImageIndex].file_name)}
            className="absolute top-6 left-6 z-50 text-white/70 hover:text-white p-3 bg-black/50 border border-white/10 hover:bg-black/70 rounded-full transition-colors"
            title="Unduh"
          >
            <Download size={20} />
          </button>

          {/* Top Right: Close */}
          <button
            className="absolute top-6 right-6 z-50 text-white/70 hover:text-white p-3 bg-black/50 border border-white/10 hover:bg-black/70 rounded-full transition-colors"
            onClick={() => setSelectedImageIndex(null)}
            title="Tutup (Esc)"
          >
            <X size={20} />
          </button>

          {/* Left Navigation */}
          {imageAttachments.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(prev => prev === 0 ? imageAttachments.length - 1 : prev - 1);
              }}
              className="absolute left-6 z-50 text-white/70 hover:text-white p-3 bg-black/50 border border-white/10 hover:bg-black/70 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Navigation */}
          {imageAttachments.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex(prev => prev === imageAttachments.length - 1 ? 0 : prev + 1);
              }}
              className="absolute right-6 z-50 text-white/70 hover:text-white p-3 bg-black/50 border border-white/10 hover:bg-black/70 rounded-full transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Image */}
          <div className="relative w-full h-full flex justify-center items-center p-12" onClick={() => setSelectedImageIndex(null)}>
            <img
              src={`${UPLOADS_URL}/${imageAttachments[selectedImageIndex].file_path}`}
              alt={imageAttachments[selectedImageIndex].file_name}
              className="max-w-full max-h-full object-contain rounded-md"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Bottom Dots */}
          {imageAttachments.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 border border-white/10 px-5 py-3 rounded-full z-50">
              {imageAttachments.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`rounded-full transition-all ${idx === selectedImageIndex ? 'w-3 h-3 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
