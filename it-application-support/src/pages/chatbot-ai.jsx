import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Loader2, Sparkles, Database, User, Activity } from 'lucide-react';
const AI_URL = 'http://localhost:5000/api/ai/chat';

function ChatbotAI() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
    // Context and DB fetching are now handled entirely by the Backend RAG.

    const chatContainerRef = useRef(null);
    const thinkingRef = useRef(null);
    const inputRef = useRef(null);

    // Auto focus input ketika AI selesai menjawab
    useEffect(() => {
        if (!isGenerating && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [isGenerating]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Jika user scroll ke atas lebih dari 100px dari bawah, anggap user sedang membaca ke atas
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
        
        // Auto-scroll juga div thinking block jika ada
        if (thinkingRef.current) {
            thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isGenerating]);

    const handleSend = async (customText = null) => {
        const userMsg = customText || input.trim();
        if (!userMsg) return;

        if (!customText) setInput('');
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);
        setIsGenerating(true);

        // Force scroll to bottom immediately when sending a new message
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

            setIsLoading(false); // Hilangkan bubble loading "Menganalisis..."
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]); // Munculkan bubble kosong

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
                            if (parsed.response !== undefined) botReply += parsed.response;

                            const cleanReply = botReply.replace(/[*#`~]/g, '');
                            setMessages(prev => {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1] = {
                                        ...newMessages[newMessages.length - 1],
                                        content: cleanReply,
                                        thinking: botThinking
                                    };
                                    return newMessages;
                                });
                        } catch(e) {}
                    }
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // Keep the last incomplete line in the buffer
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.thinking) botThinking += parsed.thinking;
                        if (parsed.response !== undefined) botReply += parsed.response;

                        const cleanReply = botReply.replace(/[*#`~]/g, '');
                        setMessages(prev => {
                                const newMessages = [...prev];
                                newMessages[newMessages.length - 1] = {
                                    ...newMessages[newMessages.length - 1],
                                    content: cleanReply,
                                    thinking: botThinking
                                };
                                return newMessages;
                            });
                    } catch (e) {
                        // Ignore parse error from incomplete JSON chunks
                    }
                }
            }
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Koneksi ke Ollama lokal gagal. Pastikan Ollama menyala dan model sudah di-download.`
            }]);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-700 relative bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">

            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Application Support Intelligence</h1>

                </div>
            </div>

            {/* Chat Area */}
            <div 
                ref={chatContainerRef} 
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overscroll-contain p-8 scroll-smooth"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-8 mt-10">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <Bot size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-700 dark:text-white">Ada yang bisa dibantu hari ini?</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full opacity-0 pointer-events-none absolute h-0">
                            {/* Hidden buttons */}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-8 pb-10">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} w-full`}>
                                <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                                </div>
                                <div className={`max-w-[80%] min-w-0 break-words rounded-3xl p-5 text-[15px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm'
                                    }`}>
                                    {/* Thinking Block */}
                                    {msg.thinking && !msg.content && (
                                        <div className="mb-2 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                                            <div className="flex items-center gap-2 mb-2 font-medium text-slate-400 dark:text-slate-500 text-[12px]">
                                                <span className="animate-pulse">🤔</span> Sedang mencari jawaban...
                                            </div>
                                            <div 
                                                ref={thinkingRef}
                                                className="text-[12px] text-slate-400 dark:text-slate-500 opacity-60 blur-[0.5px] hover:blur-none hover:opacity-100 transition-all duration-300 max-h-[100px] overflow-y-auto pr-2 leading-relaxed whitespace-pre-wrap"
                                                style={{ scrollbarWidth: 'thin' }}
                                            >
                                                {msg.thinking.replace(/[*#`~]/g, '')}
                                            </div>
                                        </div>
                                    )}

                                    {/* Final Content or Loader */}
                                    {msg.content ? (
                                        msg.content
                                    ) : (
                                        !msg.thinking && (
                                            <div className="flex gap-1.5 items-center h-6 px-1">
                                                <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                                <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4 flex-row">
                                <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    <Bot size={20} />
                                </div>
                                <div className="max-w-[80%] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl rounded-tl-sm p-5 text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                    <Loader2 size={18} className="animate-spin text-violet-600 dark:text-violet-400" />
                                    <span>Menganalisis data...</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                <div className="max-w-4xl mx-auto relative group">
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isGenerating}
                            placeholder={isGenerating ? "AI sedang mengetik..." : "Ketik pertanyaan Anda tentang operasional IT di sini..."}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-6 pr-16 py-4 text-[15px] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-300 dark:focus:border-violet-600 focus:ring-4 focus:ring-violet-100/50 dark:focus:ring-violet-900/30 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <button
                            type="submit"
                            disabled={isGenerating || !input.trim()}
                            className="absolute right-2 w-10 h-10 flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white rounded-full transition-all disabled:opacity-50 disabled:hover:bg-violet-600"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
                        AI dapat memberikan jawaban yang kurang tepat. Selalu verifikasi data langsung di tabel.
                    </p>
                </div>
            </div>

        </div>
    );
}

export default ChatbotAI;
