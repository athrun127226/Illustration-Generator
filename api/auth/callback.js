export default async function handler(req, res) {
  const { code } = req.query;
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback`;
  
  if (req.method === 'GET' && code) {
    try {
      // 用 code 换取 token
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
      
      // 获取用户信息
      const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?alt=json`, {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      
      const userInfo = await userResponse.json();
      
      res.status(200).json({ 
        success: true, 
        tokens, 
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    // 生成授权 URL - 修复 scope
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        access_type: 'offline'
      });
    
    res.redirect(authUrl);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}