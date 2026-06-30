import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader2, Sparkles, User, Trash2, Plus, MessageSquare, Menu, X, MoreHorizontal, Edit2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
const AI_URL = `http://${window.location.hostname}:5000/api/ai/chat`;

function ChatbotAI() {
    const { t } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

    // Chat Sessions State
    const [chatSessions, setChatSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [renameInput, setRenameInput] = useState('');

    const chatContainerRef = useRef(null);
    const thinkingRef = useRef(null);
    const inputRef = useRef(null);

    // Load sessions on mount
    useEffect(() => {
        const saved = localStorage.getItem('ai_chat_sessions');
        if (saved) {
            try {
                setChatSessions(JSON.parse(saved));
            } catch (e) {
                console.error("Gagal memuat sesi chat", e);
            }
        }

        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Save sessions whenever they change
    useEffect(() => {
        localStorage.setItem('ai_chat_sessions', JSON.stringify(chatSessions));
    }, [chatSessions]);

    // Auto focus input ketika AI selesai menjawab
    useEffect(() => {
        if (!isGenerating && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isGenerating, currentSessionId]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight > 100) {
            setIsUserScrolledUp(true);
        } else {
            setIsUserScrolledUp(false);
        }
    };

    const scrollToBottom = () => {
        if (chatContainerRef.current && !isUserScrolledUp) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
        if (thinkingRef.current) {
            thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isGenerating]);

    const startNewChat = () => {
        if (isGenerating) return;
        setCurrentSessionId(null);
        setMessages([]);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const clearChat = () => {
        if (isGenerating) return;
        setMessages([]);
        if (currentSessionId) {
             setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s));
        }
    };

    const loadSession = (id) => {
        if (isGenerating) return;
        const session = chatSessions.find(s => s.id === id);
        if (session) {
            setCurrentSessionId(session.id);
            setMessages(session.messages);
        }
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const deleteSession = (e, id) => {
        e.stopPropagation();
        const newSessions = chatSessions.filter(s => s.id !== id);
        setChatSessions(newSessions);
        if (currentSessionId === id) {
            setCurrentSessionId(null);
            setMessages([]);
        }
    };

    const saveRename = (e, id) => {
        if (e) e.stopPropagation();
        if (renameInput.trim()) {
            setChatSessions(prev => prev.map(s => s.id === id ? { ...s, title: renameInput.trim(), updatedAt: Date.now() } : s));
        }
        setEditingSessionId(null);
    };

    const handleSend = async (customText = null) => {
        const userMsg = customText || input.trim();
        if (!userMsg) return;

        if (!customText) setInput('');
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);

        let sessionId = currentSessionId;
        if (!sessionId) {
            sessionId = Date.now().toString();
            setCurrentSessionId(sessionId);
            setChatSessions(prev => [{
                id: sessionId,
                title: userMsg.slice(0, 30) + (userMsg.length > 30 ? '...' : ''),
                updatedAt: Date.now(),
                messages: newMessages
            }, ...prev]);
        } else {
            setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: newMessages, updatedAt: Date.now() } : s));
        }

        setIsLoading(true);
        setIsGenerating(true);

        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: "smooth"
                });
            }
        }, 50);

        try {
            const response = await fetch(AI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: newMessages
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            setIsLoading(false);
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let botReply = '';
            let botThinking = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (buffer.trim()) {
                        try {
                            const parsed = JSON.parse(buffer);
                            if (parsed.thinking) botThinking += parsed.thinking;
                            if (parsed.message && parsed.message.content !== undefined) {
                                botReply += parsed.message.content;
                            } else if (parsed.response !== undefined) {
                                botReply += parsed.response;
                            }

                            const cleanReply = botReply.replace(/[*#`~]/g, '');
                            setMessages(prev => {
                                const msgs = [...prev];
                                msgs[msgs.length - 1] = {
                                    ...msgs[msgs.length - 1],
                                    content: cleanReply,
                                    thinking: botThinking
                                };
                                return msgs;
                            });
                        } catch (e) { }
                    }
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.thinking) botThinking += parsed.thinking;
                        if (parsed.message && parsed.message.content !== undefined) {
                            botReply += parsed.message.content;
                        } else if (parsed.response !== undefined) {
                            botReply += parsed.response;
                        }

                        const cleanReply = botReply.replace(/[*#`~]/g, '');
                        setMessages(prev => {
                            const msgs = [...prev];
                            msgs[msgs.length - 1] = {
                                ...msgs[msgs.length - 1],
                                content: cleanReply,
                                thinking: botThinking
                            };
                            return msgs;
                        });
                    } catch (e) {
                    }
                }
            }
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: t("Koneksi ke Ollama lokal gagal. Detail Error: ") + error.message + t(" | Pastikan Ollama menyala dan model sudah di-download.")
            }]);
        } finally {
            setIsGenerating(false);
            // Simpan state pesan terakhir (termasuk jawaban bot) ke sesi
            setMessages(currentMsgs => {
                setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: currentMsgs, updatedAt: Date.now() } : s));
                return currentMsgs;
            });
        }
    };

    return (
        <div className="flex flex-row h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative bg-white dark:bg-[#212121] rounded-xl shadow-sm border border-slate-200 dark:border-[#333] overflow-hidden">

            {/* Sidebar Konteks (ChatGPT-like) */}
            <div className={`border-slate-200 dark:border-[#333] bg-[#f9f9f9] dark:bg-[#171717] transition-all duration-500 absolute md:relative z-40 h-full overflow-hidden ${isSidebarOpen ? 'w-[260px] translate-x-0 border-r opacity-100' : 'w-0 -translate-x-full md:-translate-x-0 border-r-0 opacity-0'}`}>
                <div className="w-[260px] h-full flex flex-col">
                    <div className="p-3 shrink-0">
                        <button onClick={startNewChat} className="w-full flex items-center gap-2 justify-between py-2 px-3 bg-transparent hover:bg-slate-200 dark:hover:bg-[#2f2f2f] rounded-lg transition-colors text-sm font-medium text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-[#333] flex items-center justify-center shrink-0">
                                    <Sparkles size={14} />
                                </div>
                                <span className="whitespace-nowrap">{t("New chat")}</span>
                            </div>
                            <Plus size={16} className="text-slate-500 shrink-0" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 space-y-1 mt-2 pb-4" style={{ scrollbarWidth: 'thin' }}>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 mb-2 whitespace-nowrap">{t("Recent")}</div>
                        {chatSessions.length === 0 ? (
                            <div className="text-left text-xs text-slate-400 dark:text-slate-500 px-2 whitespace-nowrap">
                                {t("Belum ada riwayat.")}
                            </div>
                        ) : (
                            chatSessions.sort((a, b) => b.updatedAt - a.updatedAt).map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => loadSession(session.id)}
                                    className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-slate-200 dark:bg-[#2f2f2f] text-slate-800 dark:text-slate-200' : 'hover:bg-slate-200/60 dark:hover:bg-[#2a2a2a] text-slate-700 dark:text-slate-300'}`}
                                >
                                    {editingSessionId === session.id ? (
                                        <input
                                            type="text"
                                            autoFocus
                                            value={renameInput}
                                            onChange={(e) => setRenameInput(e.target.value)}
                                            onBlur={(e) => saveRename(e, session.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveRename(e, session.id);
                                                if (e.key === 'Escape') setEditingSessionId(null);
                                            }}
                                            className="flex-1 min-w-0 bg-white dark:bg-[#1a1a1a] border border-blue-500 rounded px-2 py-0.5 text-[13px] font-medium leading-tight outline-none"
                                        />
                                    ) : (
                                        <div className="flex-1 truncate text-[13px] font-medium leading-tight whitespace-nowrap">{session.title}</div>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === session.id ? null : session.id);
                                        }}
                                        className={`p-1 hover:text-slate-800 dark:hover:text-white rounded transition-all shrink-0 ${activeMenuId === session.id ? 'opacity-100 text-slate-800 dark:text-white' : 'opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500'}`}
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                    
                                    {activeMenuId === session.id && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                                            <div className="absolute right-2 top-8 z-50 w-32 bg-white dark:bg-[#2f2f2f] border border-slate-200 dark:border-[#444] rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100 py-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenameInput(session.title);
                                                        setEditingSessionId(session.id);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#3a3a3a] transition-colors"
                                                >
                                                    <Edit2 size={13} />
                                                    {t("Rename")}
                                                </button>
                                                <div className="h-[1px] bg-slate-100 dark:bg-[#3a3a3a] my-1"></div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteSession(e, session.id);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-[#3a3a3a] transition-colors"
                                                >
                                                    <Trash2 size={13} />
                                                    {t("Delete")}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#212121] relative">

                {/* Header */}
                <div className="px-4 py-3 flex justify-between items-center absolute top-0 left-0 right-0 z-10 bg-white/80 dark:bg-[#212121]/80 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2f2f2f] text-slate-500 dark:text-slate-400 transition-colors"
                            title={isSidebarOpen ? t("Tutup Sidebar") : t("Buka Sidebar")}
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            AI Support <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#2f2f2f] text-slate-500 dark:text-slate-400 text-xs font-semibold">Beta</span>
                        </h1>
                    </div>
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="p-1.5 md:px-3 md:py-1.5 flex items-center gap-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2f2f2f] text-slate-500 dark:text-slate-400 transition-colors text-sm font-medium"
                            title={t("Clear Chat")}
                        >
                            <Trash2 size={16} />
                            <span className="hidden md:inline">{t("Clear Chat")}</span>
                        </button>
                    )}
                </div>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && window.innerWidth < 768 && (
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
                )}

                {/* Messages List */}
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto overscroll-contain pt-16 pb-36 px-4 md:px-0 scroll-smooth"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto text-center mt-[-40px]">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-[#2f2f2f] rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 mb-6 shadow-sm border border-slate-200 dark:border-[#333]">
                                <Sparkles size={28} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-white mb-8">{t("How can I help you today?")}</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mx-auto px-4">
                                <button
                                    onClick={() => handleSend("Berapa banyak tiket dengan prioritas High minggu ini?")}
                                    className="flex flex-col items-start p-4 text-left border border-slate-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#212121] hover:bg-slate-50 dark:hover:bg-[#2f2f2f] transition-all group"
                                >
                                    <span className="font-semibold text-[14px] text-slate-700 dark:text-slate-300 mb-1">Prioritas High</span>
                                    <span className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2">Cek status tiket prioritas tertinggi saat ini.</span>
                                </button>
                                <button
                                    onClick={() => handleSend("Bantu saya membuat draft balasan ke user untuk tiket yang sudah selesai.")}
                                    className="flex flex-col items-start p-4 text-left border border-slate-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#212121] hover:bg-slate-50 dark:hover:bg-[#2f2f2f] transition-all group"
                                >
                                    <span className="font-semibold text-[14px] text-slate-700 dark:text-slate-300 mb-1">Draft Balasan</span>
                                    <span className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2">Bantu buatkan draft email untuk tiket selesai.</span>
                                </button>
                                <button
                                    onClick={() => handleSend("Apa saja masalah aplikasi yang paling sering dilaporkan belakangan ini?")}
                                    className="flex flex-col items-start p-4 text-left border border-slate-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#212121] hover:bg-slate-50 dark:hover:bg-[#2f2f2f] transition-all group"
                                >
                                    <span className="font-semibold text-[14px] text-slate-700 dark:text-slate-300 mb-1">Tren Masalah</span>
                                    <span className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2">Analisis masalah aplikasi yang sering muncul.</span>
                                </button>
                                <button
                                    onClick={() => handleSend("Buatkan evaluasi singkat mengenai performa penyelesaian tiket PIC.")}
                                    className="flex flex-col items-start p-4 text-left border border-slate-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#212121] hover:bg-slate-50 dark:hover:bg-[#2f2f2f] transition-all group"
                                >
                                    <span className="font-semibold text-[14px] text-slate-700 dark:text-slate-300 mb-1">Evaluasi PIC</span>
                                    <span className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2">Buat rangkuman singkat dari performa PIC.</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto flex flex-col gap-6 pt-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'user' ? (
                                        <div className="max-w-[75%] bg-slate-100 dark:bg-[#2f2f2f] text-slate-800 dark:text-slate-100 px-5 py-3 rounded-[24px] rounded-br-sm text-[15px] leading-relaxed whitespace-pre-wrap">
                                            {msg.content}
                                        </div>
                                    ) : (
                                        <div className="flex gap-4 w-full">
                                            <div className="w-8 h-8 shrink-0 rounded-full border border-slate-200 dark:border-[#333] flex items-center justify-center bg-white dark:bg-[#212121] text-slate-700 dark:text-slate-300 mt-1">
                                                <Sparkles size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200 pt-1">
                                                {msg.thinking && !msg.content && (
                                                    <div className="mb-2">
                                                        <div className="flex items-center gap-2 mb-2 font-medium text-slate-400 text-[13px]">
                                                            <Loader2 size={14} className="animate-spin" /> {t("Thinking...")}
                                                        </div>
                                                        <div
                                                            ref={thinkingRef}
                                                            className="text-[14px] text-slate-500 opacity-80 border-l-2 border-slate-200 dark:border-slate-700 pl-3 py-1 max-h-[150px] overflow-y-auto leading-relaxed"
                                                            style={{ scrollbarWidth: 'thin' }}
                                                        >
                                                            {msg.thinking.replace(/[*#`~]/g, '')}
                                                        </div>
                                                    </div>
                                                )}

                                                {msg.content ? (
                                                    <div className="prose prose-slate dark:prose-invert max-w-none text-[15px]">
                                                        {msg.content.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                                                    </div>
                                                ) : (
                                                    !msg.thinking && (
                                                        <div className="flex gap-1 items-center h-6">
                                                            <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                                                            <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                                            <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && !isGenerating && (
                                <div className="flex justify-start w-full">
                                    <div className="flex gap-4 w-full">
                                        <div className="w-8 h-8 shrink-0 rounded-full border border-slate-200 dark:border-[#333] flex items-center justify-center bg-white dark:bg-[#212121] text-slate-700 dark:text-slate-300 mt-1">
                                            <Sparkles size={16} />
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 pt-1 text-slate-500">
                                            <Loader2 size={16} className="animate-spin" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:pb-6 bg-gradient-to-t from-white via-white to-transparent dark:from-[#212121] dark:via-[#212121] dark:to-transparent pt-10">
                    <div className="max-w-3xl mx-auto relative group">
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-end w-full bg-slate-50 dark:bg-[#2f2f2f] rounded-2xl md:rounded-[24px] border border-slate-200/80 dark:border-[#333] shadow-sm focus-within:shadow-md focus-within:border-slate-300 dark:focus-within:border-slate-500 transition-all p-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isGenerating}
                                placeholder={isGenerating ? t("AI sedang mengetik...") : t("Message AI Support...")}
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 pl-4 py-3 md:py-4 text-[15px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={isGenerating || !input.trim()}
                                className="m-2 shrink-0 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black rounded-full transition-all disabled:opacity-30 disabled:bg-slate-800 dark:disabled:bg-white"
                            >
                                <Send size={16} className={input.trim() ? "translate-x-[-1px] translate-y-[1px]" : ""} />
                            </button>
                        </form>
                        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
                            {t("AI can make mistakes. Consider verifying important information.")}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ChatbotAI;
