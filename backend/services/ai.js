import axios from "axios";
import Tesseract from "tesseract.js";

const OLLAMA_URL =
    process.env.OLLAMA_URL || "http://localhost:11434/api/generate";

const MODEL_NAME =
    process.env.OLLAMA_MODEL || "qwen2.5:3b";

const ollamaClient = axios.create({
    baseURL: "http://localhost:11434",
    timeout: 120000,
    headers: {
        "Content-Type": "application/json",
    },
});

const callOllama = async (
    prompt,
    {
        numPredict = 300,
        temperature = 0.2,
        numCtx = 2048,
    } = {}
) => {
    const response = await ollamaClient.post("/api/generate", {
        model: MODEL_NAME,
        prompt,
        stream: false,

        // Menahan model di memori agar request berikutnya lebih cepat
        keep_alive: "10m",

        options: {
            num_ctx: numCtx,
            num_predict: numPredict,
            temperature,
            top_p: 0.9,
            repeat_penalty: 1.1,
        },
    });

    const result = response.data?.response?.trim();

    if (!result) {
        throw new Error("Ollama tidak mengembalikan respons yang valid.");
    }

    return result;
};

export const analyzeTicket = async (
    title,
    description,
    userMessage = ""
) => {
    try {
        const cleanTitle = title?.trim() || "Tanpa judul";
        const cleanDescription =
            description?.trim() || "Tidak ada deskripsi.";

        let instruction;

        if (userMessage?.trim()) {
            instruction = `
Jawab pesan pengguna secara langsung.
Berikan solusi singkat, jelas, dan dapat langsung dicoba.
Jangan mengulang seluruh isi tiket.
Pesan pengguna: ${userMessage.trim()}
`;
        } else {
            instruction = `
Berikan jawaban dengan format berikut:

Ringkasan:
Satu atau dua kalimat.

Kategori:
Pilih kategori IT yang paling sesuai.

Langkah penyelesaian:
Berikan maksimal lima langkah yang dapat langsung dicoba.
`;
        }

        const currentDateTime = new Date().toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
        const prompt = `
Anda adalah asisten internal IT Application Support.
Waktu saat ini: ${currentDateTime}

Judul tiket:
${cleanTitle}

Deskripsi masalah:
${cleanDescription}

${instruction}

Aturan:
- Gunakan bahasa Indonesia.
- Jawaban harus ringkas dan profesional.
- Jangan membuat informasi yang tidak tersedia.
- Jangan memberikan lebih dari lima langkah.
`.trim();

        return await callOllama(prompt, {
            numPredict: userMessage ? 220 : 300,
            temperature: 0.2,
            numCtx: 2048,
        });
    } catch (error) {
        console.error(
            "Error analyzing ticket with Ollama:",
            error.response?.data || error.message
        );

        throw new Error(
            "AI gagal menganalisis tiket. Pastikan Ollama sedang berjalan."
        );
    }
};

export const correctOCRText = async (rawText) => {
    if (!rawText?.trim()) {
        return "";
    }

    try {
        const prompt = `
Bersihkan hasil OCR berikut.

Aturan:
- Hapus simbol atau teks sampah.
- Perbaiki kesalahan ejaan yang jelas.
- Pertahankan arti asli.
- Jangan menambahkan informasi baru.
- Kembalikan hanya teks yang sudah dibersihkan.

Teks OCR:
${rawText.trim()}
`.trim();

        return await callOllama(prompt, {
            numPredict: 200,
            temperature: 0,
            numCtx: 2048,
        });
    } catch (error) {
        console.error(
            "Error correcting OCR with Ollama:",
            error.response?.data || error.message
        );

        return rawText.trim();
    }
};

export const extractTextFromImage = async (base64Image) => {
    try {
        if (!base64Image) {
            throw new Error("Gambar tidak tersedia.");
        }

        // Menghapus prefix data URL jika dikirim dari frontend
        const normalizedBase64 = base64Image.replace(
            /^data:image\/\w+;base64,/,
            ""
        );

        const buffer = Buffer.from(normalizedBase64, "base64");

        const {
            data: { text },
        } = await Tesseract.recognize(buffer, "ind+eng", {
            logger: (progress) => {
                if (progress.status === "recognizing text") {
                    console.log(
                        `OCR progress: ${Math.round(progress.progress * 100)}%`
                    );
                }
            },
        });

        return text.trim();
    } catch (error) {
        console.error(
            "Error extracting text with Tesseract:",
            error.message
        );

        throw new Error("Gagal membaca teks dari gambar.");
    }
};

export const checkOllamaStatus = async () => {
    try {
        await ollamaClient.get("/api/tags", {
            timeout: 5000,
        });

        return true;
    } catch (error) {
        console.error("Ollama tidak berjalan atau tidak dapat diakses.");
        return false;
    }
};
