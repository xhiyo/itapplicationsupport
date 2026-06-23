const axios = require('axios');
async function test() {
    try {
        const response = await axios.get('https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent('siapa presiden amerika saat ini 2026') + '&utf8=&format=json', {
            headers: { 'User-Agent': 'ITSupportBot/1.0 (internal tool; it@gramedia.com)' }
        });
        if (response.data && response.data.query && response.data.query.search) {
            const snippets = response.data.query.search.slice(0, 3).map(item => {
                let clean = item.snippet.replace(/<\/?[^>]+(>|$)/g, "");
                return item.title + ': ' + clean;
            });
            console.log(snippets.join('\n\n'));
        }
    } catch(e) { console.error(e.response ? e.response.data : e.message); }
}
test();
