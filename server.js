const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: '请输入文字描述' });
        }
        const mockImageUrl = 'https://picsum.photos/800/600?random=' + Date.now();
        res.json({ success: true, imageUrl: mockImageUrl, prompt: prompt });
    } catch (error) {
        console.error('生成失败:', error);
        res.status(500).json({ error: '生成失败：' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🎨 插图生成器运行在 http://localhost:${PORT}`);
});