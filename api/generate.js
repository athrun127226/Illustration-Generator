export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prompt = req.body?.prompt;
    
    if (!prompt) {
      return res.status(400).json({ error: '请输入文字描述' });
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    
    if (!replicateToken) {
      throw new Error('缺少 Replicate API Token');
    }

    // 使用正确的模型版本
    const requestBody = {
      version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4',
      input: {
prompt: prompt
}
};
const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${replicateToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody)
});
const responseData = await createResponse.json();
if (!createResponse.ok) {
  throw new Error(`Replicate API 错误：${responseData.detail || '未知错误'}`);
}
const predictionUrl = responseData.urls?.get;
// 轮询等待结果
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
  const pollData = await pollResponse.json();
  if (pollData.status === 'succeeded') {
    imageUrl = pollData.output;
    if (Array.isArray(imageUrl)) {
      imageUrl = imageUrl[0];
    }
  } else if (pollData.status === 'failed') {
    throw new Error('图片生成失败');
  }
  attempts++;
}
if (!imageUrl) {
  throw new Error('生成超时');
}
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