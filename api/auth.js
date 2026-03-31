export default async function handler(req, res) {
  const { code } = req.query;
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`;
  
  // 飞书多维表格配置
  const BITABLE_TOKEN = 'BJbLbwCkga9SFMsqiscc0Bxfnrc';
  const TABLE_ID = 'tbls8IB1yczVlpjd';
  const BITABLE_APP_ID = process.env.FEISHU_APP_ID;
  const BITABLE_APP_SECRET = process.env.FEISHU_APP_SECRET;
  
  // 获取飞书 access_token
  async function getFeishuToken() {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: BITABLE_APP_ID,
        app_secret: BITABLE_APP_SECRET
      })
    });
    const data = await response.json();
    return data.tenant_access_token;
  }
  
  // 查找或创建用户
  async function upsertUser(userInfo, token) {
    // 先查询用户是否存在
    const searchResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${TABLE_ID}/records`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const searchData = await searchResponse.json();
    
    // 检查用户是否已存在
    const existingUser = searchData.data?.items?.find(item => 
      item.fields.user_id === userInfo.sub || item.fields.email === userInfo.email
    );
    
    if (existingUser) {
      // 更新用户信息
      await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${TABLE_ID}/records/${existingUser.record_id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            name: userInfo.name,
            picture: userInfo.picture,
            email: userInfo.email
          }
        })
      });
      return existingUser.record_id;
    } else {
      // 创建新用户
      const createResponse = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_TOKEN}/tables/${TABLE_ID}/records`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            user_id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture
          }
        })
      });
      const createData = await createResponse.json();
      return createData.data?.record_id;
    }
  }
  
  if (req.method === 'GET' && code) {
    try {
      // 1. 用 code 换取 token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      
      const tokens = await tokenResponse.json();
      
      // 2. 获取用户信息
      const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?alt=json`, {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      
      const userInfo = await userResponse.json();
      
      // 3. 同步用户到飞书多维表格
      let feishuToken;
      try {
        feishuToken = await getFeishuToken();
        await upsertUser(userInfo, feishuToken);
      } catch (e) {
        console.log('飞书同步失败:', e.message);
      }
      
      // 4. 返回给前端
res.status(200).json({
success: true,
tokens,
user: {
id: userInfo.sub,
email: userInfo.email,
name: userInfo.name,
picture: userInfo.picture
}
});
} catch (error) {
res.status(500).json({ error: error.message });
}
} else if (req.method === 'GET') {
// 生成授权 URL
const authUrl = https://accounts.google.com/o/oauth2/v2/auth? +
new URLSearchParams({
client_id: clientId,
redirect_uri: redirectUri,
response_type: 'code',
scope: 'openid email profile',
access_type: 'offline'
});
res.redirect(authUrl);
} else {
res.status(405).json({ error: 'Method not allowed' });
}
}
