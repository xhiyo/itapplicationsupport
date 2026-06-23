const axios = require('axios');
async function test() {
    const res = await axios.get('https://html.duckduckgo.com/html/?q=' + encodeURIComponent('siapa presiden amerika 2026'), {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    console.log(res.data);
}
test();
