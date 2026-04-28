// 企业微信 OAuth SSO 服务
// 文档: https://developer.work.weixin.qq.com/document/path/91335

const WECOM_CORP_ID = import.meta.env.VITE_WECOM_CORP_ID || 'wx21bbb81b5b1b8a95';
const WECOM_AGENT_ID = import.meta.env.VITE_WECOM_AGENT_ID || '1000355';

export interface WeComUserInfo {
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
  telephone?: string;
  alias?: string;
  is_leader_in_dept?: number[];
  is_star_user?: number;
  status?: number;
  address?: string;
  extattr?: {
    attrs?: Array<{ name: string; value: string }>;
  };
}

export interface WeComAuthResult {
  code: string;
  state: string;
}

// 获取企业微信 OAuth 授权链接
export function getWeComAuthUrl(redirectUri: string, state: string = 'wecom_sso'): string {
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  return `https://open.work.weixin.qq.com/wwopen/sso/3rd_proxy.html?appid=${WECOM_CORP_ID}&agentid=${WECOM_AGENT_ID}&redirect_uri=${encodedRedirectUri}&state=${state}`;
}

// 通过 code 获取用户信息
export async function getWeComUserInfoByCode(code: string): Promise<WeComUserInfo | null> {
  try {
    // 在实际环境中，需要后端调用此接口
    // 因为 CorpSecret 不应该在前端暴露
    // 这里模拟返回用户信息，实际使用时需要通过后端代理
    const response = await fetch(`/api/wecom/userinfo?code=${code}`);
    
    if (!response.ok) {
      console.error('Failed to get WeCom user info');
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting WeCom user info:', error);
    return null;
  }
}

// 获取 Access Token (需要后端调用)
export async function getWeComAccessToken(): Promise<string | null> {
  // 此接口需要后端调用，因为 Secret 不能暴露在前端
  // 实际部署时需要在 Vercel 后端或 Edge Function 中实现
  console.warn('getWeComAccessToken should be called from backend');
  return null;
}

// 解析 URL 中的授权码
export function parseAuthCallback(): WeComAuthResult | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  if (code && state) {
    return { code, state };
  }
  return null;
}

// 清除 URL 中的授权参数
export function clearAuthCallbackParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState({}, '', url.toString());
}

// 检查是否启用了企业微信 SSO
export function isWeComSSOEnabled(): boolean {
  return !!(
    import.meta.env.VITE_WECOM_CORP_ID ||
    import.meta.env.VITE_WECOM_AGENT_ID ||
    (WECOM_CORP_ID && WECOM_AGENT_ID)
  );
}

export const wecomConfig = {
  corpId: WECOM_CORP_ID,
  agentId: WECOM_AGENT_ID,
};
