export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: '请输入文字描述' });
    }

    console.log('生成图片，prompt:', prompt);

    // 使用 Pollinations AI（免费，不需要 API Key！）
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true`;

    console.log('图片URL:', imageUrl);

    res.status(200).json({ 
      success: true, 
      imageUrl: imageUrl,
      prompt: prompt
    });
    
  } catch (error) {
    console.error('错误:', error);
    res.status(500).json({ error: '生成失败: ' + error.message });
  }
}