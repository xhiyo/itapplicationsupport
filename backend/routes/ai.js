import express from 'express';
import { poolPromise } from '../db.js';
import axios from 'axios';

const router = express.Router();
const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

async function fetchWebSearch(query) {
    try {
        const keywords = query.replace(/(siapa|apa|bagaimana|kapan|dimana|saat|ini|sekarang|itu|yang|dan|atau|ke|dari|untuk|terbaru)/gi, "").trim();
        const response = await axios.get(`https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keywords)}&utf8=&format=json`, {
            headers: { 'User-Agent': 'ITSupportBot/1.0 (internal tool; it@gramedia.com)' },
            timeout: 5000 
        });
        if (response.data && response.data.query && response.data.query.search) {
            const snippets = response.data.query.search.slice(0, 3).map(item => {
                let clean = item.snippet.replace(/<\/?[^>]+(>|$)/g, "");
                return `${item.title}: ${clean}`;
            });
            return snippets.join('\n\n');
        }
        return "";
    } catch(e) {
        console.error("Web search failed", e.message);
        return "";
    }
}

router.post('/chat', async (req, res) => {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
    }

    // Ambil pesan terakhir dari user untuk dianalisis
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userMsg = lastUserMessage ? lastUserMessage.content.toLowerCase() : "";

    try {
        let query = "";
        let contextData = [];
        const currentDateTime = new Date().toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
        let systemPrompt = `Anda adalah Asisten IT Support yang sangat membantu dan profesional. Saat ini adalah ${currentDateTime}.\n`;
        
        // 0. NORMALIZE USER MESSAGE (Kamus Singkatan Gaul/Chat)
        const slangMap = {
            'sp': 'siapa', 'yg': 'yang', 'knp': 'kenapa', 'gmn': 'bagaimana', 'dmn': 'dimana',
            'kpn': 'kapan', 'bgt': 'banget', 'aja': 'saja', 'tp': 'tapi', 'klo': 'kalau',
            'kalo': 'kalau', 'sy': 'saya', 'km': 'kamu', 'gak': 'tidak', 'ga': 'tidak', 
            'jd': 'jadi', 'dr': 'dari', 'drpd': 'daripada', 'blm': 'belum', 'udah': 'sudah',
            'dpt': 'dapat', 'utk': 'untuk', 'ttg': 'tentang', 'bs': 'bisa', 'krn': 'karena'
        };
        
        let normalizedUserMsg = userMsg.split(/\s+/).map(word => {
            const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
            return slangMap[cleanWord] ? slangMap[cleanWord] : word;
        }).join(' ');

        // 1. INTENT ANALYSIS & DATABASE QUERY
        const isItQuery = /tiket|kendala|status|pic|error|bantu|printer|jaringan|sap|aplikasi|sistem|berapa|jumlah|total/i.test(normalizedUserMsg);

        if (isItQuery) {
            const pool = await poolPromise;
            
            // Apakah user menanyakan jumlah/berapa?
            if (normalizedUserMsg.includes('berapa') || normalizedUserMsg.includes('jumlah') || normalizedUserMsg.includes('total')) {
                let statusFilter = "Semua";
                if (normalizedUserMsg.includes('open') || normalizedUserMsg.includes('to do') || normalizedUserMsg.includes('baru')) {
                    query = "SELECT COUNT(*) as total FROM Tickets WHERE status = 'To Do'";
                    statusFilter = "Open/To Do";
                } else if (normalizedUserMsg.includes('in progress') || normalizedUserMsg.includes('proses')) {
                    query = "SELECT COUNT(*) as total FROM Tickets WHERE status = 'In Progress'";
                    statusFilter = "In Progress";
                } else if (normalizedUserMsg.includes('selesai') || normalizedUserMsg.includes('done') || normalizedUserMsg.includes('sudah')) {
                    query = "SELECT COUNT(*) as total FROM Tickets WHERE status = 'Done'";
                    statusFilter = "Selesai/Done";
                } else {
                    query = "SELECT COUNT(*) as total FROM Tickets";
                }

                try {
                    const result = await pool.request().query(query);
                    const total = result.recordset[0].total;
                    systemPrompt += `\n[INFORMASI STATISTIK TIKET]\nBerdasarkan database, saat ini terdapat ${total} tiket dengan status ${statusFilter}.\n\n`;
                } catch (dbErr) {
                    console.error("DB Count Error:", dbErr);
                }
            }
            
            // Pencarian tiket berdasarkan keyword atau status
                let conditions = [];
                if (normalizedUserMsg.includes('open') || normalizedUserMsg.includes('to do') || normalizedUserMsg.includes('baru')) conditions.push("status = 'To Do'");
                if (normalizedUserMsg.includes('selesai') || normalizedUserMsg.includes('done') || normalizedUserMsg.includes('sudah')) conditions.push("status = 'Done'");
                if (normalizedUserMsg.includes('in progress') || normalizedUserMsg.includes('proses')) conditions.push("status = 'In Progress'");
                
                const keywords = ['printer', 'login', 'jaringan', 'aplikasi', 'error', 'sap', 'wifi', 'hardware', 'software'];
                let keywordConditions = [];
                for (const kw of keywords) {
                    if (normalizedUserMsg.includes(kw)) {
                        keywordConditions.push(`(LOWER(title) LIKE '%${kw}%' OR LOWER(description) LIKE '%${kw}%')`);
                    }
                }
                
                let allConditions = [];
                if (conditions.length > 0) allConditions.push(`(${conditions.join(' OR ')})`);
                if (keywordConditions.length > 0) allConditions.push(`(${keywordConditions.join(' OR ')})`);
                
                let whereClause = allConditions.length > 0 ? `WHERE ${allConditions.join(' AND ')}` : "";
                
                // Jika tidak ada kriteria sama sekali, tapi nanya tiket, ambil 5 tiket aktif terbaru
                if (!whereClause && (normalizedUserMsg.includes('tiket') || normalizedUserMsg.includes('kendala'))) {
                    whereClause = "WHERE status != 'Done' AND status != 'Closed'";
                }

                query = `
                    SELECT TOP 5 
                        title, 
                        description,
                        status, 
                        priority, 
                        category,
                        'User' as Requester,
                        'Tim IT' as PIC,
                        created_at,
                        updated_at
                    FROM Tickets 
                    ${whereClause} 
                    ORDER BY created_at DESC
                `;

            // Eksekusi Query ke Database Tiket
            if (query) {
                try {
                    const result = await pool.request().query(query);
                    contextData = result.recordset;
                } catch (dbErr) {
                    console.error("DB Query Error:", dbErr);
                }
            }

            // Eksekusi Query ke Knowledge Base
            let kbData = [];
            try {
                let kbWhereClause = "";
                const kbKeywords = normalizedUserMsg.split(/\s+/).filter(w => w.length >= 3);
                if (kbKeywords.length > 0) {
                    let kbConditions = kbKeywords.map(kw => `(LOWER(title) LIKE '%${kw}%' OR LOWER(content) LIKE '%${kw}%')`);
                    kbWhereClause = `WHERE ${kbConditions.join(' OR ')}`;
                }
                const kbQuery = `
                    SELECT TOP 3 
                        title, 
                        content, 
                        category 
                    FROM KnowledgeBase
                    ${kbWhereClause}
                    ORDER BY updated_at DESC
                `;
                const kbResult = await pool.request().query(kbQuery);
                kbData = kbResult.recordset;
            } catch (kbErr) {
                console.error("KB Query Error:", kbErr);
            }

            // Susun prompt dengan hasil database
            systemPrompt += `\n[DATA DATABASE TIKET IT SUPPORT]\n`;
            if (contextData.length > 0) {
                systemPrompt += `${JSON.stringify(contextData, null, 2)}\n\n`;
            } else {
                systemPrompt += `Tidak ada data tiket.\n\n`;
            }

            systemPrompt += `\n[DATA KNOWLEDGE BASE (SOLUSI/PANDUAN)]\n`;
            if (kbData.length > 0) {
                systemPrompt += `${JSON.stringify(kbData, null, 2)}\n\n`;
            } else {
                systemPrompt += `Tidak ada panduan dari Knowledge Base yang cocok.\n\n`;
            }

            systemPrompt += `Gunakan Data Tiket dan Data Knowledge Base di atas untuk menjawab. Jawablah seakurat mungkin sesuai dengan data. Jangan mengarang.\nPENTING: Jangan pernah menampilkan atau menyebutkan ID tiket. Sebutkan judul tiketnya saja secara langsung.\n`;
        } else {
            // WEB SEARCH FALLBACK (Pertanyaan Umum)
            systemPrompt = `Anda adalah Asisten AI canggih. Saat ini adalah ${currentDateTime}. Jawab pertanyaan pengguna secara akurat dan informatif. Jika ada referensi pencarian web di bawah, gunakan sebagai acuan.\n`;
            const searchResults = await fetchWebSearch(normalizedUserMsg);
            if (searchResults) {
                systemPrompt += `\n[HASIL PENCARIAN WEB TERBARU]\n${searchResults}\n\nJawab pertanyaan berdasarkan info dari internet ini (berbahasa Indonesia).`;
            } else {
                systemPrompt += `\nJawablah dengan pengetahuan umum Anda dalam bahasa Indonesia.`;
            }
        }

        // 2. CONSTRUCT FINAL PROMPT UNTUK OLLAMA
        let finalPrompt = `${systemPrompt}\n`;
        
        messages.forEach(m => {
            finalPrompt += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}\n`;
        });
        
        // Pastikan input terakhir ke Ollama adalah input yang sudah dinormalisasi (supaya Ollama juga ngerti singkatan)
        finalPrompt += `User: ${normalizedUserMsg}\nAssistant:`;

        // 3. PROXY STREAM DARI OLLAMA KE FRONTEND
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        
        try {
            const ollamaResponse = await axios({
                method: 'post',
                url: OLLAMA_URL,
                data: {
                    model: MODEL_NAME,
                    prompt: finalPrompt,
                    stream: true
                },
                responseType: 'stream',
                timeout: 60000 // 60 seconds timeout to prevent hanging forever
            });

            // Alirkan chunk demi chunk agar tidak menunggu selesai
            ollamaResponse.data.on('data', (chunk) => {
                res.write(chunk);
            });

            ollamaResponse.data.on('end', () => {
                res.end();
            });
            
            ollamaResponse.data.on('error', (err) => {
                console.error("Ollama stream error:", err);
                res.end();
            });

        } catch (ollamaErr) {
            console.error("Error calling Ollama:", ollamaErr.message);
            // Headers already sent, so we must write a JSON response directly
            res.write(JSON.stringify({ 
                response: "\n\n**[Error]** Gagal terhubung ke AI (Ollama). Pastikan Ollama berjalan dan model tersedia.", 
                done: true 
            }) + '\n');
            res.end();
        }

    } catch (err) {
        console.error("AI Chat Route Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
