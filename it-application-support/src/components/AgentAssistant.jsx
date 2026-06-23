import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
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

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
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
        <div className="relative">
            {/* Tombol Agent Assistant di Kanan Atas */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
                <Sparkles size={18} className="animate-pulse" />
                <span className="font-semibold text-sm">AI Agent</span>
            </button>

            {/* Panel Chatbot */}
            {isOpen && (
                <div className="absolute top-14 right-0 w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-[200] overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
                    {/* Header Panel */}
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">IT Support Agent</h3>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                                    <Loader2 size={16} className="text-violet-600 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                disabled={isLoading}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Tanyakan seputar data IT Support..."
                                className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-slate-700 placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white p-2 rounded-lg transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AgentAssistant;
