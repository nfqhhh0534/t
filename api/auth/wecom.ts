import type { VercelRequest, VercelResponse } from '@vercel/node';

// 企业微信 OAuth2 自建应用认证 API
// 文档: https://developer.work.weixin.qq.com/document/path/91022

const WECOM_CORP_ID = process.env.WECOM_CORP_ID || 'wx21bbb81b5b1b8a95';
const WECOM_SECRET = process.env.WECOM_SECRET || 'siA81Dn2iJskaxNbcSdjnmSPXY2FfIOvxLVuVRZjzVU';

interface WeComResponse {
  errcode: number;
  errmsg: string;
  access_token?: string;
  expires_in?: number;
  userid?: string;
  name?: string;
  department?: (string | number)[];
  position?: string;
  mobile?: string;
  email?: string;
  avatar?: string;
  thumb_avatar?: string;
  is_star_user?: number;
  status?: number;
}

// 获取 Access Token (自建应用方式)
async function getAccessToken(): Promise<string | null> {
  try {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${WECOM_CORP_ID}&corpsecret=${WECOM_SECRET}`;
    const response = await fetch(url);
    const data: WeComResponse = await response.json();

    if (data.errcode === 0 && data.access_token) {
      return data.access_token;
    }
    console.error('Failed to get access token:', data);
    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

// 通过 OAuth2 code 获取用户信息 (自建应用方式)
async function getUserInfoByOAuthCode(code: string, accessToken: string): Promise<WeComUserInfo | null> {
  try {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=${accessToken}&code=${code}`;
    const response = await fetch(url);
    const data: WeComResponse & { userid?: string; DeviceId?: string } = await response.json();

    if (data.errcode === 0 && data.userid) {
      // 获取用户详情
      return await getUserDetailByUserId(data.userid, accessToken);
    }
    console.error('Failed to get user info by code:', data);
    return null;
  } catch (error) {
    console.error('Error getting user info by code:', error);
    return null;
  }
}

// 通过 userid 获取用户详情
async function getUserDetailByUserId(userId: string, accessToken: string): Promise<WeComUserInfo | null> {
  try {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/user/get?access_token=${accessToken}&userid=${userId}`;
    const response = await fetch(url);
    const data: WeComResponse = await response.json();

    if (data.errcode === 0) {
      return {
        errcode: 0,
        errmsg: 'ok',
        userid: data.userid || userId,
        name: data.name || '未知用户',
        department: data.department || [],
        position: data.position || '员工',
        mobile: data.mobile || '',
        avatar: data.avatar,
        thumb_avatar: data.thumb_avatar,
        email: data.email,
        is_star_user: data.is_star_user,
        status: data.status,
      };
    }
    console.error('Failed to get user detail:', data);
    return null;
  } catch (error) {
    console.error('Error getting user detail:', error);
    return null;
  }
}

interface WeComUserInfo {
  errcode: number;
  errmsg: string;
  userid: string;
  name: string;
  department: number[];
  position: string;
  mobile: string;
  email?: string;
  avatar?: string;
  thumb_avatar?: string;
  is_star_user?: number;
  status?: number;
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
  if (state !== 'wecom_sso') {
    return res.status(400).json({ success: false, message: 'Invalid state parameter' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing code parameter' });
  }

  try {
    // 获取 Access Token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return res.status(500).json({ success: false, message: 'Failed to get access token' });
    }

    // 通过 code 获取用户信息 (OAuth2 自建应用方式)
    const userInfo = await getUserInfoByOAuthCode(code, accessToken);
    if (!userInfo) {
      return res.status(401).json({ success: false, message: 'Failed to get user info' });
    }

    // 返回用户信息给前端
    return res.status(200).json({
      success: true,
      user: {
        userid: userInfo.userid,
        name: userInfo.name,
        department: userInfo.department,
        position: userInfo.position,
        mobile: userInfo.mobile,
        email: userInfo.email,
        avatar: userInfo.avatar || userInfo.thumb_avatar,
      },
    });
  } catch (error) {
    console.error('WeCom auth error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
