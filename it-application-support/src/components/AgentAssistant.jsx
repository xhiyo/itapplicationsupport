import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { getDailyTasks, getPicIt } from '../services/api';

const API_KEY = "sk-ws-H.HPRPEP.TAD5.MEUCIQCTrO8Io7ks90t5vzikb_TEOunLt7_M-Wq3dHkOGBe0AgIgeCc0iMyi8-KxHzieHGMDkXP1hxm5cNhvNmWDMs9t8I4";

// Endpoint Alibaba Cloud Model Studio (OpenAI Compatible)
const API_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const fetchWithCache = async (url, cacheKey, ttl = 60000) => {
    const cached = sessionStorage.getItem(cacheKey);
    const cachedTime = sessionStorage.getItem(`${cacheKey}_time`);
    const now = new Date().getTime();

    if (cached && cachedTime && (now - parseInt(cachedTime)) < ttl) {
        return cached;
    }

    const res = await fetch(`${url}&t=${now}`, { cache: "no-store" });
    const text = await res.text();
    sessionStorage.setItem(cacheKey, text);
    sessionStorage.setItem(`${cacheKey}_time`, now.toString());
    return text;
};

function AgentAssistant({ activePage }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Halo! Saya Agent Assistant Anda. Saya sudah siap membantu menganalisis data IT Application Support Anda hari ini. Ada yang ingin ditanyakan?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sheetContext, setSheetContext] = useState("");
    const sheetContextRef = useRef("");
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    // Auto focus input ketika AI selesai menjawab atau saat panel dibuka
    useEffect(() => {
        if (isOpen && !isLoading && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLoading, isOpen]);

    // Ambil data dari SQL Server secara diam-diam agar AI bisa membacanya sesuai halaman yang aktif
    useEffect(() => {
        const fetchContext = async () => {
            try {
                if (activePage === "Dashboard" || activePage === "Chatbot AI" || activePage === "Daily Task" || activePage === "PIC IT Application Support") {
                    const taskData = await getDailyTasks();
                    const picData = await getPicIt();

                    let active = 0, completed = 0, highPriority = 0, total = 0;

                    taskData.forEach(row => {
                        total++;
                        const stage = (row.stage || "").toLowerCase();
                        const priority = (row.priority || "").toLowerCase();
                        if (stage.includes("done") || stage.includes("complete") || stage.includes("selesai")) {
                            completed++;
                        } else if (!stage.includes("cancel") && !stage.includes("batal")) {
                            active++;
                        }
                        if (priority.includes("high") || priority.includes("urgent")) highPriority++;
                    });

                    setSheetContext(`PENTING: Pengguna saat ini sedang melihat layar "${activePage}". Berikut adalah data operasional IT dari SQL Server untuk dianalisis:\n\n[RINGKASAN STATISTIK]\n- Total Task: ${total}\n- Task Selesai: ${completed}\n- Kendala Aktif: ${active}\n- Prioritas Tinggi: ${highPriority}\n\n1. DATA DAILY TASK (JSON):\n${JSON.stringify(taskData)}\n\n2. DATA PIC IT (JSON):\n${JSON.stringify(picData)}`);
                } else {
                    setSheetContext(`Pengguna saat ini sedang membuka halaman: ${activePage}. Tidak ada data tabel spesifik di halaman ini.`);
                }
            } catch (err) {
                console.error("Gagal membaca konteks data:", err);
            }
        };
        fetchContext();
    }, [activePage]);

    const scrollToBottom = (instant = false) => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: instant ? "auto" : "smooth"
            });
        }
    };

    // Saat panel baru dibuka, langsung lompat ke bawah (tanpa animasi)
    useEffect(() => {
        if (isOpen) {
            scrollToBottom(true);
        }
    }, [isOpen]);

    // Saat ada pesan baru masuk, scroll dengan animasi halus
    useEffect(() => {
        if (isOpen) {
            scrollToBottom(false);
        }
    }, [messages]);

    const quickPrompts = [
        "Ringkasan tiket hari ini",
        "Berapa tiket High Priority?",
        "Tampilkan status PIC IT"
    ];

    const handleSend = async (textToSend) => {
        const userMsg = (typeof textToSend === 'string' ? textToSend : input).trim();
        if (!userMsg) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const apiMessages = [
                {
                    role: 'system',
                    content: `[KONTEKS DATA PERUSAHAAN]
\n${sheetContext}

[INSTRUKSI SANGAT PENTING - BACA DENGAN TELITI]
1. Anda adalah gabungan dari Pakar IT Support dan Asisten Pintar (ChatGPT).
2. Jika ditanya seputar "Task", "PIC", atau "IT", jawablah menggunakan [KONTEKS DATA PERUSAHAAN] di atas.
3. JIKA ditanya HAL UMUM (contoh: Jokowi, resep masak, berita), JAWABLAH SEPERTI CHATGPT BIASA! 
   -> DILARANG KERAS menyebutkan kata "Gramedia", "Konteks", atau "Data".
   -> DILARANG KERAS menyinggung bahwa informasi tersebut tidak ada di data Anda.
   -> Langsung saja jawab pertanyaannya secara natural, cerdas, dan santai.
4. Gunakan bullet points (strip "- ") jika jawaban panjang, dan beri spasi antar paragraf. Dilarang pakai cetak tebal (**).
5. TANGGAL HARI INI: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Jika ditanya tentang hal terkini (berita, gadget), gunakan pencarian internet. JAWABLAH DENGAN JUJUR sesuai fakta yang ada di internet. Jika suatu produk/informasi belum dirilis secara resmi, katakan saja masih berupa rumor atau belum dirilis. JANGAN MENGARANG FAKTA (hallucinate) dan jangan memberikan jawaban yang saling bertentangan.
6. PENTING UNTUK PENCARIAN (SEARCH): Pahami konteks kata kunci pengguna. Jika pengguna bertanya tentang hardware/gadget (misal: "keyboard Titan 5"), pastikan Anda mencari dan membahas tentang HARDWARE (perangkat keras), JANGAN keliru menganggapnya sebagai video game, film, atau proyek yang dibatalkan. Jika ambigu, jelaskan berbagai kemungkinannya.`
                },
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userMsg }
            ];

            // Jika API Key dari Dify/Coze/Lainnya, format body harus disesuaikan.
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'qwen-plus', // Model khusus untuk Alibaba Cloud
                    messages: apiMessages,
                    temperature: 0.7,
                    enable_search: true
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const botReply = data.choices?.[0]?.message?.content || "Maaf, tidak ada respons.";
            // Hapus semua karakter markdown (bintang, hash, backtick, dll) secara paksa menggunakan Regex
            const cleanReply = botReply.replace(/[*#_`~]/g, '').trim();

            setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ Koneksi API gagal. Mohon pastikan Base URL API untuk kunci rahasia (sk-ws-...) sudah benar di pengaturan.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Tombol Agent Assistant di Kanan Atas (ketika tertutup) */}
            <div className="relative z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-full shadow-lg border border-slate-700 transition-all hover:scale-105 active:scale-95"
                >
                    <MessageCircle size={18} />
                    <span className="font-semibold text-sm">Ask AI</span>
                </button>
            </div>

            {/* Sidebar Chatbot Overlay & Panel */}
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Sidebar Panel */}
                    <div className="relative w-full max-w-[450px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200/80">
                        
                        {/* Header Panel (Minimalist) */}
                        <div className="px-5 py-4 flex justify-between items-center border-b border-slate-100 shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-md">
                                    <Bot size={20} className="stroke-[2.5]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-[15px] tracking-tight">Copilot Assistant</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto overscroll-contain px-5 py-6 space-y-6">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    
                                    {msg.role === 'assistant' && (
                                        <div className="mr-3 shrink-0 mt-1">
                                            <div className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                                                <Bot size={16} className="text-blue-600" />
                                            </div>
                                        </div>
                                    )}

                                    <div className={`text-[14.5px] leading-relaxed ${msg.role === 'user'
                                        ? 'bg-slate-100 text-slate-800 px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%]'
                                        : 'text-slate-700 pt-1 w-full max-w-[90%]'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            
                            {messages.length === 1 && (
                                <div className="flex flex-wrap gap-2 mt-6 pl-11">
                                    {quickPrompts.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(prompt)}
                                            className="text-[13px] font-medium bg-white text-slate-600 border border-slate-200 px-3.5 py-2 rounded-full hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isLoading && (
                                <div className="flex w-full justify-start">
                                    <div className="mr-3 shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                                            <Bot size={16} className="text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-2.5">
                                        <div className="w-1.5 h-1.5 bg-blue-600/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-blue-600/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-blue-600/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area (Modern Prompt Bar) */}
                        <div className="p-4 bg-white shrink-0 pb-6">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex items-end gap-2 bg-slate-50 p-2 rounded-[24px] border border-slate-200 focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-sm transition-all"
                            >
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    disabled={isLoading}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (input.trim() && !isLoading) handleSend();
                                        }
                                    }}
                                    placeholder="Message Copilot..."
                                    className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-[14.5px] text-slate-800 placeholder:text-slate-400 resize-none min-h-[44px] max-h-[120px] rounded-2xl"
                                    rows={1}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2.5 rounded-full transition-colors shrink-0 mb-0.5 mr-0.5"
                                >
                                    <Send size={18} className="ml-[1px]" />
                                </button>
                            </form>
                            <div className="text-center mt-2.5">
                                <p className="text-[10px] text-slate-400">AI can make mistakes. Verify important information.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AgentAssistant;
