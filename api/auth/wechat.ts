import type { VercelRequest, VercelResponse } from '@vercel/node';

// 微信公众号 OAuth2 登录 API
// 文档: https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html

const WX_APP_ID = process.env.WX_APP_ID || 'wx26662b2da289ec99';
const WX_APP_SECRET = process.env.WX_APP_SECRET || 'c4fa073eec2a953b408325685db41c92';

interface WxResponse {
  errcode?: number;
  errmsg?: string;
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  openid?: string;
  scope?: string;
  unionid?: string;
}

interface WxUserInfo {
  errcode?: number;
  errmsg?: string;
  openid?: string;
  nickname?: string;
  sex?: number;
  province?: string;
  city?: string;
  country?: string;
  headimgurl?: string;
  privilege?: string[];
  unionid?: string;
}

// 通过 code 获取 Access Token
async function getAccessToken(code: string): Promise<WxResponse | null> {
  try {
    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WX_APP_ID}&secret=${WX_APP_SECRET}&code=${code}&grant_type=authorization_code`;
    const response = await fetch(url);
    const data: WxResponse = await response.json();

    if (data.errcode) {
      console.error('Failed to get access token:', data);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// 通过 Access Token 获取用户信息
async function getUserInfo(accessToken: string, openId: string): Promise<WxUserInfo | null> {
  try {
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}&lang=zh_CN`;
    const response = await fetch(url);
    const data: WxUserInfo = await response.json();

    if (data.errcode) {
      console.error('Failed to get user info:', data);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { code, state } = req.query;

  // 验证 state 参数
  if (state !== 'wechat_sso') {
    return res.status(400).json({ success: false, message: 'Invalid state parameter' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing code parameter' });
  }

  try {
    // 通过 code 获取 Access Token
    const tokenData = await getAccessToken(code);
    if (!tokenData || !tokenData.access_token || !tokenData.openid) {
      return res.status(401).json({ success: false, message: 'Failed to get access token' });
    }

    // 通过 Access Token 获取用户信息
    const userInfo = await getUserInfo(tokenData.access_token, tokenData.openid);
    if (!userInfo) {
      return res.status(401).json({ success: false, message: 'Failed to get user info' });
    }

    // 返回用户信息给前端
    return res.status(200).json({
      success: true,
      user: {
        openid: userInfo.openid,
        unionid: userInfo.unionid,
        nickname: userInfo.nickname,
        sex: userInfo.sex,
        province: userInfo.province,
        city: userInfo.city,
        country: userInfo.country,
        headimgurl: userInfo.headimgurl,
      },
    });
  } catch (error) {
    console.error('WeChat auth error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
