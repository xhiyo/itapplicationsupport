import { analyzeTicket, extractTextFromImage, checkOllamaStatus } from './services/ai.js';

async function test() {
    console.log("Checking Ollama Status...");
    const status = await checkOllamaStatus();
    console.log("Status:", status);

    if (status) {
        console.log("Testing analyzeTicket...");
        try {
            const res = await analyzeTicket('Test Tiket', 'Ini adalah deskripsi tiket error.');
            console.log("Result:", res);
        } catch (err) {
            console.error("Analyze Error:", err.message);
        }
    } else {
        console.log("Skipping analyze since Ollama is down.");
    }
}

test();
