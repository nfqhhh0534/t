import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// 微信公众号服务器验证 API
// 文档: https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Access_Overview.html
// 此 API 用于微信后台配置服务器地址时的验证

const WX_TOKEN = process.env.WX_TOKEN || 'mywechattoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // 微信服务器验证参数
  const { signature, timestamp, nonce, echostr } = req.query;

  console.log('🔍 微信服务器验证请求:');
  console.log('  - signature:', signature);
  console.log('  - timestamp:', timestamp);
  console.log('  - nonce:', nonce);
  console.log('  - echostr:', echostr);

  // 验证参数完整性
  if (!signature || !timestamp || !nonce || !echostr) {
    console.error('❌ 缺少必要的验证参数');
    return res.status(400).send('Missing required parameters');
  }

  // 微信的加密规则：把 token, timestamp, nonce 三个按字典序排序并拼接
  const str = [WX_TOKEN, timestamp, nonce].sort().join('');

  // 进行 sha1 加密
  const hash = crypto.createHash('sha1').update(str).digest('hex');

  console.log('🔐 计算的 hash:', hash);
  console.log('📨 微信传来的 signature:', signature);

  // 把算出来的 hash 和微信传过来的 signature 对比
  if (hash === signature) {
    console.log('✅ 签名验证成功');
    // 暗号对上了！必须原样返回 echostr
    return res.status(200).send(echostr);
  } else {
    console.error('❌ 签名验证失败');
    // 暗号不对，拦截
    return res.status(401).send('Invalid signature');
  }
}
