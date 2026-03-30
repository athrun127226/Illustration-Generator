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

    // 从环境变量获取 Replicate API Token
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateToken) {
      throw new Error('缺少 Replicate API Token，请在 Vercel 环境变量中配置');
    }

    console.log('开始生成图片，提示词:', prompt);

    // 第 1 步：创建预测任务
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
        input: {
          prompt: prompt,
          width: 768,
          height: 768,
          num_inference_steps: 50,
          guidance_scale: 7.5,
        }
      })
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Replicate API 错误：${errorData.detail || '未知错误'}`);
    }

    const createData = await createResponse.json();
    const predictionUrl = createData.urls.get;

    console.log('预测任务已创建，等待结果...');

    // 第 2 步：轮询等待结果
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts && !imageUrl) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const pollResponse = await fetch(predictionUrl, {
        headers: {
          'Authorization': `Token ${replicateToken}`,
        }
      });

      if (!pollResponse.ok) {
        throw new Error('轮询结果失败');
      }

      const pollData = await pollResponse.json();

      if (pollData.status === 'succeeded') {
        imageUrl = pollData.output?.[0];
        console.log('图片生成成功！');
      } else if (pollData.status === 'failed' || pollData.status === 'canceled') {
        throw new Error('图片生成失败');
      }

      attempts++;
      console.log(`等待中... (${attempts}/${maxAttempts})`);
    }

    if (!imageUrl) {
      throw new Error('生成超时，请稍后重试');
    }

    // 返回生成的图片 URL
    res.status(200).json({ 
      success: true, 
      imageUrl: imageUrl,
      prompt: prompt
    });
    
  } catch (error) {
    console.error('生成失败:', error);
    res.status(500).json({ error: '生成失败：' + error.message });
 }
}