const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/tickets/1/comments', {
            comment_text: 'Solusi :\ntest resolution',
            created_by: 'IT Support'
        });
        console.log(res.data);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
test();
