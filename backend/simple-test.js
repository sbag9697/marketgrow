// 간단한 테스트 서버
const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = 5003;
app.listen(PORT, () => {
    console.log(`Simple test server on port ${PORT}`);
});