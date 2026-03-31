import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/callback`
);

export default async function handler(req, res) {
  const { code } = req.query;
  
  if (req.method === 'GET' && code) {
    try {
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);
      const userInfo = await client.getTokenInfo(tokens.access_token);
      
      res.status(200).json({ 
        success: true, 
        tokens, 
        user: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'GET') {
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
    });
    res.redirect(authUrl);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}