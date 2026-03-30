export default async function handler(req, res) {
  // 只处理 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: '请输入文字描述' });
    }

    // TODO: 这里调用真正的 AI 绘图 API
    // 目前返回一个随机示例图片
    const mockImageUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
    
    res.status(200).json({ 
      success: true, 
      imageUrl: mockImageUrl,
      prompt: prompt
    });
    
  } catch (error) {
    console.error('生成失败:', error);
    res.status(500).json({ error: '生成失败：' + error.message });
  }
}