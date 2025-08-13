const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({ 
        message: 'Test server is running!',
        port: PORT,
        env: process.env.NODE_ENV,
        time: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on port ${PORT}`);
});